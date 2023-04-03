import { ForkChoiceData, Response, V1GetFrameResponse } from '@app/types/api';
import { BASE_URL } from '@utils/environment';
import { weightedGraphFromData, WeightedGraph } from '@utils/graph';

export type Data = {
  frame: Required<Required<V1GetFrameResponse>['frame']>;
  graph: WeightedGraph;
};

export async function fetchFrame(id: string): Promise<Data> {
  const response = await fetch(`${BASE_URL}api/v1/frames/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch slot data');
  }
  const json = (await response.json()) as Response<V1GetFrameResponse>;
  const frame = json.data?.frame;

  if (!frame?.data) throw new Error('No frame data in response');
  if (!frame?.metadata) throw new Error('No frame metadata in response');

  return {
    frame: {
      data: frame.data,
      metadata: frame.metadata,
    },
    graph: weightedGraphFromData(frame.data),
  };
}
