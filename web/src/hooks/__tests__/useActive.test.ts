import { renderHook } from '@testing-library/react';
import { vi, Mock } from 'vitest';

import { FrameMetaData } from '@app/types/api';
import useFocus from '@contexts/focus';
import useActiveFrame, { findLatestFrameIdPerNode } from '@hooks/useActive';
import { useMetadataQuery } from '@hooks/useQuery';
import { ProviderWrapper } from '@utils/testing';

vi.mock('@hooks/useQuery');

const metadataMock: FrameMetaData[] = [
  {
    id: '1',
    node: 'node1',
    fetched_at: '2000-01-01T01:00:00Z',
    wall_clock_slot: 100,
    wall_clock_epoch: 10,
    labels: [],
  },
  {
    id: '2',
    node: 'node1',
    fetched_at: '2000-01-01T02:00:00Z',
    wall_clock_slot: 100,
    wall_clock_epoch: 10,
    labels: [],
  },
  {
    id: '3',
    node: 'node2',
    fetched_at: '2000-01-01T02:00:00Z',
    wall_clock_slot: 100,
    wall_clock_epoch: 10,
    labels: [],
  },
  {
    id: '4',
    node: 'node2',
    fetched_at: '2000-01-01T03:00:00Z',
    wall_clock_slot: 100,
    wall_clock_epoch: 10,
    labels: [],
  },
  {
    id: '5',
    node: 'node2',
    fetched_at: '2000-01-01T04:00:00Z',
    wall_clock_slot: 100,
    wall_clock_epoch: 10,
    labels: ['xatu_event_name=BEACON_API_ETH_V1_DEBUG_FORK_CHOICE_REORG'],
    event_source: 'xatu_reorg_event',
  },
  {
    id: '6',
    node: 'node3',
    fetched_at: '9999-04-01T04:00:00Z',
    wall_clock_slot: 100,
    wall_clock_epoch: 10,
    labels: ['xatu_event_name=BEACON_API_ETH_V1_DEBUG_FORK_CHOICE_REORG_V2'],
    event_source: 'xatu_reorg_event',
  },
];

describe('useActive', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findLatestFrameIdPerNode', () => {
    it('should return an empty array if there are no matching nodes in the metadata', () => {
      const result = findLatestFrameIdPerNode(
        new Date().getTime(),
        metadataMock,
        'non-existent-node',
      );
      expect(result).toEqual({ ids: [], nodes: [] });
    });

    it('should return an empty array if there is no metadata for the given node', () => {
      const result = findLatestFrameIdPerNode(new Date().getTime(), metadataMock, 'node3');
      expect(result).toEqual({ ids: [], nodes: [] });
    });

    it('should return the latest frame id for a node when the timestamp is after the latest fetched time', () => {
      const timestamp = new Date('2000-01-01T02:20:00.000Z').getTime();
      const expectedState = {
        nodes: ['node1'],
        ids: ['2'],
      };
      const result = findLatestFrameIdPerNode(timestamp, metadataMock, 'node1');
      expect(result).toEqual(expectedState);
    });

    it('should return the no frame id for a node when the timestamp is before the latest fetched time', () => {
      const timestamp = new Date('2000-01-01T01:00:00.000Z').getTime();
      const expectedState = {
        nodes: [],
        ids: [],
      };
      const result = findLatestFrameIdPerNode(timestamp, metadataMock, 'node2');
      expect(result).toEqual(expectedState);
    });

    it('should return the closest frame id for a node', () => {
      const timestamp = new Date('2000-01-01T03:50:00Z').getTime();
      const expectedState = {
        nodes: ['node2'],
        ids: ['4'],
      };
      const result = findLatestFrameIdPerNode(timestamp, metadataMock, 'node2');
      expect(result).toEqual(expectedState);
    });

    it('should return the closest frame id', () => {
      const timestamp = new Date('2000-01-01T02:50:00Z').getTime();
      const expectedState = {
        nodes: ['node2'],
        ids: ['3'],
      };
      const result = findLatestFrameIdPerNode(timestamp, metadataMock, 'node2');
      expect(result).toEqual(expectedState);
    });
  });

  describe('useActiveFrame', () => {
    it('should return the focusedFrameId when it is set', () => {
      (useMetadataQuery as Mock)
        .mockReturnValueOnce({ data: [] })
        .mockReturnValueOnce({ data: [] })
        .mockReturnValueOnce({ data: [] });

      const { result } = renderHook(() => useActiveFrame(), {
        wrapper: ProviderWrapper({
          focus: { frameId: '1234', initialTime: Date.now(), playing: true },
        }),
      });

      expect(result.current).toEqual({
        nodes: [],
        ids: ['1234'],
      });
    });

    it('should return the latest frame ids per node when no focusedFrameId is set', () => {
      (useMetadataQuery as Mock)
        .mockReturnValueOnce({ data: [] }) // metadataCurrent
        .mockReturnValueOnce({ data: metadataMock }) // metadataMinus1
        .mockReturnValueOnce({ data: [] }); // metadataMinus2

      const { result } = renderHook(() => useActiveFrame(), {
        wrapper: ProviderWrapper({
          focus: {
            initialTime: new Date('2000-01-01T02:10:00.000Z').getTime(),
            node: 'node1',
            playing: true,
          },
        }),
      });

      const expectedState = findLatestFrameIdPerNode(
        new Date('2000-01-01T02:10:00.000Z').getTime(),
        metadataMock,
        'node1',
      );

      expect(result.current).toEqual(expectedState);
    });

    it('should ignore reorg frames when finding the latest frame ids per node', () => {
      const reorgMetadata: FrameMetaData = {
        id: '55',
        node: 'node1',
        fetched_at: '2000-01-01T02:10:00.000Z',
        wall_clock_slot: 100,
        wall_clock_epoch: 10,
        labels: ['xatu_event_name=BEACON_API_ETH_V1_DEBUG_FORK_CHOICE_REORG'],
        event_source: 'xatu_reorg_event',
      };

      (useMetadataQuery as Mock)
        .mockReturnValueOnce({ data: [reorgMetadata] }) // metadataCurrent
        .mockReturnValueOnce({ data: metadataMock }) // metadataMinus1
        .mockReturnValueOnce({ data: [] }); // metadataMinus2

      const { result } = renderHook(() => useActiveFrame(), {
        wrapper: ProviderWrapper({
          focus: {
            initialTime: new Date('2000-01-01T02:20:00.000Z').getTime(),
            node: 'node1',
            playing: true,
          },
        }),
      });

      const expectedState = findLatestFrameIdPerNode(
        new Date('2000-01-01T02:20:00.000Z').getTime(),
        [...metadataMock, reorgMetadata],
        'node1',
      );
      expect(result.current).toEqual(expectedState);
    });

    it('should return empty state when useMetadataQuery returns no data', () => {
      (useMetadataQuery as Mock)
        .mockReturnValueOnce({ data: [] }) // metadataCurrent
        .mockReturnValueOnce({ data: [] }) // metadataMinus1
        .mockReturnValueOnce({ data: [] }); // metadataMinus2

      const { result } = renderHook(() => useActiveFrame(), {
        wrapper: ProviderWrapper({
          focus: {
            initialTime: new Date('2000-01-01T01:10:00.000Z').getTime(),
            node: 'node1',
            playing: true,
          },
        }),
      });

      expect(result.current).toEqual({ nodes: [], ids: [] });
    });

    it('should return the latest frame ids per node considering metadataMinus2', () => {
      const metadataMinus2Mock: FrameMetaData = {
        id: '3',
        node: 'node1',
        fetched_at: '2000-01-01T00:40:00.000Z',
        wall_clock_slot: 98,
        wall_clock_epoch: 9,
        labels: null,
      };

      (useMetadataQuery as Mock)
        .mockReturnValueOnce({ data: [] }) // metadataCurrent
        .mockReturnValueOnce({ data: [] }) // metadataMinus1
        .mockReturnValueOnce({ data: [metadataMinus2Mock] }); // metadataMinus2

      const { result } = renderHook(() => useActiveFrame(), {
        wrapper: ProviderWrapper({
          focus: {
            initialTime: new Date('2000-01-01T01:10:00.000Z').getTime(),
            node: 'node1',
            playing: true,
          },
        }),
      });

      const expectedState = findLatestFrameIdPerNode(
        new Date('2000-01-01T01:10:00.000Z').getTime(),
        [metadataMinus2Mock],
        'node1',
      );
      expect(result.current).toEqual(expectedState);
    });
  });
});
