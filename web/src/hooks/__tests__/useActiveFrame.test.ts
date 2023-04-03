import { renderHook } from '@testing-library/react';
import { vi, Mock } from 'vitest';

import { FrameMetaData } from '@app/types/api';
import useFocus from '@contexts/focus';
import useActiveFrame, { findPreviousFrame } from '@hooks/useActiveFrame';
import { useMetadataQuery } from '@hooks/useQuery';

vi.mock('@contexts/focus');
vi.mock('@hooks/useQuery');

describe('useActiveFrame', () => {
  const now = Date.now();
  const previous = now - 1000;
  const wayback = now - 2000;
  describe('findPreviousFrame', () => {
    it('should return the previous frame data if found', () => {
      const metadata: FrameMetaData[] = [
        {
          id: '1',
          wall_clock_slot: 5,
          fetched_at: new Date(wayback).toISOString(),
          node: '',
          wall_clock_epoch: 0,
        },
        {
          id: '2',
          wall_clock_slot: 5,
          fetched_at: new Date(previous).toISOString(),
          node: '',
          wall_clock_epoch: 0,
        },
        {
          id: '3',
          wall_clock_slot: 5,
          fetched_at: new Date(now).toISOString(),
          node: '',
          wall_clock_epoch: 0,
        },
      ];

      const result = findPreviousFrame(now, metadata);

      expect(result).toEqual({
        slot: 5,
        id: '2',
      });
    });

    it('should return undefined if no previous frame is found', () => {
      const metadata: FrameMetaData[] = [
        {
          id: '1',
          wall_clock_slot: 5,
          fetched_at: new Date(wayback).toISOString(),
          node: '',
          wall_clock_epoch: 0,
        },
        {
          id: '2',
          wall_clock_slot: 5,
          fetched_at: new Date(previous).toISOString(),
          node: '',
          wall_clock_epoch: 0,
        },
        {
          id: '3',
          wall_clock_slot: 5,
          fetched_at: new Date(now).toISOString(),
          node: '',
          wall_clock_epoch: 0,
        },
      ];

      const result = findPreviousFrame(wayback, metadata);

      expect(result).toBeUndefined();
    });

    it('should return undefined if metadata is undefined', () => {
      const focusedTime = now;

      const result = findPreviousFrame(focusedTime);

      expect(result).toBeUndefined();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the current slot data if the frame is found', () => {
    (useFocus as Mock).mockReturnValue({
      slot: 5,
      time: now,
    });

    (useMetadataQuery as Mock)
      .mockReturnValueOnce({
        data: [
          { id: '1', wall_clock_slot: 5, fetched_at: new Date(wayback).toISOString() },
          { id: '2', wall_clock_slot: 5, fetched_at: new Date(previous).toISOString() },
          { id: '3', wall_clock_slot: 5, fetched_at: new Date(now).toISOString() },
        ],
      })
      .mockReturnValueOnce({
        data: [],
      })
      .mockReturnValueOnce({
        data: [],
      });

    const { result } = renderHook(() => useActiveFrame());

    expect(result.current).toEqual({
      slot: 5,
      id: '2',
    });
  });

  it('should return the previous slot data if the frame is not found in the current slot', () => {
    (useFocus as Mock).mockReturnValue({
      slot: 5,
      time: now,
    });

    (useMetadataQuery as Mock)
      .mockReturnValueOnce({
        data: [{ id: '3', wall_clock_slot: 5, fetched_at: new Date(now).toISOString() }],
      })
      .mockReturnValueOnce({
        data: [
          { id: '1', wall_clock_slot: 4, fetched_at: new Date(previous).toISOString() },
          { id: '2', wall_clock_slot: 4, fetched_at: new Date(wayback).toISOString() },
        ],
      })
      .mockReturnValueOnce({
        data: [],
      });

    const { result } = renderHook(() => useActiveFrame());

    expect(result.current).toEqual({
      slot: 4,
      id: '1',
    });
  });

  it('should return an empty object if no frame is found', () => {
    (useFocus as Mock).mockReturnValue({
      slot: 5,
      time: now,
    });

    (useMetadataQuery as Mock)
      .mockReturnValueOnce({
        data: [],
      })
      .mockReturnValueOnce({
        data: [],
      })
      .mockReturnValueOnce({
        data: [],
      });

    const { result } = renderHook(() => useActiveFrame());

    expect(result.current).toEqual({});
  });
});
