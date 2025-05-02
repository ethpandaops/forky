import { Response, V1GetFrameResponse, Frame } from '@app/types/api';
import { ProcessedData } from '@app/types/graph';
import { BASE_URL } from '@utils/environment';
import { processForkChoiceData } from '@utils/graph';
import { parseMultipartMixed } from '@utils/api';

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
export async function fetchFramesBatch(ids: string[]): Promise<Record<string, ProcessedData>> {
  if (ids.length === 0) {
    return {};
  }

  if (ids.length === 1) {
    const result: Record<string, ProcessedData> = {};
    try {
      result[ids[0]] = await fetchFrame(ids[0]);
    } catch (error) {
      console.error(`Error fetching single frame ${ids[0]}:`, error);
    }
    return result;
  }

  try {
    console.log(`Fetching ${ids.length} frames in batch`);
    const response = await fetch(`${BASE_URL}api/v1/frames/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch frames batch: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('multipart/mixed')) {
      throw new Error('Expected multipart/mixed response');
    }

    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
      throw new Error('Could not determine multipart boundary');
    }
    const boundary = boundaryMatch[1];

    const buffer = await response.arrayBuffer();
    const result: Record<string, ProcessedData> = {};
    const frames = await parseMultipartMixed(buffer, boundary);

    for (const [id, frameData] of Object.entries(frames)) {
      try {
        if (!frameData) {
          console.warn(`No data for frame ${id}`);
          continue;
        }

        result[id] = processForkChoiceData(frameData as Required<Frame>);
      } catch (error) {
        console.error(`Failed to process frame ${id}:`, error);
      }
    }

    if (Object.keys(result).length > 0) {
      return result;
    }

    throw new Error('Failed to parse any frames from batch response');
  } catch (error) {
    console.warn('Batch fetch failed, falling back to individual requests:', error);

    const result: Record<string, ProcessedData> = {};
    await Promise.all(
      ids.map(async id => {
        try {
          result[id] = await fetchFrame(id);
        } catch (error) {
          console.error(`Failed to fetch frame ${id}:`, error);
        }
      }),
    );

    return result;
  }
}
