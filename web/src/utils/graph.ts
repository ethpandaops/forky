import Graphology from 'graphology';
import { Attributes } from 'graphology-types';

import { ForkChoiceNode, Frame } from '@api';
import {
  BlockPayload,
  Graph,
  WeightedGraph,
  WeightedNodeAttributes,
  EdgeAttributes,
  WeightedGraphAttributes,
  AggregatedGraph,
  AggregatedNodeAttributes,
  AggregatedGraphAttributes,
  ProcessedData,
  OrphanReference,
  ForkReference,
} from '@app/types/graph';
import { getCheckpointType } from '@app/utils/api';
import { payloadProgress, payloadStage } from '@app/utils/payload';

// A node whose fork choice head is more than this many slots behind its own
// metadata wall clock slot is considered "stuck" and is excluded from the
// aggregated graph (otherwise it drags slotStart back thousands of slots and
// the timeline tries to render every slot in between). Tweak to taste.
export const SLOTS_BEHIND_THRESHOLD = 5 * 32; // ~5 epochs

// Maximum number of slots to render in a graph. When a graph spans more than
// this (e.g. viewing a single node whose head is thousands of slots ahead of
// its finalized tail), only the most recent MAX_GRAPH_SLOTS worth of slots are
// shown — the tail is truncated so the timeline stays responsive. e.g. head at
// slot 10000 only renders 9872-10000.
export const MAX_GRAPH_SLOTS = 128;

// The slot of a frame's canonical head. Falls back to the highest slot present
// in the graph if no canonical head was resolved.
export function getFrameHeadSlot(graph: WeightedGraph): number {
  try {
    const headId = graph.getAttribute('head');
    if (headId) return graph.getNodeAttribute(headId, 'slot');
  } catch {
    // no resolvable head, fall through to max slot
  }
  let maxSlot = 0;
  graph.forEachNode((_node, attributes) => {
    if (attributes.slot > maxSlot) maxSlot = attributes.slot;
  });
  return maxSlot;
}

// How many slots a frame's head is behind its own metadata wall clock slot.
export function getFrameSlotsBehind(frame: ProcessedData): number {
  return frame.frame.metadata.wall_clock_slot - getFrameHeadSlot(frame.graph);
}

// Splits frames into those that are current enough to render and those that are
// too far behind (e.g. a syncing/stuck node) to include in the aggregated view.
export function partitionFramesBySlotLag(
  frames: ProcessedData[],
  threshold: number = SLOTS_BEHIND_THRESHOLD,
): { live: ProcessedData[]; behind: ProcessedData[] } {
  const live: ProcessedData[] = [];
  const behind: ProcessedData[] = [];
  for (const frame of frames) {
    if (getFrameSlotsBehind(frame) > threshold) {
      behind.push(frame);
    } else {
      live.push(frame);
    }
  }
  return { live, behind };
}

export class GraphError extends Error {
  forkChoiceNode?: ForkChoiceNode;

  constructor(msg: string, forkChoiceNode?: ForkChoiceNode) {
    super(msg);
    this.forkChoiceNode = forkChoiceNode;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, GraphError.prototype);
  }
}

export function isAggregatedGraph(graph?: Graph): graph is AggregatedGraph {
  return graph?.getAttribute('type') === 'aggregated';
}

export function isWeightedGraph(graph?: Graph): graph is WeightedGraph {
  return graph?.getAttribute('type') === 'weighted';
}

export function getLastSlotFromNode(graph: Graph, node: string): number {
  const children = graph.outNeighbors(node);
  if (children.length === 0) {
    return graph.getNodeAttribute(node, 'slot');
  }
  return Math.max(...children.map(child => getLastSlotFromNode(graph, child)));
}

export function countForksFromNode(graph: Graph, node: string): number {
  const children = graph.outNeighbors(node);
  if (children.length === 0) {
    return 0;
  }
  return (
    children.map(child => countForksFromNode(graph, child)).reduce((a, b) => a + b, 0) +
    children.length -
    1
  );
}

export function highestWeightedNode(graph: WeightedGraph, nodes: string[]): string {
  return nodes.reduce((a, b) => {
    const weightA = graph.getNodeAttribute(a, 'weight');
    const weightB = graph.getNodeAttribute(b, 'weight');
    if (weightA >= weightB) {
      return a;
    } else {
      return b;
    }
  });
}

export function highestAggregatedNode(graph: AggregatedGraph, nodes: string[]): string {
  return nodes.reduce((a, b) => {
    const {
      highestWeight: highestWeightA,
      seenByNodes: seenByNodesA,
      canonicalForNodes: canonicalForNodesA,
      blockRoot: blockRootA,
    } = graph.getNodeAttributes(a);
    const {
      highestWeight: highestWeightB,
      seenByNodes: seenByNodesB,
      canonicalForNodes: canonicalForNodesB,
      blockRoot: blockRootB,
    } = graph.getNodeAttributes(b);
    if (canonicalForNodesA.length !== canonicalForNodesB.length) {
      return canonicalForNodesA.length > canonicalForNodesB.length ? a : b;
    }
    if (highestWeightA !== highestWeightB) {
      return highestWeightA > highestWeightB ? a : b;
    }
    if (seenByNodesA.length !== seenByNodesB.length) {
      return seenByNodesA.length > seenByNodesB.length ? a : b;
    }
    return blockRootA.localeCompare(blockRootB) > 0 ? a : b;
  });
}

export function applyNodeAttributeToAllChildren<T extends Attributes>(
  graph: Graphology<T, Attributes, Attributes>,
  id: string,
  key: keyof T,
  value: T[keyof T],
): void {
  const neighbors = graph.outNeighbors(id);

  neighbors.forEach(childId => {
    graph.updateNodeAttribute(childId, key, () => value);
    applyNodeAttributeToAllChildren<T>(graph, childId, key, value);
  });
}

export function applyNodeOffsetToAllChildren(
  graph: Graph,
  node: string,
  currentOffset: number,
  direction: number,
) {
  const children = graph.outNeighbors(node);

  if (children.length === 0) return;

  if (children.length === 1) {
    graph.updateNodeAttributes(children[0], attributes => ({
      ...attributes,
      canonical: false,
      offset: currentOffset,
    }));
    applyNodeOffsetToAllChildren(graph, children[0], currentOffset, direction);
    return;
  }

  const ordered = children
    .map(child => ({
      blockRoot: child,
      height: 1 + countForksFromNode(graph, child),
      lastSlot: getLastSlotFromNode(graph, child),
    }))
    .sort((a, b) => {
      if (a.lastSlot !== b.lastSlot) {
        return b.lastSlot - a.lastSlot;
      }
      if (a.height !== b.height) {
        return b.height - a.height;
      }
      return a.blockRoot.localeCompare(b.blockRoot);
    });

  ordered.reduce((acc, { blockRoot, height }) => {
    const offset = currentOffset + acc * direction;
    graph.updateNodeAttributes(blockRoot, attributes => ({
      ...attributes,
      canonical: false,
      offset: offset,
    }));
    applyNodeOffsetToAllChildren(graph, blockRoot, offset, direction);
    acc += height;
    return acc;
  }, 0);
}

export function applyOrphanNodeOffset(graph: Graph, orphanReferences: OrphanReference[]) {
  orphanReferences
    .sort((a, b) => a.slot - b.slot)
    .forEach((node, i) => {
      graph.updateNodeAttribute(node.nodeId, 'offset', () => {
        // handle orphan nodes that are at the same slot
        const previousOrphan = orphanReferences[i - 1];
        if (previousOrphan && previousOrphan.slot === node.slot) {
          const previousOffset = graph.getNodeAttribute(previousOrphan.nodeId, 'offset');
          if (previousOffset > 0) {
            return previousOffset + 1;
          }
          return previousOffset - 1;
        }

        // get the highest offset
        if (Math.abs(node.lowestOffset) > node.highestOffset) {
          return node.highestOffset + 1;
        }
        return node.lowestOffset - 1;
      });
    });
}

export function applyForkNodeOffset(
  graph: Graph,
  forkReferences: ForkReference[],
  orphanReferences: OrphanReference[],
) {
  forkReferences.sort((a, b) => {
    if (a.parentSlot !== b.parentSlot) {
      return b.parentSlot - a.parentSlot;
    }
    // order by longest fork first
    if (a.lastSlot !== b.lastSlot) {
      return b.lastSlot - a.lastSlot;
    }

    return a.nodeId.localeCompare(b.nodeId);
  });

  // work out if the fork should go top or bottom based on height and last slot overlap
  const initialForkOffset: Record<string, number> = {};

  forkReferences.forEach(({ nodeId, parentSlot, lastSlot }, index) => {
    // lookup previous indices to see if they overlap
    const previousOverlappingForks = forkReferences
      .slice(0, index)
      .reverse()
      .filter(fork => {
        // find if there is a fork later than current
        if (fork.parentSlot <= lastSlot) {
          return true;
        }

        // find if there is a fork that is a parent of current
        if (fork.lastSlot <= parentSlot) {
          return true;
        }

        return false;
      });

    if (previousOverlappingForks.length === 0) {
      initialForkOffset[nodeId] = -1;
    } else if (previousOverlappingForks.length === 1) {
      initialForkOffset[nodeId] =
        initialForkOffset[previousOverlappingForks[0].nodeId] > 0 ? -1 : 1;
    } else {
      const { highest, lowest } = previousOverlappingForks.reduce(
        (acc, fork) => {
          let currentOffset = initialForkOffset[fork.nodeId];
          if (currentOffset > 0) {
            currentOffset += fork.height - 1;
            if (currentOffset > acc.highest) {
              acc.highest = currentOffset;
            }
          }
          if (currentOffset < 0) {
            currentOffset -= fork.height - 1;
            if (currentOffset < acc.lowest) {
              acc.lowest = currentOffset;
            }
          }

          return acc;
        },
        { highest: 0, lowest: 0 },
      );

      initialForkOffset[nodeId] = Math.abs(lowest) > highest ? highest + 1 : lowest - 1;
    }
  });

  forkReferences.forEach(({ nodeId, slot, lastSlot }) => {
    const offset = initialForkOffset[nodeId];

    graph.updateNodeAttributes(nodeId, attributes => ({
      ...attributes,
      offset,
    }));

    applyNodeOffsetToAllChildren(graph, nodeId, offset, offset > 0 ? 1 : -1);

    // check orphan nodes overlap
    orphanReferences.forEach((node, i) => {
      if (node.slot >= slot || node.slot <= lastSlot) {
        orphanReferences[i][offset > 0 ? 'highestOffset' : 'lowestOffset'] = offset;
      }
    });
  });
}

export function generateNodeId({
  slot,
  blockRoot,
  parentRoot,
}: {
  slot: number;
  blockRoot: string;
  parentRoot?: string;
}): string {
  return `${slot}_${blockRoot}_${parentRoot}`;
}

// Reads an optional decimal-string count.
function optionalCount(nodes: ForkChoiceNode[], key: keyof ForkChoiceNode): number | undefined {
  const value = nodes.map(node => node[key]).find(v => v !== undefined);
  return typeof value === 'string' ? Number.parseInt(value) : undefined;
}

// Since Gloas a block can have a pending, an empty and a full fork-choice node,
// which share their slot, block root and parent root. The graph draws one node
// per block: the block's pending node, which carries the weight of all votes
// for the block, with the empty and full nodes summarised as its payload. Frames
// from before forky recorded payload statuses can still hold several nodes per
// block, of which the heaviest is kept.
export function groupBlockNodes(
  nodes: ForkChoiceNode[],
): { node: ForkChoiceNode; payload?: BlockPayload }[] {
  const blocks = new Map<string, ForkChoiceNode[]>();
  for (const node of nodes) {
    const variants = blocks.get(node.block_root);
    if (variants) variants.push(node);
    else blocks.set(node.block_root, [node]);
  }

  return [...blocks.values()].map(variants => {
    const pending = variants.find(n => n.payload_status === 'pending');
    const node =
      pending ?? variants.reduce((a, b) => (BigInt(b.weight) > BigInt(a.weight) ? b : a));
    // Every Gloas block has an empty node; a pre-Gloas block is a single
    // node (full per the spec, pending on some clients) with no payload.
    const empty = variants.find(n => n.payload_status === 'empty');
    if (!empty) return { node };

    // The full node only exists once the payload has been received.
    const full = variants.find(n => n.payload_status === 'full');
    const emptyWeight = BigInt(empty.weight);
    const fullWeight = full ? BigInt(full.weight) : undefined;

    let status: BlockPayload['status'];
    if (fullWeight !== undefined && fullWeight > emptyWeight) status = 'full';
    else if (emptyWeight > (fullWeight ?? 0n)) status = 'empty';

    const parent = node.parent_payload_status;

    return {
      node,
      payload: {
        status,
        emptyWeight,
        fullWeight,
        parentPayloadStatus: parent === 'empty' || parent === 'full' ? parent : undefined,
        attesterCount: optionalCount(variants, 'payload_attester_count'),
        availabilityYesCount: optionalCount(variants, 'payload_availability_yes_count'),
        dataAvailabilityYesCount: optionalCount(variants, 'payload_data_availability_yes_count'),
      },
    };
  });
}

export function processForkChoiceData(frame: Required<Frame>): ProcessedData {
  const { data, metadata } = frame;
  const graph = new Graphology<WeightedNodeAttributes, EdgeAttributes, WeightedGraphAttributes>();

  graph.updateAttributes(current => ({
    ...current,
    slotStart: 0,
    slotEnd: 0,
    forks: 0,
    id: metadata.id,
    type: 'weighted',
  }));

  if (
    data.fork_choice_nodes === undefined ||
    data.fork_choice_nodes.length === 0 ||
    data.finalized_checkpoint === undefined ||
    data.justified_checkpoint === undefined
  ) {
    throw new GraphError('Invalid data payload');
  }

  // reverse sort data by highest slot first to later iterate over it
  // and stop when hitting the finalized checkpoint
  const sortedData = groupBlockNodes(data.fork_choice_nodes).sort((a, b) => {
    return Number.parseInt(b.node.slot) - Number.parseInt(a.node.slot);
  });

  // map block roots to fork choice nodes
  const forkChoiceNodes: Record<string, ForkChoiceNode> = {};

  // map block roots to node ids
  const blockRootNodeIds: Record<string, string> = {};

  // iterate over nodes and add them to the graph
  for (const { node: forkChoiceNode, payload } of sortedData) {
    const slot = Number.parseInt(forkChoiceNode.slot);
    if (isNaN(slot) || slot < 0) {
      throw new GraphError('Invalid slot', forkChoiceNode);
    }

    const nodeId = generateNodeId({
      slot,
      blockRoot: forkChoiceNode.block_root,
      parentRoot: forkChoiceNode.parent_root,
    });

    blockRootNodeIds[forkChoiceNode.block_root] = nodeId;

    forkChoiceNodes[nodeId] = forkChoiceNode;
    graph.setAttribute('slotEnd', Math.max(graph.getAttribute('slotEnd'), slot));
    graph.setAttribute(
      'slotStart',
      graph.getAttribute('slotStart') === 0
        ? slot
        : Math.min(graph.getAttribute('slotStart'), slot),
    );

    graph.addNode(nodeId, {
      slot: slot,
      canonical: true,
      blockRoot: forkChoiceNode.block_root,
      parentRoot: forkChoiceNode.parent_root,
      checkpoint: getCheckpointType(
        forkChoiceNode.block_root,
        data.finalized_checkpoint.root,
        data.justified_checkpoint.root,
      ),
      validity: forkChoiceNode.validity.toLowerCase(),
      offset: 0,
      weight: BigInt(forkChoiceNode.weight),
      weightPercentageComparedToHeaviestNeighbor: 100,
      payload,
    });

    // don't bother with nodes that are earlier than the finalized slot
    if (forkChoiceNode.block_root === data.finalized_checkpoint.root) {
      break;
    }
  }

  // hack to order by slots internally
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  graph._nodes = new Map(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    [...graph._nodes].sort(([_keyA, a], [_keyB, b]) => {
      return a.attributes.slot - b.attributes.slot;
    }),
  );

  // orphaned nodes can occur when a node has a parent before the finalized slot
  const orphanedNodes: OrphanReference[] = [];

  // iterate over nodes again and add edges
  graph.forEachNode(nodeId => {
    const forkChoiceNode = forkChoiceNodes[nodeId];
    if (
      forkChoiceNode.parent_root &&
      forkChoiceNode.block_root !== data.finalized_checkpoint?.root
    ) {
      try {
        const parentNodeId = blockRootNodeIds[forkChoiceNode.parent_root];
        const parentForkChoiceNode = forkChoiceNodes[parentNodeId];
        graph.addEdge(parentNodeId, nodeId, {
          distance:
            Number.parseInt(forkChoiceNode.slot) - Number.parseInt(parentForkChoiceNode.slot),
          builtOnEmpty: forkChoiceNode.parent_payload_status === 'empty',
        });
      } catch (e: unknown) {
        // handle orphaned nodes
        orphanedNodes.push({
          slot: Number.parseInt(forkChoiceNode.slot),
          nodeId,
          highestOffset: 0,
          lowestOffset: 0,
        });
        graph.updateNodeAttribute(nodeId, 'orphaned', () => true);
      }
    }
  });

  const forks: ForkReference[] = [];

  // find all forks along the canonical chain
  // sort by slot to move along the graph in order to know if a node is canonical
  graph.nodes().forEach(nodeId => {
    const forkChoiceNode = forkChoiceNodes[nodeId];
    const neighbors = graph.outNeighbors(nodeId);
    if (neighbors.length > 1) {
      const highestWeightedNeighor = highestWeightedNode(graph, neighbors);
      neighbors.forEach(childNodeId => {
        if (graph.getNodeAttribute(nodeId, 'canonical')) {
          if (highestWeightedNeighor === childNodeId) return;
        }
        if (childNodeId !== highestWeightedNeighor) {
          let percentage = 0;
          if (graph.getNodeAttribute(highestWeightedNeighor, 'weight') !== 0n) {
            percentage =
              Number.parseInt(
                (
                  (graph.getNodeAttribute(childNodeId, 'weight') * 10000n) /
                  graph.getNodeAttribute(highestWeightedNeighor, 'weight')
                ).toString(),
              ) / 100;
          }
          graph.updateNodeAttribute(
            childNodeId,
            'weightPercentageComparedToHeaviestNeighbor',
            () => percentage,
          );
        }

        if (graph.getNodeAttribute(nodeId, 'canonical')) {
          const childForChoiceNode = forkChoiceNodes[childNodeId];

          forks.push({
            slot: Number.parseInt(childForChoiceNode.slot),
            parentSlot: Number.parseInt(forkChoiceNode.slot),
            nodeId: childNodeId,
            height: 1 + countForksFromNode(graph, childNodeId),
            lastSlot: getLastSlotFromNode(graph, childNodeId),
          });

          graph.updateNodeAttribute(childNodeId, 'canonical', () => false);
          applyNodeAttributeToAllChildren<WeightedNodeAttributes>(
            graph,
            childNodeId,
            'canonical',
            false,
          );
        }

        graph.updateAttributes(attributes => ({
          ...attributes,
          forks: attributes.forks + 1,
        }));
      });
    }
  });

  applyForkNodeOffset(graph, forks, orphanedNodes);
  applyOrphanNodeOffset(graph, orphanedNodes);

  // find canonical head
  const reversedNodes = [...graph.nodes()].reverse();
  for (const nodeId of reversedNodes) {
    if (graph.getNodeAttribute(nodeId, 'canonical')) {
      graph.updateAttribute('head', () => nodeId);
      break;
    }
  }

  // record the finalized/justified checkpoint nodes so they can be pinned into
  // view when the tail is truncated.
  const finalizedId = blockRootNodeIds[data.finalized_checkpoint.root];
  const justifiedId = blockRootNodeIds[data.justified_checkpoint.root];
  if (finalizedId) graph.updateAttribute('finalized', () => finalizedId);
  if (justifiedId) graph.updateAttribute('justified', () => justifiedId);

  return { graph, frame };
}

export function aggregateProcessedData(data: ProcessedData[]): AggregatedGraph {
  const graph = new Graphology<
    AggregatedNodeAttributes,
    EdgeAttributes,
    AggregatedGraphAttributes
  >();

  graph.updateAttributes(attributes => ({
    ...attributes,
    slotStart: 0,
    slotEnd: 0,
    nodes: [],
    id: data.map(d => d.frame.metadata.id).join('-'),
    type: 'aggregated',
  }));

  // orphaned nodes can occur when a node has a parent before the finalized slot
  let orphanedNodes: OrphanReference[] = [];

  data.forEach(({ frame: { metadata, data: frameData }, graph: weightedGraph }) => {
    const nodeMap: Record<string, { id: string; slot: number }> = {};
    let head: WeightedNodeAttributes | undefined;
    weightedGraph.nodes().forEach(blockRoot => {
      const node = weightedGraph.getNodeAttributes(blockRoot);
      if (node.slot > (head?.slot ?? 0) && node.canonical) {
        head = node;
      }

      const nodeId = generateNodeId(node);
      nodeMap[node.blockRoot] = { id: nodeId, slot: node.slot };
      const stage = node.payload ? payloadStage(node.payload) : undefined;
      const payloads =
        node.payload && stage
          ? [{ node: metadata.node, stage, progress: payloadProgress(node.payload, stage) }]
          : [];

      // handle duplicate nodes
      if (graph.hasNode(nodeId)) {
        graph.updateNodeAttributes(nodeId, attributes => ({
          ...attributes,
          canonical: attributes.canonical || node.canonical,
          checkpoints: node.checkpoint
            ? [...attributes.checkpoints, { node: metadata.node, checkpoint: node.checkpoint }]
            : attributes.checkpoints,
          validities: [...attributes.validities, { node: metadata.node, validity: node.validity }],
          orphaned: node.orphaned ? [...attributes.orphaned, metadata.node] : attributes.orphaned,
          highestWeight:
            node.weight > attributes.highestWeight ? node.weight : attributes.highestWeight,
          canonicalForNodes: node.canonical
            ? [...attributes.canonicalForNodes, metadata.node]
            : attributes.canonicalForNodes,
          seenByNodes: [...attributes.seenByNodes, metadata.node],
          payloads: [...attributes.payloads, ...payloads],
        }));
      } else {
        graph.setAttribute('slotEnd', Math.max(graph.getAttribute('slotEnd'), node.slot));
        graph.setAttribute(
          'slotStart',
          graph.getAttribute('slotStart') === 0
            ? node.slot
            : Math.min(graph.getAttribute('slotStart'), node.slot),
        );
        graph.addNode(nodeId, {
          slot: node.slot,
          offset: 0, // will be updated later
          canonical: true, // defaults true
          checkpoints: node.checkpoint
            ? [{ node: metadata.node, checkpoint: node.checkpoint }]
            : [],
          validities: [{ node: metadata.node, validity: node.validity }],
          orphaned: node.orphaned ? [metadata.node] : [],
          blockRoot: node.blockRoot,
          highestWeight: node.weight,
          canonicalForNodes: node.canonical ? [metadata.node] : [],
          seenByNodes: [metadata.node],
          payloads,
        });
      }
      // check if parent exists to add edge
      if (node.parentRoot && nodeMap[node.parentRoot]) {
        const parentId = nodeMap[node.parentRoot].id;
        // node ids are derived from the block, so they match across graphs.
        const builtOnEmpty =
          weightedGraph.hasEdge(parentId, nodeId) &&
          weightedGraph.getEdgeAttribute(parentId, nodeId, 'builtOnEmpty') === true;
        if (!graph.hasEdge(parentId, nodeId)) {
          graph.addEdge(parentId, nodeId, {
            distance: node.slot - nodeMap[node.parentRoot].slot,
            builtOnEmpty,
          });
        } else if (builtOnEmpty) {
          graph.setEdgeAttribute(parentId, nodeId, 'builtOnEmpty', true);
        }
      } else {
        orphanedNodes.push({
          slot: node.slot,
          nodeId,
          highestOffset: 0,
          lowestOffset: 0,
        });
      }
    });
    graph.updateAttribute('nodes', attribute => {
      return [
        ...(attribute ?? []),
        {
          metadata: metadata,
          head,
          forks: weightedGraph.getAttribute('forks') ?? 0,
          justifiedCheckpoint: frameData.justified_checkpoint,
          finalizedCheckpoint: frameData.finalized_checkpoint,
        },
      ];
    });
  });

  // check if orphaned nodes are actually connected to the graph after iterating through all the nodes
  orphanedNodes = orphanedNodes.filter(node => graph.hasEdge(node.nodeId));

  const forks: ForkReference[] = [];

  graph
    .nodes()
    .sort((a, b) => graph.getNodeAttribute(a, 'slot') - graph.getNodeAttribute(b, 'slot'))
    .forEach(node => {
      const neighbors = graph.outNeighbors(node);
      if (neighbors.length > 1) {
        const highestAggegatedNeighor = highestAggregatedNode(graph, neighbors);
        neighbors.forEach(child => {
          if (graph.getNodeAttribute(node, 'canonical')) {
            if (highestAggegatedNeighor === child) return;
          }

          if (graph.getNodeAttribute(node, 'canonical')) {
            forks.push({
              slot: graph.getNodeAttribute(child, 'slot'),
              parentSlot: graph.getNodeAttribute(node, 'slot'),
              nodeId: child,
              height: 1 + countForksFromNode(graph, child),
              lastSlot: getLastSlotFromNode(graph, child),
            });

            graph.updateNodeAttribute(child, 'canonical', () => false);
            applyNodeAttributeToAllChildren<AggregatedNodeAttributes>(
              graph,
              child,
              'canonical',
              false,
            );
          }
        });
      }
    });

  applyForkNodeOffset(graph, forks, orphanedNodes);
  applyOrphanNodeOffset(graph, orphanedNodes);

  // find canonical head
  const head = data
    .map(d => d.graph.getAttribute('head'))
    // head is prefixed by slot so reverse sort to get highest slot
    .sort((a, b) => {
      if (a === undefined) {
        return 1;
      }
      if (b === undefined) {
        return -1;
      }
      return b.localeCompare(a);
    })
    .reduce<string | undefined>((acc, nodeId) => {
      if (acc !== undefined) return acc;
      if (graph.getNodeAttribute(nodeId, 'canonical')) acc = nodeId;
      return acc;
    }, undefined);

  if (head) graph.updateAttribute('head', () => head);

  // resolve the consensus finalized/justified checkpoint: the node the most
  // sources agree on for each type (tie broken by highest slot). Pinned into
  // view when the tail is truncated.
  const consensusCheckpoint = (type: 'finalized' | 'justified'): string | undefined => {
    let best: string | undefined;
    let bestVotes = 0;
    graph.forEachNode((nodeId, attributes) => {
      const votes = attributes.checkpoints.filter(c => c.checkpoint === type).length;
      if (votes === 0) return;
      if (
        votes > bestVotes ||
        (votes === bestVotes &&
          best !== undefined &&
          attributes.slot > graph.getNodeAttribute(best, 'slot'))
      ) {
        best = nodeId;
        bestVotes = votes;
      }
    });
    return best;
  };

  const finalized = consensusCheckpoint('finalized');
  const justified = consensusCheckpoint('justified');
  if (finalized) graph.updateAttribute('finalized', () => finalized);
  if (justified) graph.updateAttribute('justified', () => justified);

  return graph;
}
