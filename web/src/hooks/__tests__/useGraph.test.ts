import { renderHook } from '@testing-library/react';

import useGraph from '@hooks/useGraph';
import { generateRandomForkChoiceData } from '@utils/api';
import { processForkChoiceData } from '@utils/graph';

describe('useGraph', () => {
  it('should return an empty graph when data is empty', () => {
    const { result } = renderHook(() => useGraph({ data: [], spacingX: 10, spacingY: 10 }));
    expect(result.current.type).toEqual('empty');
  });

  it('should return a weighted graph when data has a single graph', () => {
    const { result } = renderHook(() =>
      useGraph({
        data: [
          processForkChoiceData({
            metadata: {
              id: '1',
              node: 'node1',
              fetched_at: '2023-01-01T00:00:00Z',
              wall_clock_slot: 0,
              wall_clock_epoch: 0,
            },
            data: generateRandomForkChoiceData(),
          }),
        ],
        spacingX: 10,
        spacingY: 10,
      }),
    );

    expect(result.current.type).toEqual('weighted');
  });

  it('should return an aggregated graph when data has multiple graphs', () => {
    const { result } = renderHook(() =>
      useGraph({
        data: [
          processForkChoiceData({
            metadata: {
              id: '1',
              node: 'node1',
              fetched_at: '2023-01-01T00:00:00Z',
              wall_clock_slot: 0,
              wall_clock_epoch: 0,
            },
            data: generateRandomForkChoiceData(),
          }),
          processForkChoiceData({
            metadata: {
              id: '2',
              node: 'node2',
              fetched_at: '2023-01-01T01:00:00Z',
              wall_clock_slot: 0,
              wall_clock_epoch: 0,
            },
            data: generateRandomForkChoiceData(),
          }),
        ],
        spacingX: 10,
        spacingY: 10,
      }),
    );

    expect(result.current.type).toEqual('aggregated');
    expect(result.current.edges.length).toBeGreaterThan(0);
    expect(result.current.nodes.length).toBeGreaterThan(0);
  });

  it('should update the graph when data changes', () => {
    const { result, rerender } = renderHook(
      ({ data, spacingX, spacingY }) => useGraph({ data, spacingX, spacingY }),
      {
        initialProps: {
          data: [
            processForkChoiceData({
              metadata: {
                id: '1',
                node: 'node1',
                fetched_at: '2023-01-01T00:00:00Z',
                wall_clock_slot: 0,
                wall_clock_epoch: 0,
              },
              data: generateRandomForkChoiceData(),
            }),
          ],
          spacingX: 10,
          spacingY: 10,
        },
      },
    );

    expect(result.current.type).toEqual('weighted');

    rerender({
      data: [
        processForkChoiceData({
          metadata: {
            id: '1',
            node: 'node1',
            fetched_at: '2023-01-01T00:00:00Z',
            wall_clock_slot: 0,
            wall_clock_epoch: 0,
          },
          data: generateRandomForkChoiceData(),
        }),
        processForkChoiceData({
          metadata: {
            id: '2',
            node: 'node2',
            fetched_at: '2023-01-01T01:00:00Z',
            wall_clock_slot: 0,
            wall_clock_epoch: 0,
          },
          data: generateRandomForkChoiceData(),
        }),
      ],
      spacingX: 10,
      spacingY: 10,
    });

    expect(result.current.type).toEqual('aggregated');
  });

  it('should update the graph when spacingX or spacingY changes', () => {
    const data = [
      processForkChoiceData({
        metadata: {
          id: '1',
          node: 'node1',
          fetched_at: '2023-01-01T01:00:00Z',
          wall_clock_slot: 0,
          wall_clock_epoch: 0,
        },
        data: generateRandomForkChoiceData(),
      }),
    ];

    const { result, rerender } = renderHook(
      ({ data, spacingX, spacingY }) => useGraph({ data, spacingX, spacingY }),
      {
        initialProps: { data, spacingX: 10, spacingY: 10 },
      },
    );

    // Compare full position arrays: single-node comparisons are flaky because
    // a node on the canonical row keeps y=0 at any spacing.
    const positions = result.current.nodes.map(({ x, y }) => ({ x, y }));
    const serialize = () => JSON.stringify(result.current.nodes.map(({ x, y }) => ({ x, y })));

    rerender({ data, spacingX: 15, spacingY: 15 });

    expect(serialize()).not.toEqual(JSON.stringify(positions));

    rerender({ data, spacingX: 10, spacingY: 15 });

    result.current.nodes.forEach((node, i) => {
      expect(node.x).toEqual(positions[i].x);
    });
    expect(serialize()).not.toEqual(JSON.stringify(positions));

    rerender({ data, spacingX: 10, spacingY: 10 });

    expect(serialize()).toEqual(JSON.stringify(positions));
  });
});
