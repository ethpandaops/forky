import { BlockPayload } from '@app/types/graph';
import {
  PTC_SIZE,
  TIDE_FULL_LEVEL,
  TIDE_RISE_LEVEL,
  payloadProgress,
  payloadStage,
  summarizePayloads,
  tideLevel,
} from '@utils/payload';

describe('payload', () => {
  const received: BlockPayload = { emptyWeight: 0n, fullWeight: 0n };

  describe('payloadStage', () => {
    it.each<[string, BlockPayload, ReturnType<typeof payloadStage>]>([
      ['awaiting without a full node', { emptyWeight: 0n }, 'awaiting'],
      ['undecided without PTC counts', received, 'undecided'],
      ['voting while the PTC votes', { ...received, attesterCount: 357 }, 'voting'],
      [
        'timely once the PTC voted the payload timely',
        { ...received, attesterCount: PTC_SIZE, availabilityYesCount: 400 },
        'timely',
      ],
      [
        'late once the PTC did not',
        { ...received, attesterCount: PTC_SIZE, availabilityYesCount: 100 },
        'late',
      ],
      ['full once the full node is heavier', { ...received, status: 'full' }, 'full'],
      ['empty once the empty node is heavier', { ...received, status: 'empty' }, 'empty'],
    ])('should be %s', (_, payload, expected) => {
      expect(payloadStage(payload)).toBe(expected);
    });
  });

  describe('payloadProgress', () => {
    it('should track PTC votes while voting', () => {
      expect(payloadProgress({ ...received, attesterCount: 256 }, 'voting')).toBe(50);
    });

    it('should track timely votes once voted', () => {
      const payload = { ...received, attesterCount: PTC_SIZE, availabilityYesCount: 384 };
      expect(payloadProgress(payload, 'timely')).toBe(75);
    });
  });

  describe('tideLevel', () => {
    it('should rise with progress up to the rise level', () => {
      expect(tideLevel('voting', 50)).toBe(TIDE_RISE_LEVEL / 2);
      expect(tideLevel('timely', 100)).toBe(TIDE_RISE_LEVEL);
    });

    it('should fill full, drain empty and wait while awaiting', () => {
      expect(tideLevel('full', 0)).toBe(100);
      expect(tideLevel('empty', 100)).toBe(0);
      expect(tideLevel('awaiting', 0)).toBe(0);
    });
  });

  describe('summarizePayloads', () => {
    it('should be undefined without reporting sources', () => {
      expect(summarizePayloads([])).toBeUndefined();
    });

    it('should only fill the node when every source sees the payload full', () => {
      expect(
        summarizePayloads([
          { stage: 'full', progress: 100 },
          { stage: 'full', progress: 100 },
          { stage: 'voting', progress: 70 },
        ]),
      ).toEqual({ stage: 'full', count: 2, reporting: 3, level: TIDE_RISE_LEVEL });
      expect(
        summarizePayloads([
          { stage: 'full', progress: 100 },
          { stage: 'full', progress: 100 },
        ])?.level,
      ).toBe(TIDE_FULL_LEVEL);
    });

    it('should average the progress of agreeing sources', () => {
      expect(
        summarizePayloads([
          { stage: 'voting', progress: 40 },
          { stage: 'voting', progress: 60 },
        ])?.level,
      ).toBe(TIDE_RISE_LEVEL / 2);
    });

    it('should prefer the later lifecycle stage on a tie', () => {
      expect(
        summarizePayloads([
          { stage: 'voting', progress: 40 },
          { stage: 'full', progress: 100 },
        ])?.stage,
      ).toBe('full');
    });
  });
});
