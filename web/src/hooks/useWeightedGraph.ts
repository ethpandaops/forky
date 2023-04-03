import { useState } from 'react';

import { Data } from '@app/api/frames';
import { ForkChoiceData } from '@app/types/api';
import { equalForkChoiceData } from '@utils/api';
import {
  EdgeAttributes,
  WeightedGraph,
  GraphAttributes,
  WeightedNodeAttributes,
} from '@utils/graph';

interface NodeData {
  id: string;
  x: number;
  y: number;
  attributes: WeightedNodeAttributes;
}

interface EdgeRelationship {
  x: number;
  y: number;
  id: string;
}

interface EdgeData {
  id: string;
  canonical: boolean;
  source: EdgeRelationship;
  target: EdgeRelationship;
  attributes: EdgeAttributes;
}

interface OffsetData {
  minOffset: number;
  maxOffset: number;
}

function generateNodeData({
  graph,
  spacingX,
  spacingY,
}: {
  graph?: WeightedGraph;
  spacingX: number;
  spacingY: number;
}): NodeData[] {
  if (!graph) return [];
  return graph.mapNodes((node) => {
    return {
      id: node,
      x:
        (graph.getNodeAttribute(node, 'slot') - graph.getAttribute('slotStart')) * spacingX +
        spacingX,
      y: graph.getNodeAttribute(node, 'offset') * spacingY - spacingY,
      attributes: graph.getNodeAttributes(node),
    };
  });
}

function generateEdgeData({
  graph,
  spacingX,
  spacingY,
}: {
  graph?: WeightedGraph;
  spacingX: number;
  spacingY: number;
}): EdgeData[] {
  if (!graph) return [];
  return graph.mapEdges((edge) => {
    return {
      id: edge,
      canonical: graph.getSourceAttribute(edge, 'canonical'),
      source: {
        id: graph.getSourceAttribute(edge, 'blockRoot'),
        x:
          (graph.getSourceAttribute(edge, 'slot') - graph.getAttribute('slotStart')) * spacingX +
          spacingX,
        y: graph.getSourceAttribute(edge, 'offset') * spacingY - spacingY,
      },
      target: {
        id: graph.getTargetAttribute(edge, 'blockRoot'),
        x:
          (graph.getTargetAttribute(edge, 'slot') - graph.getAttribute('slotStart')) * spacingX +
          spacingX,
        y: graph.getTargetAttribute(edge, 'offset') * spacingY - spacingY,
      },
      attributes: graph.getEdgeAttributes(edge),
    };
  });
}

function generateOffsetData(graph?: WeightedGraph): OffsetData {
  if (!graph) return { minOffset: 0, maxOffset: 0 };
  const minOffset = graph
    .mapNodes((node) => graph.getNodeAttribute(node, 'offset'))
    .reduce((min, offset) => Math.min(min, offset), 0);
  const maxOffset = graph
    .mapNodes((node) => graph.getNodeAttribute(node, 'offset'))
    .reduce((max, offset) => Math.max(max, offset), 0);
  return {
    minOffset,
    maxOffset,
  };
}

export default function useWeightedGraph({
  data,
  spacingX,
  spacingY,
}: {
  data?: Data;
  spacingX: number;
  spacingY: number;
}) {
  const [currentData, setCurrentData] = useState<ForkChoiceData | undefined>(data?.frame.data);
  const [currentSpacingX, setCurrentSpacingX] = useState<number>(spacingX);
  const [currentSpacingY, setCurrentSpacingY] = useState<number>(spacingY);
  const [attributes, setAttributes] = useState<GraphAttributes>(
    data?.graph.getAttributes() ?? { slotStart: 0, slotEnd: 0, forks: 0 },
  );
  const [nodes, setNodes] = useState<ReturnType<typeof generateNodeData>>(
    generateNodeData({ graph: data?.graph, spacingX: currentSpacingX, spacingY: currentSpacingY }),
  );
  const [edges, setEdges] = useState<ReturnType<typeof generateEdgeData>>(
    generateEdgeData({ graph: data?.graph, spacingX: currentSpacingX, spacingY: currentSpacingY }),
  );
  const [offset, setOffset] = useState<ReturnType<typeof generateOffsetData>>(
    generateOffsetData(data?.graph),
  );

  if (currentSpacingX !== spacingX || currentSpacingY !== spacingY) {
    if (currentSpacingX !== spacingX) setCurrentSpacingX(spacingX);
    if (currentSpacingY !== spacingY) setCurrentSpacingY(spacingY);
    setNodes(generateNodeData({ graph: data?.graph, spacingX, spacingY }));
    setEdges(generateEdgeData({ graph: data?.graph, spacingX, spacingY }));
  }

  if (
    !(currentData === undefined && data?.frame.data === undefined) &&
    !equalForkChoiceData(currentData, data?.frame.data)
  ) {
    setCurrentData(data?.frame.data);
    setAttributes(data?.graph.getAttributes() ?? { slotStart: 0, slotEnd: 0, forks: 0 });
    setNodes(generateNodeData({ graph: data?.graph, spacingX, spacingY }));
    setEdges(generateEdgeData({ graph: data?.graph, spacingX, spacingY }));
    setOffset(generateOffsetData(data?.graph));
  }

  return { graph: data?.graph, attributes, ...offset, edges, nodes };
}
