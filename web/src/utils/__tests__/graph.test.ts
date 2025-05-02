import Graphology from 'graphology';

import { Frame } from '@app/types/api';
import {
  NodeAttributes,
  WeightedNodeAttributes,
  EdgeAttributes,
  WeightedGraphAttributes,
} from '@app/types/graph';
import {
  getLastSlotFromNode,
  countForksFromNode,
  highestWeightedNode,
  applyNodeAttributeToAllChildren,
  applyNodeOffsetToAllChildren,
  processForkChoiceData,
  GraphError,
  generateNodeId,
} from '@utils/graph';

function generateWeightedNodeAttributes(
  slot: number,
  offset: number,
  weight: bigint,
  blockRoot: string,
): WeightedNodeAttributes {
  return {
    slot,
    offset,
    weight,
    canonical: true,
    validity: 'valid',
    weightPercentageComparedToHeaviestNeighbor: 100,
    blockRoot,
  };
}

describe('graph', () => {
  describe('getLastSlotFromNode', () => {
    it('should return itself when no children', () => {
      const graph = new Graphology<NodeAttributes, EdgeAttributes, WeightedGraphAttributes>();

      // Adding nodes
      graph.addNode('A', { slot: 1, offset: 0, canonical: true, blockRoot: '0x' });

      const result = getLastSlotFromNode(graph, 'A');
      expect(result).toBe(1);
    });

    it('should return last slot with no forks', () => {
      const graph = new Graphology<NodeAttributes, EdgeAttributes, WeightedGraphAttributes>();

      // Adding nodes
      graph.addNode('A', { slot: 1, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('B', { slot: 2, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('C', { slot: 3, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('D', { slot: 4, offset: 0, canonical: true, blockRoot: '0x' });

      // Adding edges
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');

      const result = getLastSlotFromNode(graph, 'A');
      expect(result).toBe(4);
    });

    it('should return last slot with forks', () => {
      const graph = new Graphology<NodeAttributes, EdgeAttributes, WeightedGraphAttributes>();

      // Adding nodes
      graph.addNode('A', { slot: 1, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('B', { slot: 2, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('C', { slot: 3, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('D', { slot: 4, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('E', { slot: 5, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('F', { slot: 6, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('G', { slot: 7, offset: 0, canonical: true, blockRoot: '0x' });

      // Adding edges
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');
      graph.addEdge('C', 'E');
      graph.addEdge('E', 'F');
      graph.addEdge('D', 'G');

      const result = getLastSlotFromNode(graph, 'A');
      expect(result).toBe(7);
    });
  });

  describe('countForksFromNode', () => {
    it('should return 0 when no children', () => {
      const graph = new Graphology<NodeAttributes, EdgeAttributes, WeightedGraphAttributes>();

      // Adding nodes
      graph.addNode('A', { slot: 1, offset: 0, canonical: true, blockRoot: '0x' });

      const result = countForksFromNode(graph, 'A');
      expect(result).toBe(0);
    });

    it('should return 0 when no forks', () => {
      const graph = new Graphology<NodeAttributes, EdgeAttributes, WeightedGraphAttributes>();

      // Adding nodes
      graph.addNode('A', { slot: 1, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('B', { slot: 2, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('C', { slot: 3, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('D', { slot: 4, offset: 0, canonical: true, blockRoot: '0x' });

      // Adding edges
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');

      const result = countForksFromNode(graph, 'A');
      expect(result).toBe(0);
    });

    it('should return the correct number of forks', () => {
      const graph = new Graphology<NodeAttributes, EdgeAttributes, WeightedGraphAttributes>();

      // Adding nodes
      graph.addNode('A', { slot: 1, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('B', { slot: 2, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('C', { slot: 3, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('D', { slot: 4, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('E', { slot: 5, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('F', { slot: 6, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('G', { slot: 7, offset: 0, canonical: true, blockRoot: '0x' });

      // Adding edges
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      // first fork
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'E');
      graph.addEdge('D', 'F');
      // second fork
      graph.addEdge('D', 'G');

      const result = countForksFromNode(graph, 'A');
      expect(result).toBe(2);
    });
  });

  describe('highestWeightedNode', () => {
    it('should return the node with the highest weight', () => {
      const graph = new Graphology<
        WeightedNodeAttributes,
        EdgeAttributes,
        WeightedGraphAttributes
      >();

      // Adding nodes
      graph.addNode('A', generateWeightedNodeAttributes(1, 0, 10n, 'A'));
      graph.addNode('B', generateWeightedNodeAttributes(2, 0, 20n, 'B'));
      graph.addNode('C', generateWeightedNodeAttributes(3, 0, 30n, 'C'));
      graph.addNode('D', generateWeightedNodeAttributes(4, 0, 40n, 'D'));

      const result = highestWeightedNode(graph, ['A', 'B', 'C', 'D']);
      expect(result).toBe('D');
    });

    it('should return the first node when all weights are equal', () => {
      const graph = new Graphology<
        WeightedNodeAttributes,
        EdgeAttributes,
        WeightedGraphAttributes
      >();

      // Adding nodes
      graph.addNode('A', generateWeightedNodeAttributes(1, 0, 10n, 'A'));
      graph.addNode('B', generateWeightedNodeAttributes(2, 0, 10n, 'B'));
      graph.addNode('C', generateWeightedNodeAttributes(3, 0, 10n, 'C'));
      graph.addNode('D', generateWeightedNodeAttributes(4, 0, 10n, 'D'));

      const result = highestWeightedNode(graph, ['A', 'B', 'C', 'D']);
      expect(result).toBe('A');
    });
  });

  describe('applyNodeAttributeToAllChildren', () => {
    it('should not change the attribute of the starting node', () => {
      const graph = new Graphology<NodeAttributes, EdgeAttributes, WeightedGraphAttributes>();

      // Adding nodes
      graph.addNode('A', { slot: 1, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('B', { slot: 2, offset: 0, canonical: true, blockRoot: '0x' });

      // Adding edges
      graph.addEdge('A', 'B');

      applyNodeAttributeToAllChildren<NodeAttributes>(graph, 'A', 'offset', 5);

      expect(graph.getNodeAttribute('A', 'offset')).toBe(0);
      expect(graph.getNodeAttribute('B', 'offset')).toBe(5);
    });

    it('should apply the given attribute to all children', () => {
      const graph = new Graphology<NodeAttributes, EdgeAttributes, WeightedGraphAttributes>();

      // Adding nodes
      graph.addNode('A', { slot: 1, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('B', { slot: 2, offset: 10, canonical: true, blockRoot: '0x' });
      graph.addNode('C', { slot: 3, offset: 10, canonical: true, blockRoot: '0x' });
      graph.addNode('D', { slot: 4, offset: 10, canonical: true, blockRoot: '0x' });
      graph.addNode('E', { slot: 5, offset: 10, canonical: true, blockRoot: '0x' });
      graph.addNode('F', { slot: 6, offset: 10, canonical: true, blockRoot: '0x' });
      graph.addNode('G', { slot: 7, offset: 10, canonical: true, blockRoot: '0x' });
      graph.addNode('H', { slot: 8, offset: 10, canonical: true, blockRoot: '0x' });

      // Adding edges
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'E');
      graph.addEdge('D', 'F');
      graph.addEdge('D', 'G');
      // disconnected node from B tree
      graph.addEdge('A', 'H');

      applyNodeAttributeToAllChildren<NodeAttributes>(graph, 'B', 'offset', 5);

      // unaffected nodes
      expect(graph.getNodeAttribute('A', 'offset')).toBe(0);
      expect(graph.getNodeAttribute('B', 'offset')).toBe(10);
      expect(graph.getNodeAttribute('H', 'offset')).toBe(10);
      // child nodes of B
      expect(graph.getNodeAttribute('C', 'offset')).toBe(5);
      expect(graph.getNodeAttribute('D', 'offset')).toBe(5);
      expect(graph.getNodeAttribute('E', 'offset')).toBe(5);
      expect(graph.getNodeAttribute('F', 'offset')).toBe(5);
      expect(graph.getNodeAttribute('G', 'offset')).toBe(5);
    });

    it('should not change the attribute of nodes without children', () => {
      const graph = new Graphology<NodeAttributes, EdgeAttributes, WeightedGraphAttributes>();

      // Adding nodes
      graph.addNode('A', { slot: 1, offset: 0, canonical: true, blockRoot: '0x' });
      graph.addNode('B', { slot: 2, offset: 0, canonical: true, blockRoot: '0x' });

      applyNodeAttributeToAllChildren<NodeAttributes>(graph, 'B', 'offset', 5);

      expect(graph.getNodeAttribute('A', 'offset')).toBe(0);
      expect(graph.getNodeAttribute('B', 'offset')).toBe(0);
    });
  });
  describe('applyNodeOffsetToAllChildren', () => {
    it('should apply the correct offsets to all children', () => {
      const graph = new Graphology<
        WeightedNodeAttributes,
        EdgeAttributes,
        WeightedGraphAttributes
      >();
      const currentOffset = 0;

      // Adding nodes
      graph.addNode('A', generateWeightedNodeAttributes(1, currentOffset, 10n, 'A'));
      graph.addNode('B', generateWeightedNodeAttributes(2, 0, 9n, 'B'));
      graph.addNode('C', generateWeightedNodeAttributes(3, 0, 6n, 'C'));
      graph.addNode('D', generateWeightedNodeAttributes(3, 0, 8n, 'D'));
      graph.addNode('E', generateWeightedNodeAttributes(4, 0, 5n, 'E'));
      graph.addNode('F', generateWeightedNodeAttributes(4, 0, 7n, 'F'));

      /** Adding edges
       *    A
       *    |
       *    B
       *    | \
       *    C  |
       *    |  |
       *    |  D
       *    |  |
       *    E  |
       *       |
       *       F
       */
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'E');
      graph.addEdge('D', 'F');

      applyNodeOffsetToAllChildren(graph, 'A', currentOffset, 1);

      expect(graph.getNodeAttribute('A', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('B', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('C', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('E', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('D', 'offset')).toBe(currentOffset + 1);
      expect(graph.getNodeAttribute('F', 'offset')).toBe(currentOffset + 1);
    });

    it('should apply the correct offsets to all children in a graph with multiple forks', () => {
      const graph = new Graphology<
        WeightedNodeAttributes,
        EdgeAttributes,
        WeightedGraphAttributes
      >();
      const currentOffset = 0;

      // Adding nodes
      graph.addNode('A', generateWeightedNodeAttributes(1, currentOffset, 10n, 'A'));
      graph.addNode('B', generateWeightedNodeAttributes(2, 0, 9n, 'B'));
      graph.addNode('C', generateWeightedNodeAttributes(3, 0, 7n, 'C'));
      graph.addNode('D', generateWeightedNodeAttributes(3, 0, 8n, 'D'));
      graph.addNode('E', generateWeightedNodeAttributes(4, 0, 5n, 'E'));
      graph.addNode('F', generateWeightedNodeAttributes(4, 0, 6n, 'F'));
      graph.addNode('G', generateWeightedNodeAttributes(4, 0, 4n, 'G'));
      graph.addNode('H', generateWeightedNodeAttributes(5, 0, 3n, 'H'));

      // Adding edges
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'E');
      graph.addEdge('D', 'F');
      graph.addEdge('D', 'G');
      graph.addEdge('G', 'H');

      applyNodeOffsetToAllChildren(graph, 'A', currentOffset, 1);

      /** Should look like this
       *    A
       *    |
       *    B ——
       *    |    \
       *    |     C
       *    |     |
       *    D     |
       *    | \   |
       *    |  |  E
       *    |  |
       *    |  F
       *    |
       *    G
       *    |
       *    H
       */
      expect(graph.getNodeAttribute('A', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('B', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('D', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('G', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('H', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('F', 'offset')).toBe(currentOffset + 1);
      expect(graph.getNodeAttribute('C', 'offset')).toBe(currentOffset + 2);
      expect(graph.getNodeAttribute('E', 'offset')).toBe(currentOffset + 2);
    });

    it('should apply the correct offsets to all children in a graph with multiple neighbors in a single fork', () => {
      const graph = new Graphology<
        WeightedNodeAttributes,
        EdgeAttributes,
        WeightedGraphAttributes
      >();
      const currentOffset = 0;

      // Adding nodes
      graph.addNode('A', generateWeightedNodeAttributes(1, currentOffset, 10n, 'A'));
      graph.addNode('B', generateWeightedNodeAttributes(2, 0, 9n, 'B'));
      graph.addNode('C', generateWeightedNodeAttributes(3, 0, 7n, 'C'));
      graph.addNode('D', generateWeightedNodeAttributes(3, 0, 8n, 'D'));
      graph.addNode('E', generateWeightedNodeAttributes(4, 0, 5n, 'E'));
      graph.addNode('F', generateWeightedNodeAttributes(4, 0, 6n, 'F'));
      graph.addNode('G', generateWeightedNodeAttributes(4, 0, 4n, 'G'));

      // Adding edges
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('B', 'F');
      graph.addEdge('C', 'E');
      graph.addEdge('D', 'G');

      applyNodeOffsetToAllChildren(graph, 'A', currentOffset, 1);

      /** Should look like this
       *    A
       *    |
       *    B ——
       *    | \  \
       *    C  |  |
       *    |  |  |
       *    |  D  |
       *    |  |  |
       *    E  |  |
       *       |  |
       *       |  F
       *       |
       *       G
       */
      expect(graph.getNodeAttribute('A', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('B', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('C', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('E', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('D', 'offset')).toBe(currentOffset + 1);
      expect(graph.getNodeAttribute('G', 'offset')).toBe(currentOffset + 1);
      expect(graph.getNodeAttribute('F', 'offset')).toBe(currentOffset + 2);
    });
    it('should apply custom currentOffset to all children', () => {
      const graph = new Graphology<
        WeightedNodeAttributes,
        EdgeAttributes,
        WeightedGraphAttributes
      >();
      const currentOffset = 2;

      // Adding nodes
      graph.addNode('A', generateWeightedNodeAttributes(1, currentOffset, 10n, 'A'));
      graph.addNode('B', generateWeightedNodeAttributes(2, 0, 9n, 'B'));
      graph.addNode('C', generateWeightedNodeAttributes(3, 0, 7n, 'C'));
      graph.addNode('D', generateWeightedNodeAttributes(3, 0, 8n, 'D'));
      graph.addNode('E', generateWeightedNodeAttributes(4, 0, 5n, 'E'));

      // Adding edges
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'E');

      applyNodeOffsetToAllChildren(graph, 'A', currentOffset, 1);

      // should not change the offset of A
      expect(graph.getNodeAttribute('A', 'offset')).toBe(currentOffset);

      /** Should look like this
       *    A
       *    |
       *    B
       *    | \
       *    C  \
       *    |   \
       *    |    D
       *    |
       *    E
       */
      expect(graph.getNodeAttribute('B', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('C', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('E', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('D', 'offset')).toBe(currentOffset + 1);
    });
    it('should apply negative direction for offset', () => {
      const graph = new Graphology<
        WeightedNodeAttributes,
        EdgeAttributes,
        WeightedGraphAttributes
      >();
      const currentOffset = 0;

      // Adding nodes
      graph.addNode('A', generateWeightedNodeAttributes(1, currentOffset, 10n, 'A'));
      graph.addNode('B', generateWeightedNodeAttributes(2, 0, 9n, 'B'));
      graph.addNode('C', generateWeightedNodeAttributes(3, 0, 7n, 'C'));
      graph.addNode('D', generateWeightedNodeAttributes(3, 0, 8n, 'D'));
      graph.addNode('E', generateWeightedNodeAttributes(4, 0, 5n, 'E'));

      // Adding edges
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'E');

      applyNodeOffsetToAllChildren(graph, 'A', currentOffset, -1);

      /** Should look like this
       *    A
       *    |
       *    B
       *    |
       *    C
       *  / |
       * D  |
       *    |
       *    E
       */
      expect(graph.getNodeAttribute('A', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('B', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('C', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('E', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('D', 'offset')).toBe(currentOffset - 1);
    });

    it('should apply custom currentOffset and negative direction for offset', () => {
      const graph = new Graphology<
        WeightedNodeAttributes,
        EdgeAttributes,
        WeightedGraphAttributes
      >();
      const currentOffset = -2;

      // Adding nodes
      graph.addNode('A', generateWeightedNodeAttributes(1, currentOffset, 10n, 'A'));
      graph.addNode('B', generateWeightedNodeAttributes(2, 0, 9n, 'B'));
      graph.addNode('C', generateWeightedNodeAttributes(3, 0, 7n, 'C'));
      graph.addNode('D', generateWeightedNodeAttributes(3, 0, 8n, 'D'));
      graph.addNode('E', generateWeightedNodeAttributes(4, 0, 5n, 'E'));

      // Adding edges
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'E');

      applyNodeOffsetToAllChildren(graph, 'A', currentOffset, -1);

      /** Should look like this
       *    A
       *    |
       *    B
       *    |
       *    C
       *  / |
       * D  |
       *    |
       *    E
       */
      expect(graph.getNodeAttribute('A', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('B', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('C', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('E', 'offset')).toBe(currentOffset);
      expect(graph.getNodeAttribute('D', 'offset')).toBe(currentOffset - 1);
    });
  });

  describe('processForkChoiceData', () => {
    it('should return GraphError with missing data payload', () => {
      expect(() =>
        processForkChoiceData({ data: {}, metadata: {} } as Required<Frame>),
      ).toThrowError(GraphError);
    });

    it('should return GraphError with invalid fork_choice_nodes slot data payload', () => {
      expect(() =>
        processForkChoiceData({
          data: {
            finalized_checkpoint: { epoch: '5', root: '0x' },
            justified_checkpoint: { epoch: '6', root: '0x' },
            fork_choice_nodes: [{ slot: 'abc' }],
          },
          metadata: {
            id: '1',
            node: 'node1',
            fetched_at: new Date().toISOString(),
            wall_clock_slot: 0,
            wall_clock_epoch: 0,
          },
        } as Required<Frame>),
      ).toThrowError(GraphError);
    });

    it('should have orphaned node with invalid fork_choice_nodes parent block_root data payload', () => {
      const { graph } = processForkChoiceData({
        data: {
          finalized_checkpoint: { epoch: '5', root: '0x' },
          justified_checkpoint: { epoch: '6', root: '0x' },
          fork_choice_nodes: [
            {
              slot: '10',
              block_root: '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
              parent_root: '0xaecade68feb38aff5f30103fac04f458ba127db0fad9c17839aa19e727ee6cd6',
              justified_epoch: '6',
              finalized_epoch: '5',
              weight: '4728638123638428947',
              validity: 'VALID',
              execution_block_hash:
                '0x4e54d078b4ce054728ad82b23ed6dae21b9bed4cbcaf16abdcb53140c2303cb0',
              extra_data: {
                state_root: '0x3b0e0d10d906db615a23681c2afd66e4b0e271c2753084d525d21591f35ca19a',
                justified_root:
                  '0x74b0dc800ff24c1947b49a639cc0d470c60109ba6d9386ccd8b0f6b499647e1a',
                unrealised_justified_epoch: '6',
                unrealized_justified_root:
                  '0x62f852206db97e7fb45c4cc308072bcdee18c167ea8471d6f0292ae5dd920c86',
                unrealised_finalized_epoch: '5',
                unrealized_finalized_root:
                  '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
              },
            },
            {
              slot: '11',
              block_root: '0xba6e14383eed82ed37a4ab6a40e90b846a27b40156154ef9921355750f9017b7',
              parent_root: '0x0000',
              justified_epoch: '6',
              finalized_epoch: '5',
              weight: '4728638123638428337',
              validity: 'VALID',
              execution_block_hash:
                '0x7dcb1bc33d9dcfa89491e0335ce609250f7bbb8f3c3c1d946d4233a29e926b77',
              extra_data: {
                state_root: '0xcd2e584c11f465eadae11f13e02d82fa857b2a8e7f2b01c65028a16a6a8ce803',
                justified_root:
                  '0xd29b33cfce4b2ac0d7e6e51ffc5f346b77921c3118f4bb4c91027e00fc5c159f',
                unrealised_justified_epoch: '6',
                unrealized_justified_root:
                  '0x62f852206db97e7fb45c4cc308072bcdee18c167ea8471d6f0292ae5dd920c86',
                unrealised_finalized_epoch: '5',
                unrealized_finalized_root:
                  '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
              },
            },
          ],
        },
        metadata: {
          id: '1',
          node: 'node1',
          fetched_at: new Date().toISOString(),
          wall_clock_slot: 0,
          wall_clock_epoch: 0,
        },
      });
      expect(
        graph.getNodeAttribute(
          generateNodeId({
            slot: 11,
            blockRoot: '0xba6e14383eed82ed37a4ab6a40e90b846a27b40156154ef9921355750f9017b7',
            parentRoot: '0x0000',
          }),
          'orphaned',
        ),
      ).toBe(true);
    });

    it('should return itself when no children', () => {
      const data = {
        justified_checkpoint: {
          epoch: '6',
          root: '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
        },
        finalized_checkpoint: {
          epoch: '5',
          root: '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
        },
        fork_choice_nodes: [
          // pre finalized checkpoint slot
          {
            slot: '9',
            block_root: '0xaecade68feb38aff5f30103fac04f458ba127db0fad9c17839aa19e727ee6cd6',
            parent_root: '0x411573c3628091fa4e4b30ce4fb92ffb660516fad16177f35d1465494ce6e4cb',
            justified_epoch: '3',
            finalized_epoch: '2',
            weight: '5728638123638428947',
            validity: 'VALID',
            execution_block_hash:
              '0x4e54d078b4ce054728ad82b23ed6dae21b9bed4cbcaf16abdcb53140c2303cb0',
            extra_data: {
              state_root: '0x3b0e0d10d906db615a23681c2afd66e4b0e271c2753084d525d21591f35ca19a',
              justified_root: '0x74b0dc800ff24c1947b49a639cc0d470c60109ba6d9386ccd8b0f6b499647e1a',
              unrealised_justified_epoch: '3',
              unrealized_justified_root:
                '0x62f852206db97e7fb45c4cc308072bcdee18c167ea8471d6f0292ae5dd920c86',
              unrealised_finalized_epoch: '2',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          // finalized checkpoint slot
          {
            slot: '10',
            block_root: '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            parent_root: '0xaecade68feb38aff5f30103fac04f458ba127db0fad9c17839aa19e727ee6cd6',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '4728638123638428947',
            validity: 'VALID',
            execution_block_hash:
              '0x4e54d078b4ce054728ad82b23ed6dae21b9bed4cbcaf16abdcb53140c2303cb0',
            extra_data: {
              state_root: '0x3b0e0d10d906db615a23681c2afd66e4b0e271c2753084d525d21591f35ca19a',
              justified_root: '0x74b0dc800ff24c1947b49a639cc0d470c60109ba6d9386ccd8b0f6b499647e1a',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0x62f852206db97e7fb45c4cc308072bcdee18c167ea8471d6f0292ae5dd920c86',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          {
            slot: '11',
            block_root: '0xba6e14383eed82ed37a4ab6a40e90b846a27b40156154ef9921355750f9017b7',
            parent_root: '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '4728638123638428337',
            validity: 'VALID',
            execution_block_hash:
              '0x7dcb1bc33d9dcfa89491e0335ce609250f7bbb8f3c3c1d946d4233a29e926b77',
            extra_data: {
              state_root: '0xcd2e584c11f465eadae11f13e02d82fa857b2a8e7f2b01c65028a16a6a8ce803',
              justified_root: '0xd29b33cfce4b2ac0d7e6e51ffc5f346b77921c3118f4bb4c91027e00fc5c159f',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0x62f852206db97e7fb45c4cc308072bcdee18c167ea8471d6f0292ae5dd920c86',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          {
            slot: '12',
            block_root: '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
            parent_root: '0xba6e14383eed82ed37a4ab6a40e90b846a27b40156154ef9921355750f9017b7',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '4728638123638427444',
            validity: 'VALID',
            execution_block_hash:
              '0xa36448a46befe11ce26c735d8dd8264c9bc4cee2da6e608a0d45b5de037eff67',
            extra_data: {
              state_root: '0xf06d2a3bd18efe9a14349f957f9403d50d7741b0a7dbc0baf6b5778945310a32',
              justified_root: '0xe927b2d2ec7088ed138167e12dfd8f9cdf7998fbee6b207ba70306616fbaeb08',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          {
            slot: '13',
            block_root: '0x3826a79abf5838c59b7f9175b2c4b94aa5100388a21260a321f143129ac93e34',
            parent_root: '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '4728638123638427066',
            validity: 'VALID',
            execution_block_hash:
              '0x34d1443633bff842843956ee250dd99c2cb8e1acaf62cdfaa6aaccd83dbc104f',
            extra_data: {
              state_root: '0x7a62a07ca5375c27b1db6cfce4a5c99c0dc6ff349d1db267dff7d1d443f59f06',
              justified_root: '0x08d5ff3138b04e2d491db7f98f0e48fff424500cd41bbecc2f26e920d34cdc4a',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          {
            slot: '14',
            block_root: '0xae1a9582aa9ef20d54cdebbf6191bc70bdede1ce5d84aae46e24dee8de9000af',
            parent_root: '0x3826a79abf5838c59b7f9175b2c4b94aa5100388a21260a321f143129ac93e34',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '4728638123638426102',
            validity: 'VALID',
            execution_block_hash:
              '0x89d95e5ebdbaa4b8c5f3ca76e7721480aacd4bb85b218a96e17a58fb925b400d',
            extra_data: {
              state_root: '0xa89bdee1a7f66177ffb98b8f7bc7698d7cb8ce923020fd6ca67edd11d0af63a9',
              justified_root: '0x1b8d0006e13e4a1c9008036542e4a84f910dfbebaf79d8a41befc664f520b7a9',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          // fork #1
          {
            slot: '14',
            block_root: '0xd8c76a49aac7b30a2093d100a78e4dcab0958237e73eb16564f982355621e148',
            parent_root: '0x3826a79abf5838c59b7f9175b2c4b94aa5100388a21260a321f143129ac93e34',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '3728638123638426102',
            validity: 'VALID',
            execution_block_hash:
              '0x89d95e5ebdbaa4b8c5f3ca76e7721480aacd4bb85b218a96e17a58fb925b400d',
            extra_data: {
              state_root: '0xa89bdee1a7f66177ffb98b8f7bc7698d7cb8ce923020fd6ca67edd11d0af63a9',
              justified_root: '0x1b8d0006e13e4a1c9008036542e4a84f910dfbebaf79d8a41befc664f520b7a9',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          {
            slot: '15',
            block_root: '0x61409665a49600482dd5e7c2d9cbbff823c9d7b2329f8dee62b02dde0b097106',
            parent_root: '0xae1a9582aa9ef20d54cdebbf6191bc70bdede1ce5d84aae46e24dee8de9000af',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '4728638123638425941',
            validity: 'VALID',
            execution_block_hash:
              '0x7611687f56efb0654b6a6ac83c6fd516c315b54dd7440dc0f0eec15906f76d52',
            extra_data: {
              state_root: '0xaa41809e22fd3435e86818512f5188c9b8fef28c5649e26054a4973a51a43733',
              justified_root: '0x6eed633206f2f21b021231dce209336c45ce36cb8ae74fc83d128eb5c6df5e6b',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          // fork #1 subfork #1
          {
            slot: '15',
            block_root: '0xa105e19946cce5e298ee5d4ffa8ed742cc0995ba8900a4c6754556234bcb8edc',
            parent_root: '0xd8c76a49aac7b30a2093d100a78e4dcab0958237e73eb16564f982355621e148',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '2728638123638425941',
            validity: 'VALID',
            execution_block_hash:
              '0x7611687f56efb0654b6a6ac83c6fd516c315b54dd7440dc0f0eec15906f76d52',
            extra_data: {
              state_root: '0xaa41809e22fd3435e86818512f5188c9b8fef28c5649e26054a4973a51a43733',
              justified_root: '0x6eed633206f2f21b021231dce209336c45ce36cb8ae74fc83d128eb5c6df5e6b',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          // fork #1 subfork #2 + INVALID
          {
            slot: '15',
            block_root: '0x83dc0753b6545509ee9a787bde7fac63ba378e9a7ddc857932ecef25fb1602f1',
            parent_root: '0xd8c76a49aac7b30a2093d100a78e4dcab0958237e73eb16564f982355621e148',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '2328638123638425941',
            validity: 'INVALID',
            execution_block_hash:
              '0x7611687f56efb0654b6a6ac83c6fd516c315b54dd7440dc0f0eec15906f76d52',
            extra_data: {
              state_root: '0xaa41809e22fd3435e86818512f5188c9b8fef28c5649e26054a4973a51a43733',
              justified_root: '0x6eed633206f2f21b021231dce209336c45ce36cb8ae74fc83d128eb5c6df5e6b',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          {
            slot: '16',
            block_root: '0x48322324d97ffad9c9c504e1734858e65061d609b995ea47267d59ce6a9c81a3',
            parent_root: '0x61409665a49600482dd5e7c2d9cbbff823c9d7b2329f8dee62b02dde0b097106',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '4728638123638425107',
            validity: 'VALID',
            execution_block_hash:
              '0x9826e8b6e235ae4685bd575aae624acf84c1b969f7e6fbcaa5b4edb1206b0d29',
            extra_data: {
              state_root: '0xdc0de3138756132a6145f2a7d77b0bb4e5352a1da5bb55907e14ddec89442d22',
              justified_root: '0x4f9090ab994138a8671a1bc14bf6da099158e88a3b05c2f62c20541959c3b2ea',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          // fork #1 subfork #2
          {
            slot: '16',
            block_root: '0x20eeedb58320e290e6ce52be804d93c611093aebcb5ed731327c413427c648dd',
            parent_root: '0x83dc0753b6545509ee9a787bde7fac63ba378e9a7ddc857932ecef25fb1602f1',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '328638123638425107',
            validity: 'VALID',
            execution_block_hash:
              '0x9826e8b6e235ae4685bd575aae624acf84c1b969f7e6fbcaa5b4edb1206b0d29',
            extra_data: {
              state_root: '0xdc0de3138756132a6145f2a7d77b0bb4e5352a1da5bb55907e14ddec89442d22',
              justified_root: '0x4f9090ab994138a8671a1bc14bf6da099158e88a3b05c2f62c20541959c3b2ea',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          // fork #2
          {
            slot: '16',
            block_root: '0xb4118f963947490c4a804638ac6971687662600c20924c4e12c5c143e776fec0',
            parent_root: '0x61409665a49600482dd5e7c2d9cbbff823c9d7b2329f8dee62b02dde0b097106',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '1728638123638425107',
            validity: 'VALID',
            execution_block_hash:
              '0x9826e8b6e235ae4685bd575aae624acf84c1b969f7e6fbcaa5b4edb1206b0d29',
            extra_data: {
              state_root: '0xdc0de3138756132a6145f2a7d77b0bb4e5352a1da5bb55907e14ddec89442d22',
              justified_root: '0x4f9090ab994138a8671a1bc14bf6da099158e88a3b05c2f62c20541959c3b2ea',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
          // fork #3
          {
            slot: '16',
            block_root: '0x513106a410d8bc72d9c4fffcb6d040333af7b2461bb53eb8f49a64471fa2a8f5',
            parent_root: '0x61409665a49600482dd5e7c2d9cbbff823c9d7b2329f8dee62b02dde0b097106',
            justified_epoch: '6',
            finalized_epoch: '5',
            weight: '728638123638425107',
            validity: 'VALID',
            execution_block_hash:
              '0x9826e8b6e235ae4685bd575aae624acf84c1b969f7e6fbcaa5b4edb1206b0d29',
            extra_data: {
              state_root: '0xdc0de3138756132a6145f2a7d77b0bb4e5352a1da5bb55907e14ddec89442d22',
              justified_root: '0x4f9090ab994138a8671a1bc14bf6da099158e88a3b05c2f62c20541959c3b2ea',
              unrealised_justified_epoch: '6',
              unrealized_justified_root:
                '0xcdf6c13f41d8c8ad8a384eeabd706d912f311452d18dea1d718646d1f99419ab',
              unrealised_finalized_epoch: '5',
              unrealized_finalized_root:
                '0x38da44a74a79c6db9160fd904bd0866708a0b73e474e532fe6a66030c1b6a249',
            },
          },
        ],
      };

      const { graph } = processForkChoiceData({
        data,
        metadata: {
          id: '1',
          node: 'node1',
          fetched_at: new Date().toISOString(),
          wall_clock_slot: 0,
          wall_clock_epoch: 0,
        },
      });

      expect(graph.getAttribute('slotStart')).toBe(10);
      expect(graph.getAttribute('slotEnd')).toBe(16);
      expect(graph.getAttribute('forks')).toBe(5);

      expect(graph.nodes().length).toBe(data.fork_choice_nodes.length - 1);
      expect(graph.edges().length).toBe(data.fork_choice_nodes.length - 2);
    });
  });
});
