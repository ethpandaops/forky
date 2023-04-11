import Graphology from 'graphology';
import { Attributes } from 'graphology-types';

import { ForkChoiceNode, Frame } from '@app/types/api';
import {
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
  return Math.max(...children.map((child) => getLastSlotFromNode(graph, child)));
}

export function countForksFromNode(graph: Graph, node: string): number {
  const children = graph.outNeighbors(node);
  if (children.length === 0) {
    return 0;
  }
  return (
    children.map((child) => countForksFromNode(graph, child)).reduce((a, b) => a + b, 0) +
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

  neighbors.forEach((childId) => {
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
    graph.updateNodeAttributes(children[0], (attributes) => ({
      ...attributes,
      canonical: false,
      offset: currentOffset,
    }));
    applyNodeOffsetToAllChildren(graph, children[0], currentOffset, direction);
    return;
  }

  const ordered = children
    .map((child) => ({
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
    graph.updateNodeAttributes(blockRoot, (attributes) => ({
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
      .filter((fork) => {
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

    graph.updateNodeAttributes(nodeId, (attributes) => ({
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

export function processForkChoiceData(frame: Required<Frame>): ProcessedData {
  const { data, metadata } = frame;
  const graph = new Graphology<WeightedNodeAttributes, EdgeAttributes, WeightedGraphAttributes>();

  graph.updateAttributes((current) => ({
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
  const sortedData = data.fork_choice_nodes.sort((a, b) => {
    return Number.parseInt(b.slot) - Number.parseInt(a.slot);
  });

  // map block roots to fork choice nodes
  const forkChoiceNodes: Record<string, ForkChoiceNode> = {};

  // map block roots to node ids
  const blockRootNodeIds: Record<string, string> = {};

  // iterate over nodes and add them to the graph
  for (const forkChoiceNode of sortedData) {
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
  graph.forEachNode((nodeId) => {
    const forkChoiceNode = forkChoiceNodes[nodeId];
    if (
      forkChoiceNode.parent_root &&
      forkChoiceNode.block_root !== data.finalized_checkpoint?.root
    ) {
      try {
        const parentNodeId = blockRootNodeIds[forkChoiceNode.parent_root];
        const parentForkChoiceNode = forkChoiceNodes[parentNodeId];
        graph.addDirectedEdge(parentNodeId, nodeId, {
          directed: true,
          distance:
            Number.parseInt(forkChoiceNode.slot) - Number.parseInt(parentForkChoiceNode.slot),
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
  graph.nodes().forEach((nodeId) => {
    const forkChoiceNode = forkChoiceNodes[nodeId];
    const neighbors = graph.outNeighbors(nodeId);
    if (neighbors.length > 1) {
      const highestWeightedNeighor = highestWeightedNode(graph, neighbors);
      neighbors.forEach((childNodeId) => {
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

        graph.updateAttributes((attributes) => ({
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

  return { graph, frame };
}

export function aggregateProcessedData(data: ProcessedData[]): AggregatedGraph {
  const graph = new Graphology<
    AggregatedNodeAttributes,
    EdgeAttributes,
    AggregatedGraphAttributes
  >();

  graph.updateAttributes((attributes) => ({
    ...attributes,
    slotStart: 0,
    slotEnd: 0,
    nodes: [],
    id: data.map((d) => d.frame.metadata.id).join('-'),
    type: 'aggregated',
  }));

  // orphaned nodes can occur when a node has a parent before the finalized slot
  let orphanedNodes: OrphanReference[] = [];

  data.forEach(({ frame: { metadata, data: frameData }, graph: weightedGraph }) => {
    const nodeMap: Record<string, { id: string; slot: number }> = {};
    let head: WeightedNodeAttributes | undefined;
    weightedGraph.nodes().forEach((blockRoot) => {
      const node = weightedGraph.getNodeAttributes(blockRoot);
      if (node.slot > (head?.slot ?? 0) && node.canonical) {
        head = node;
      }

      const nodeId = generateNodeId(node);
      nodeMap[node.blockRoot] = { id: nodeId, slot: node.slot };

      // handle duplicate nodes
      if (graph.hasNode(nodeId)) {
        graph.updateNodeAttributes(nodeId, (attributes) => ({
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
        });
      }
      // check if parent exists to add edge
      if (node.parentRoot && nodeMap[node.parentRoot]) {
        if (!graph.hasEdge(nodeMap[node.parentRoot].id, nodeId)) {
          graph.addDirectedEdge(nodeMap[node.parentRoot].id, nodeId, {
            directed: true,
            distance: node.slot - nodeMap[node.parentRoot].slot,
          });
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
    graph.updateAttribute('nodes', (attribute) => {
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
  orphanedNodes = orphanedNodes.filter((node) => graph.hasEdge(node.nodeId));

  const forks: ForkReference[] = [];

  graph
    .nodes()
    .sort((a, b) => graph.getNodeAttribute(a, 'slot') - graph.getNodeAttribute(b, 'slot'))
    .forEach((node) => {
      const neighbors = graph.outNeighbors(node);
      if (neighbors.length > 1) {
        const highestAggegatedNeighor = highestAggregatedNode(graph, neighbors);
        neighbors.forEach((child) => {
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
    .map((d) => d.graph.getAttribute('head'))
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

  return graph;
}
