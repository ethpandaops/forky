import Graphology from 'graphology';
import { Attributes } from 'graphology-types';

import { ForkChoiceNode, ForkChoiceData } from '@app/types/api';
import { getCheckpointType } from '@app/utils/api';

export type Graph = Graphology<NodeAttributes, EdgeAttributes, GraphAttributes>;

export type WeightedGraph = Graphology<WeightedNodeAttributes, EdgeAttributes, GraphAttributes>;

export class GraphError extends Error {
  forkChoiceNode?: ForkChoiceNode;

  constructor(msg: string, forkChoiceNode?: ForkChoiceNode) {
    super(msg);
    this.forkChoiceNode = forkChoiceNode;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, GraphError.prototype);
  }
}

export interface NodeAttributes {
  slot: number;
  offset: number;
}

export interface WeightedNodeAttributes extends NodeAttributes {
  canonical: boolean;
  checkpoint?: 'finalized' | 'justified';
  validity: 'valid' | string;
  orphaned?: boolean;
  blockRoot: string;
  weight: bigint;
  weightPercentageComparedToHeaviestNeighbor: number;
}

export interface EdgeAttributes {
  directed: boolean;
  distance: number;
}

export interface GraphAttributes {
  slotStart: number;
  slotEnd: number;
  forks: number;
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

export function applyWeightedNodeOffsetToAllChildren(
  graph: WeightedGraph,
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
    applyWeightedNodeOffsetToAllChildren(graph, children[0], currentOffset, direction);
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
    applyWeightedNodeOffsetToAllChildren(graph, blockRoot, offset, direction);
    acc += height;
    return acc;
  }, 0);
}

export function weightedGraphFromData(data: ForkChoiceData): WeightedGraph {
  const graph = new Graphology<WeightedNodeAttributes, EdgeAttributes, GraphAttributes>();

  graph.updateAttributes((current) => ({
    ...current,
    slotStart: 0,
    slotEnd: 0,
    forks: 0,
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
  const forkChoiceNodes: Record<ForkChoiceNode['block_root'], ForkChoiceNode> = {};

  // iterate over nodes and add them to the graph
  for (const forkChoiceNode of sortedData) {
    const slot = Number.parseInt(forkChoiceNode.slot);
    if (isNaN(slot) || slot < 0) {
      throw new GraphError('Invalid slot', forkChoiceNode);
    }

    forkChoiceNodes[forkChoiceNode.block_root] = forkChoiceNode;
    graph.setAttribute('slotEnd', Math.max(graph.getAttribute('slotEnd'), slot));
    graph.setAttribute(
      'slotStart',
      graph.getAttribute('slotStart') === 0
        ? slot
        : Math.min(graph.getAttribute('slotStart'), slot),
    );

    graph.addNode(forkChoiceNode.block_root, {
      slot: slot,
      canonical: true,
      blockRoot: forkChoiceNode.block_root,
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

  // orphaned nodes can occur when a node has a parent before the finalized slot
  const orphanedNodes: {
    slot: number;
    blockRoot: string;
    highestOffset: number;
    lowestOffset: number;
  }[] = [];

  // iterate over nodes again and add edges
  graph.mapNodes((node) => {
    const forkChoiceNode = forkChoiceNodes[node];
    if (
      forkChoiceNode.parent_root &&
      forkChoiceNode.block_root !== data.finalized_checkpoint?.root
    ) {
      const parentForkChoiceNode = forkChoiceNodes[forkChoiceNode.parent_root];
      try {
        graph.addDirectedEdge(parentForkChoiceNode.block_root, forkChoiceNode.block_root, {
          directed: true,
          distance:
            Number.parseInt(forkChoiceNode.slot) - Number.parseInt(parentForkChoiceNode.slot),
        });
      } catch (e: unknown) {
        // handle orphaned nodes
        orphanedNodes.push({
          slot: Number.parseInt(forkChoiceNode.slot),
          blockRoot: forkChoiceNode.block_root,
          highestOffset: 0,
          lowestOffset: 0,
        });
        graph.updateNodeAttribute(node, 'orphaned', () => true);
      }
    }
  });

  const forks: {
    slot: number;
    parentSlot: number;
    parentBlockRoot: ForkChoiceNode['block_root'];
    blockRoot: ForkChoiceNode['block_root'];
    height: number;
    lastSlot: number;
  }[] = [];

  // find all forks along the canonical chain
  // sort by slot to move along the graph in order to know if a node is canonical
  graph
    .nodes()
    .sort((a, b) => graph.getNodeAttribute(a, 'slot') - graph.getNodeAttribute(b, 'slot'))
    .forEach((node) => {
      const forkChoiceNode = forkChoiceNodes[node];
      const neighbors = graph.outNeighbors(node);
      if (neighbors.length > 1) {
        const highestWeightedNeighor = highestWeightedNode(graph, neighbors);
        neighbors.forEach((child) => {
          if (graph.getNodeAttribute(node, 'canonical')) {
            if (highestWeightedNeighor === child) return;
          }
          if (child !== highestWeightedNeighor) {
            let percentage = 0;
            if (graph.getNodeAttribute(highestWeightedNeighor, 'weight') !== 0n) {
              percentage =
                Number.parseInt(
                  (
                    (graph.getNodeAttribute(child, 'weight') * 10000n) /
                    graph.getNodeAttribute(highestWeightedNeighor, 'weight')
                  ).toString(),
                ) / 100;
            }
            graph.updateNodeAttribute(
              child,
              'weightPercentageComparedToHeaviestNeighbor',
              () => percentage,
            );
          }

          if (graph.getNodeAttribute(node, 'canonical')) {
            const childForChoiceNode = forkChoiceNodes[child];

            forks.push({
              slot: Number.parseInt(childForChoiceNode.slot),
              parentSlot: Number.parseInt(forkChoiceNode.slot),
              parentBlockRoot: forkChoiceNode.block_root,
              blockRoot: child,
              height: 1 + countForksFromNode(graph, child),
              lastSlot: getLastSlotFromNode(graph, child),
            });

            graph.updateNodeAttribute(child, 'canonical', () => false);
            applyNodeAttributeToAllChildren<WeightedNodeAttributes>(
              graph,
              child,
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

  // sort by highest slot and block root to work backwards
  forks.sort((a, b) => {
    if (a.parentSlot !== b.parentSlot) {
      return b.parentSlot - a.parentSlot;
    }
    // order by longest fork first
    if (a.lastSlot !== b.lastSlot) {
      return b.lastSlot - a.lastSlot;
    }

    return a.blockRoot.localeCompare(b.blockRoot);
  });

  // work out if the fork should go top or bottom based on height and last slot overlap
  const initialForkOffset: Record<ForkChoiceNode['block_root'], number> = {};

  forks.forEach(({ blockRoot, parentSlot, lastSlot }, index) => {
    // lookup previous indices to see if they overlap
    const previousOverlappingForks = forks
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
      initialForkOffset[blockRoot] = -1;
    } else if (previousOverlappingForks.length === 1) {
      initialForkOffset[blockRoot] =
        initialForkOffset[previousOverlappingForks[0].blockRoot] > 0 ? -1 : 1;
    } else {
      const { highest, lowest } = previousOverlappingForks.reduce(
        (acc, fork) => {
          let currentOffset = initialForkOffset[fork.blockRoot];
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

      initialForkOffset[blockRoot] = Math.abs(lowest) > highest ? highest + 1 : lowest - 1;
    }
  });

  forks.forEach(({ blockRoot, slot, lastSlot }) => {
    const offset = initialForkOffset[blockRoot];

    graph.updateNodeAttributes(blockRoot, (attributes) => ({
      ...attributes,
      offset,
    }));

    applyWeightedNodeOffsetToAllChildren(graph, blockRoot, offset, offset > 0 ? 1 : -1);

    // check orphan nodes overlap
    orphanedNodes.forEach((node, i) => {
      if (node.slot >= slot || node.slot <= lastSlot) {
        orphanedNodes[i][offset > 0 ? 'highestOffset' : 'lowestOffset'] = offset;
      }
    });
  });

  // offset orphan nodes outside of any forks
  orphanedNodes
    .sort((a, b) => a.slot - b.slot)
    .forEach((node, i) => {
      graph.updateNodeAttribute(node.blockRoot, 'offset', () => {
        // handle orphan nodes that are at the same slot
        const previousOrphan = orphanedNodes[i - 1];
        if (previousOrphan && previousOrphan.slot === node.slot) {
          const previousOffset = graph.getNodeAttribute(previousOrphan.blockRoot, 'offset');
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
  return graph;
}
