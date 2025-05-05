import { Response, V1GetFrameResponse, Frame } from '@app/types/api';
import { ProcessedData } from '@app/types/graph';
import { BASE_URL } from '@utils/environment';
import { processForkChoiceData } from '@utils/graph';

export async function fetchFrame(id: string): Promise<ProcessedData> {
  const response = await fetch(`${BASE_URL}api/v1/frames/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch snapshot data');
  }
  const json = (await response.json()) as Response<V1GetFrameResponse>;
  const frame = json.data?.frame;

  if (frame === undefined) throw new Error('No frame in response');
  if (frame?.data === undefined) throw new Error('No frame data in response');
  if (frame?.metadata === undefined) throw new Error('No frame metadata in response');

  return processForkChoiceData(frame as Required<Frame>);
}
