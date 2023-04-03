import {
  Response,
  V1GetEthereumNowResponse,
  V1GetEthereumSpecResponse,
  EthereumSpec,
} from '@app/types/api';
import { BASE_URL } from '@utils/environment';

export type Spec = {
  network_name: string;
  spec: EthereumSpec;
};

export async function fetchNow(): Promise<Required<V1GetEthereumNowResponse>> {
  const response = await fetch(`${BASE_URL}api/v1/ethereum/now`);

  if (!response.ok) {
    throw new Error('Failed to fetch slot data');
  }
  const json = (await response.json()) as Response<V1GetEthereumNowResponse>;

  if (!json.data?.slot) throw new Error('No slot in response');
  if (!json.data?.epoch) throw new Error('No epoch in response');

  return {
    slot: json.data?.slot,
    epoch: json.data?.epoch,
  };
}

export async function fetchSpec(): Promise<Required<Spec>> {
  const response = await fetch(`${BASE_URL}api/v1/ethereum/spec`);

  if (!response.ok) {
    throw new Error('Failed to fetch slot data');
  }
  const json = (await response.json()) as Response<V1GetEthereumSpecResponse>;

  if (!json.data?.spec) throw new Error('No spec in response');

  return {
    network_name: json.data?.network_name ?? 'unknown',
    spec: json.data.spec,
  };
}
