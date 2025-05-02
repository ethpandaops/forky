import { useMemo } from 'react';

import Graphology from 'graphology';

import {
  ProcessedData,
  Graph,
  NodeAttributes,
  EdgeAttributes,
  GraphAttributes,
} from '@app/types/graph';
import { aggregateProcessedData } from '@utils/graph';

interface NodeData {
  id: string;
  x: number;
  y: number;
  attributes: NodeAttributes;
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
  graph: Graph;
  spacingX: number;
  spacingY: number;
}): NodeData[] {
  return graph.mapNodes(node => {
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
  graph: Graph;
  spacingX: number;
  spacingY: number;
}): EdgeData[] {
  return graph.mapEdges(edge => {
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
    };
  });
}

function generateOffsetData(graph: Graph): OffsetData {
  const minOffset =
    graph
      .mapNodes(node => graph.getNodeAttribute(node, 'offset'))
      .reduce((min, offset) => Math.min(min, offset), 0) ?? 0;
  const maxOffset =
    graph
      .mapNodes(node => graph.getNodeAttribute(node, 'offset'))
      .reduce((max, offset) => Math.max(max, offset), 0) ?? 0;
  return {
    minOffset,
    maxOffset,
  };
}

export default function useGraph({
  data,
  spacingX,
  spacingY,
}: {
  data: ProcessedData[];
  spacingX: number;
  spacingY: number;
}) {
  const { edges, nodes, offset, attributes, type } = useMemo<{
    edges: EdgeData[];
    nodes: NodeData[];
    offset: OffsetData;
    attributes: GraphAttributes;
    type: 'aggregated' | 'weighted' | 'concat' | 'empty';
  }>(() => {
    let graph: Graph;
    let type: 'aggregated' | 'weighted' | 'empty' = 'empty';
    if (!data.length) {
      const g = new Graphology<NodeAttributes, EdgeAttributes, GraphAttributes>();
      g.updateAttributes(() => ({
        slotStart: 0,
        slotEnd: 0,
        id: 'empty',
        type: 'empty',
      }));
      graph = g;
    } else if (data.length === 1) {
      graph = data[0].graph;
      type = 'weighted';
    } else {
      graph = aggregateProcessedData(data);
      type = 'aggregated';
    }

    return {
      edges: generateEdgeData({ graph, spacingX, spacingY }),
      nodes: generateNodeData({ graph, spacingX, spacingY }),
      offset: generateOffsetData(graph),
      attributes: graph.getAttributes(),
      type,
    };
  }, [spacingX, spacingY, data]);

  return { ...attributes, ...offset, edges, nodes, type };
}
