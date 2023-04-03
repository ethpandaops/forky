import { renderHook } from '@testing-library/react';

import { Data } from '@app/api/frames';
import useWeightedGraph from '@hooks/useWeightedGraph';
import { weightedGraphFromData } from '@utils/graph';

const forkChoiceData = {
  justified_checkpoint: {
    epoch: '166196',
    root: '0x8e7186fbe79b5da420c3e7e001497701d6542d9d2b3e5c923eacc0e375b2f8f5',
  },
  finalized_checkpoint: {
    epoch: '166195',
    root: '0xd48630142a5460cfd386c25368827f0588a15bd3ab2dca864d0b822dcb32166f',
  },
  fork_choice_nodes: [
    {
      slot: '5318016',
      block_root: '0xd48630142a5460cfd386c25368827f0588a15bd3ab2dca864d0b822dcb32166f',
      parent_root: '0x02330cfce134990e5f7f232afa791975c8d70e7fa1c448a0ad01d1dad68ef96b',
      justified_epoch: '166187',
      finalized_epoch: '166186',
      weight: '12811024368750000',
      validity: 'VALID',
      execution_block_hash: '0x049d6039bbe97a01996fafcac956129b9a908ddc7d7e9c66c7ac756457836324',
      extra_data: {
        justified_root: '0x7f1a1a1094967905b453e22c9770d148b1e3faa544011369f046a483d4d8fa90',
        state_root: '0x912ae31443f2c599ee11773bce65d063dc3df52ae931338c8f0cc570969bfb41',
        unrealised_finalized_epoch: '166186',
        unrealised_justified_epoch: '166187',
        unrealized_finalized_root:
          '0xf87e8358ef3e6ee90354db50bb5c490f4d673dc2ddf94d42cea3675de41d8f07',
        unrealized_justified_root:
          '0x7f1a1a1094967905b453e22c9770d148b1e3faa544011369f046a483d4d8fa90',
      },
    },
    {
      slot: '5318017',
      block_root: '0x119f9239cef100778604c1f6059348202fd7b26d6205e35671a5a865992f7221',
      parent_root: '0xd48630142a5460cfd386c25368827f0588a15bd3ab2dca864d0b822dcb32166f',
      justified_epoch: '166187',
      finalized_epoch: '166186',
      weight: '12806802368750000',
      validity: 'VALID',
      execution_block_hash: '0x8410249c6e1ebfb9b97d6fff692cac09a0e670655b716f76a0aeb34b7502330f',
      extra_data: {
        justified_root: '0x7f1a1a1094967905b453e22c9770d148b1e3faa544011369f046a483d4d8fa90',
        state_root: '0x51f2e5f81c8114554a52012372b783a8403f3d8fd237cc4df59f1305db47fdc7',
        unrealised_finalized_epoch: '166186',
        unrealised_justified_epoch: '166187',
        unrealized_finalized_root:
          '0xf87e8358ef3e6ee90354db50bb5c490f4d673dc2ddf94d42cea3675de41d8f07',
        unrealized_justified_root:
          '0x7f1a1a1094967905b453e22c9770d148b1e3faa544011369f046a483d4d8fa90',
      },
    },
    {
      slot: '5318018',
      block_root: '0x759cf1cde534f60584492f4b7c20d5208e4f7f68cb56e6bc3198ddf5e4f60653',
      parent_root: '0x119f9239cef100778604c1f6059348202fd7b26d6205e35671a5a865992f7221',
      justified_epoch: '166187',
      finalized_epoch: '166186',
      weight: '11801142368750000',
      validity: 'VALID',
      execution_block_hash: '0x759cf1cde534f60584492f4b7c20d5208e4f7f68cb56e6bc3198ddf5e4f60653',
      extra_data: {
        justified_root: '0x7f1a1a1094967905b453e22c9770d148b1e3faa544011369f046a483d4d8fa90',
        state_root: '0x43238e4f230d4c91bfcab0b043ac1585d0d374ab39cc505d28cea0f8f8488e30',
        unrealised_finalized_epoch: '166186',
        unrealised_justified_epoch: '166187',
        unrealized_finalized_root:
          '0xf87e8358ef3e6ee90354db50bb5c490f4d673dc2ddf94d42cea3675de41d8f07',
        unrealized_justified_root:
          '0x7f1a1a1094967905b453e22c9770d148b1e3faa544011369f046a483d4d8fa90',
      },
    },
    {
      slot: '5318019',
      block_root: '0x8e7186fbe79b5da420c3e7e001497701d6542d9d2b3e5c923eacc0e375b2f8f5',
      parent_root: '0x119f9239cef100778604c1f6059348202fd7b26d6205e35671a5a865992f7221',
      justified_epoch: '166187',
      finalized_epoch: '166186',
      weight: '12801142368750000',
      validity: 'VALID',
      execution_block_hash: '0x759cf1cde534f60584492f4b7c20d5208e4f7f68cb56e6bc3198ddf5e4f60653',
      extra_data: {
        justified_root: '0x7f1a1a1094967905b453e22c9770d148b1e3faa544011369f046a483d4d8fa90',
        state_root: '0x43238e4f230d4c91bfcab0b043ac1585d0d374ab39cc505d28cea0f8f8488e30',
        unrealised_finalized_epoch: '166186',
        unrealised_justified_epoch: '166187',
        unrealized_finalized_root:
          '0xf87e8358ef3e6ee90354db50bb5c490f4d673dc2ddf94d42cea3675de41d8f07',
        unrealized_justified_root:
          '0x7f1a1a1094967905b453e22c9770d148b1e3faa544011369f046a483d4d8fa90',
      },
    },
  ],
};

const mockData: Data = {
  frame: {
    data: forkChoiceData,
    metadata: {
      id: 'f5eb0525-6e2d-4f96-a91e-247a350e9ce8',
      node: 'goerli-geth-teku-001',
      fetched_at: '2023-04-01T05:41:49.155827025Z',
      wall_clock_slot: 5318309,
      wall_clock_epoch: 166197,
    },
  },
  graph: weightedGraphFromData(forkChoiceData),
};

describe('useWeightedGraph', () => {
  it('should return the initial state correctly', () => {
    const { result } = renderHook(() =>
      useWeightedGraph({ data: mockData, spacingX: 100, spacingY: 100 }),
    );

    expect(result.current.attributes).toEqual({ slotStart: 5318016, slotEnd: 5318019, forks: 1 });
    expect(result.current.minOffset).toEqual(-1);
    expect(result.current.maxOffset).toEqual(0);
    expect(result.current.edges.length).toEqual(3);
    expect(result.current.nodes.length).toEqual(4);
    expect(result.current.edges[0].source).toEqual({
      id: forkChoiceData.fork_choice_nodes[2]?.block_root,
      x: 200,
      y: -100,
    });
    expect(result.current.edges[0].target).toEqual({
      id: forkChoiceData.fork_choice_nodes[0]?.block_root,
      x: 400,
      y: -100,
    });
    expect(result.current.edges[1].source).toEqual({
      id: forkChoiceData.fork_choice_nodes[2]?.block_root,
      x: 200,
      y: -100,
    });
    expect(result.current.edges[1].target).toEqual({
      id: forkChoiceData.fork_choice_nodes[1]?.block_root,
      x: 300,
      y: -200,
    });
    expect(result.current.edges[2].source).toEqual({
      id: forkChoiceData.fork_choice_nodes[3]?.block_root,
      x: 100,
      y: -100,
    });
    expect(result.current.edges[2].target).toEqual({
      id: forkChoiceData.fork_choice_nodes[2]?.block_root,
      x: 200,
      y: -100,
    });
  });
});
