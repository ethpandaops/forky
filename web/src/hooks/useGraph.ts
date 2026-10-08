import { useMemo } from 'react';

import Graphology from 'graphology';

import {
  ProcessedData,
  Graph,
  NodeAttributes,
  EdgeAttributes,
  GraphAttributes,
} from '@app/types/graph';
import { aggregateProcessedData, MAX_GRAPH_SLOTS } from '@utils/graph';

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
  builtOnEmpty: boolean;
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
  slotStart,
}: {
  graph: Graph;
  spacingX: number;
  spacingY: number;
  slotStart: number;
}): NodeData[] {
  return graph
    .filterNodes(node => graph.getNodeAttribute(node, 'slot') >= slotStart)
    .map(node => {
      return {
        id: node,
        x: (graph.getNodeAttribute(node, 'slot') - slotStart) * spacingX + spacingX,
        y: graph.getNodeAttribute(node, 'offset') * spacingY - spacingY,
        attributes: graph.getNodeAttributes(node),
      };
    });
}

function generateEdgeData({
  graph,
  spacingX,
  spacingY,
  slotStart,
}: {
  graph: Graph;
  spacingX: number;
  spacingY: number;
  slotStart: number;
}): EdgeData[] {
  return graph
    .filterEdges(
      edge =>
        graph.getSourceAttribute(edge, 'slot') >= slotStart &&
        graph.getTargetAttribute(edge, 'slot') >= slotStart,
    )
    .map(edge => {
      return {
        id: edge,
        canonical: graph.getSourceAttribute(edge, 'canonical'),
        builtOnEmpty: graph.getEdgeAttribute(edge, 'builtOnEmpty') ?? false,
        source: {
          id: graph.getSourceAttribute(edge, 'blockRoot'),
          x: (graph.getSourceAttribute(edge, 'slot') - slotStart) * spacingX + spacingX,
          y: graph.getSourceAttribute(edge, 'offset') * spacingY - spacingY,
        },
        target: {
          id: graph.getTargetAttribute(edge, 'blockRoot'),
          x: (graph.getTargetAttribute(edge, 'slot') - slotStart) * spacingX + spacingX,
          y: graph.getTargetAttribute(edge, 'offset') * spacingY - spacingY,
        },
      };
    });
}

function generateOffsetData(graph: Graph, slotStart: number): OffsetData {
  const offsets = graph
    .filterNodes(node => graph.getNodeAttribute(node, 'slot') >= slotStart)
    .map(node => graph.getNodeAttribute(node, 'offset'));
  const minOffset = offsets.reduce((min, offset) => Math.min(min, offset), 0) ?? 0;
  const maxOffset = offsets.reduce((max, offset) => Math.max(max, offset), 0) ?? 0;
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
  const { edges, nodes, offset, attributes, type, truncation } = useMemo<{
    edges: EdgeData[];
    nodes: NodeData[];
    offset: OffsetData;
    attributes: GraphAttributes;
    type: 'aggregated' | 'weighted' | 'concat' | 'empty';
    truncation: {
      markers: { slots: number; x: number; y: number }[];
      checkpoints: { slot: number; x: number }[];
      rail: { x1: number; y1: number; x2: number; y2: number } | null;
    } | null;
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

    // Truncate the tail of long graphs so the timeline stays responsive: only
    // render the most recent MAX_GRAPH_SLOTS worth of slots up to the head.
    const rawAttributes = graph.getAttributes();
    const slotStart =
      rawAttributes.slotEnd - rawAttributes.slotStart > MAX_GRAPH_SLOTS
        ? rawAttributes.slotEnd - MAX_GRAPH_SLOTS
        : rawAttributes.slotStart;

    const nodes = generateNodeData({ graph, spacingX, spacingY, slotStart });

    // When the tail was cut, keep the finalized/justified checkpoint blocks (if
    // they fell below the window) pinned into view in compact columns just left
    // of the window, with markers bridging the hidden gaps.
    let truncation: {
      markers: { slots: number; x: number; y: number }[];
      checkpoints: { slot: number; x: number }[];
      rail: { x1: number; y1: number; x2: number; y2: number } | null;
    } | null = null;
    if (slotStart > rawAttributes.slotStart && nodes.length) {
      // oldest visible canonical node — where the chain enters the window
      const canonical = nodes.filter(node => node.attributes.canonical);
      const pool = canonical.length ? canonical : nodes;
      const boundary = pool.reduce((oldest, node) =>
        node.attributes.slot < oldest.attributes.slot ? node : oldest,
      );
      const railY = boundary.y;

      // checkpoint nodes that fell below the window, oldest (lowest slot) first
      const pinnedIds = [rawAttributes.finalized, rawAttributes.justified]
        .filter(
          (id): id is string =>
            !!id && graph.hasNode(id) && graph.getNodeAttribute(id, 'slot') < slotStart,
        )
        .filter((id, index, arr) => arr.indexOf(id) === index)
        .sort((a, b) => graph.getNodeAttribute(a, 'slot') - graph.getNodeAttribute(b, 'slot'));

      const markers: { slots: number; x: number; y: number }[] = [];
      const checkpoints: { slot: number; x: number }[] = [];

      if (pinnedIds.length) {
        // compact columns: [checkpoint][gap][checkpoint][gap][window]
        const totalCols = pinnedIds.length * 2;
        const colX = (col: number) => (col - totalCols) * spacingX + spacingX;
        let col = 0;
        pinnedIds.forEach((id, index) => {
          const attributes = graph.getNodeAttributes(id);
          const nodeX = colX(col);
          nodes.push({ id, x: nodeX, y: railY, attributes });
          checkpoints.push({ slot: attributes.slot, x: nodeX });
          col += 1;
          const nextSlot =
            index + 1 < pinnedIds.length
              ? graph.getNodeAttribute(pinnedIds[index + 1], 'slot')
              : slotStart;
          markers.push({ slots: nextSlot - attributes.slot, x: colX(col), y: railY });
          col += 1;
        });
        truncation = {
          markers,
          checkpoints,
          rail: { x1: colX(0), y1: railY, x2: boundary.x, y2: railY },
        };
      } else {
        // no checkpoints to pin — just flag the hidden tail with one marker
        markers.push({
          slots: slotStart - rawAttributes.slotStart,
          x: boundary.x - spacingX,
          y: railY,
        });
        truncation = {
          markers,
          checkpoints,
          rail: { x1: boundary.x - spacingX, y1: railY, x2: boundary.x, y2: railY },
        };
      }
    }

    return {
      edges: generateEdgeData({ graph, spacingX, spacingY, slotStart }),
      nodes,
      offset: generateOffsetData(graph, slotStart),
      attributes: { ...rawAttributes, slotStart },
      type,
      truncation,
    };
  }, [spacingX, spacingY, data]);

  return { ...attributes, ...offset, edges, nodes, type, truncation };
}
