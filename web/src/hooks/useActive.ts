import { useMemo } from 'react';

import { FrameMetaData } from '@app/types/api';
import useFocus from '@contexts/focus';
import { useMetadataQuery } from '@hooks/useQuery';

interface State {
  nodes: string[];
  ids: string[];
}

export function findLatestFrameIdPerNode(
  focusedTime: number,
  metadata: FrameMetaData[] = [],
  focusedNode?: string,
): State {
  // Filter metadata
  metadata = metadata.filter((frame) => {
    // only frames with fetched_at before focusedTime
    if (new Date(frame.fetched_at).getTime() >= focusedTime) return false;
    // only frames that are not a reorg
    if (frame.labels?.includes('xatu_event_name=BEACON_API_ETH_V1_DEBUG_FORK_CHOICE_REORG'))
      return false;

    return true;
  });

  // Group metadata by node
  let groupedMetadata: { [key: string]: FrameMetaData[] } = {};
  for (const frame of metadata) {
    if (!groupedMetadata[frame.node]) {
      groupedMetadata[frame.node] = [];
    }
    groupedMetadata[frame.node].push(frame);
  }

  // Filter by focusedNode if it's set
  if (focusedNode) {
    const nodeMetadata = groupedMetadata[focusedNode] || [];
    groupedMetadata = { [focusedNode]: nodeMetadata };
  }

  // Sort frames within each group and select the latest frame id
  const latestFrameIds: State = { nodes: [], ids: [] };
  for (const node in groupedMetadata) {
    const latestFrame = groupedMetadata[node].sort((a, b) => {
      return new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime();
    })[0];

    if (latestFrame) {
      latestFrameIds.nodes.push(node);
      latestFrameIds.ids.push(latestFrame.id);
    }
  }

  return latestFrameIds;
}

export default function useActiveFrame(): State {
  const {
    slot: focusedSlot,
    time: focusedTime,
    node: focusedNode,
    frameId: focusedFrameId,
  } = useFocus();
  const { data: metadataCurrent } = useMetadataQuery(
    {
      slot: focusedSlot,
    },
    !focusedFrameId,
  );
  const { data: metadataMinus1 } = useMetadataQuery(
    {
      slot: focusedSlot - 1,
    },
    !focusedFrameId,
  );
  const { data: metadataMinus2 } = useMetadataQuery(
    {
      slot: focusedSlot - 2,
    },
    !focusedFrameId,
  );

  return useMemo(() => {
    if (focusedFrameId) return { nodes: [], ids: [focusedFrameId] };
    return findLatestFrameIdPerNode(
      focusedTime,
      [...(metadataCurrent ?? []), ...(metadataMinus1 ?? []), ...(metadataMinus2 ?? [])],
      focusedNode,
    );
  }, [focusedFrameId, focusedTime, metadataCurrent, metadataMinus1, metadataMinus2, focusedNode]);
}
