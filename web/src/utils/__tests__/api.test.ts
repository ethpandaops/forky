import { ForkChoiceNode, ForkChoiceData } from '@app/types/api';
import { equalForkChoiceNode, equalForkChoiceData, getCheckpointType } from '@utils/api';

function generateForkChoiceNode(): ForkChoiceNode {
  return {
    slot: '1',
    block_root: '0x1',
    parent_root: '0x2',
    justified_epoch: '1',
    finalized_epoch: '1',
    weight: '1',
    validity: 'valid',
    execution_block_hash: '0x1',
    extra_data: {
      state_root: '0x1',
      justified_root: '0x1',
      unrealised_justified_epoch: '1',
      unrealized_justified_root: '0x1',
      unrealised_finalized_epoch: '1',
      unrealized_finalized_root: '0x1',
    },
  };
}

function generateForkChoiceData(): ForkChoiceData {
  return {
    justified_checkpoint: { epoch: '1', root: '0x1' },
    finalized_checkpoint: { epoch: '2', root: '0x2' },
    fork_choice_nodes: [],
  };
}

describe('api', () => {
  describe('equalForkChoiceNode', () => {
    it('should be equal', () => {
      const a = generateForkChoiceNode();
      const b = generateForkChoiceNode();
      expect(equalForkChoiceNode(a, b)).toBe(true);
    });

    it('should not be equal due to different slot', () => {
      const a = generateForkChoiceNode();
      const b = generateForkChoiceNode();
      b.slot = '2';
      expect(equalForkChoiceNode(a, b)).toBe(false);
    });

    it('should not be equal due to different block_root', () => {
      const a = generateForkChoiceNode();
      const b = generateForkChoiceNode();
      b.block_root = '0x12';
      expect(equalForkChoiceNode(a, b)).toBe(false);
    });

    it('should not be equal due to different weight', () => {
      const a = generateForkChoiceNode();
      const b = generateForkChoiceNode();
      b.weight = '5';
      expect(equalForkChoiceNode(a, b)).toBe(false);
    });

    it('should not be equal due to different validity', () => {
      const a = generateForkChoiceNode();
      const b = generateForkChoiceNode();
      b.validity = 'invalid';
      expect(equalForkChoiceNode(a, b)).toBe(false);
    });

    it('should not be equal due to different parent_root', () => {
      const a = generateForkChoiceNode();
      const b = generateForkChoiceNode();
      b.parent_root = '0x12';
      expect(equalForkChoiceNode(a, b)).toBe(false);
    });
  });

  describe('equalForkChoiceData', () => {
    it('should return false if either a or b is undefined', () => {
      const a = generateForkChoiceData();
      expect(equalForkChoiceData(a, undefined)).toBe(false);
      expect(equalForkChoiceData(undefined, a)).toBe(false);
      expect(equalForkChoiceData(undefined, undefined)).toBe(false);
    });

    it('should return true for equal ForkChoiceData', () => {
      const a = generateForkChoiceData();
      const b = generateForkChoiceData();
      expect(equalForkChoiceData(a, b)).toBe(true);
    });

    it('should return true for equal ForkChoiceData and ForkChoiceNodes', () => {
      const a = generateForkChoiceData();
      const b = generateForkChoiceData();
      a.fork_choice_nodes = [generateForkChoiceNode()];
      b.fork_choice_nodes = [generateForkChoiceNode()];
      expect(equalForkChoiceData(a, b)).toBe(true);
    });

    it('should return false for different fork_choice_nodes length', () => {
      const a = generateForkChoiceData();
      const b = generateForkChoiceData();
      a.fork_choice_nodes = [generateForkChoiceNode()];
      b.fork_choice_nodes = [generateForkChoiceNode(), { ...generateForkChoiceNode(), slot: '5' }];
      expect(equalForkChoiceData(a, b)).toBe(false);
    });

    it('should return false for different justified_checkpoint', () => {
      const a = generateForkChoiceData();
      const b = generateForkChoiceData();
      b.justified_checkpoint = { epoch: '3', root: '0x3' };
      expect(equalForkChoiceData(a, b)).toBe(false);
    });

    it('should return false for different finalized_checkpoint', () => {
      const a = generateForkChoiceData();
      const b = generateForkChoiceData();
      b.finalized_checkpoint = { epoch: '3', root: '0x3' };
      expect(equalForkChoiceData(a, b)).toBe(false);
    });

    it('should return false for different first fork_choice_nodes element', () => {
      const a = generateForkChoiceData();
      const b = generateForkChoiceData();
      const node = generateForkChoiceNode();
      const modifiedNode = generateForkChoiceNode();
      modifiedNode.slot = '100';
      a.fork_choice_nodes = [node];
      b.fork_choice_nodes = [modifiedNode];
      expect(equalForkChoiceData(a, b)).toBe(false);
    });
  });

  describe('getCheckpointType', () => {
    it('should return "finalized" for matching finalizedCheckpoint', () => {
      expect(getCheckpointType('0x1', '0x1', '0x2')).toBe('finalized');
    });

    it('should return "justified" for matching justifiedCheckpoint', () => {
      expect(getCheckpointType('0x2', '0x1', '0x2')).toBe('justified');
    });

    it('should return undefined for no matching checkpoint', () => {
      expect(getCheckpointType('0x3', '0x1', '0x2')).toBeUndefined();
    });

    it('should return "finalized" for matching both checkpoints', () => {
      expect(getCheckpointType('0x1', '0x1', '0x1')).toBe('finalized');
    });
  });
});
