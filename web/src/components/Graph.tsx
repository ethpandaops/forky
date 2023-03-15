import { useRef, useEffect } from 'react';

import classNames from 'classnames';
import * as d3 from 'd3';

interface Data {
  name: string;
  time: number;
  value: number;
  yOffset: number;
  children?: Data[];
}

const data: Data = {
  name: 'A1',
  time: 0,
  value: 100,
  yOffset: 0,
  children: [
    {
      name: 'B1',
      time: 1,
      value: 110,
      yOffset: 0,
      children: [
        {
          name: 'C1',
          time: 3,
          value: 70,
          yOffset: 0,
          children: [
            {
              name: 'E1',
              time: 5,
              value: 100,
              yOffset: 0,
              children: [
                {
                  name: 'G1',
                  time: 7,
                  value: 80,
                  yOffset: 1,
                  children: [],
                },
                {
                  name: 'H1',
                  time: 8,
                  value: 90,
                  yOffset: 0,
                  children: [
                    {
                      name: 'I1',
                      time: 9,
                      value: 120,
                      yOffset: 0,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'D1',
          time: 4,
          value: 50,
          yOffset: -1,
          children: [
            {
              name: 'F1',
              time: 6,
              value: 20,
              yOffset: -1,
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

const Graph = ({ className }: { className?: string }) => {
  // Element References
  const svgRef = useRef(null);
  const {
    current: [width, height],
  } = useRef([window.innerWidth, window.innerHeight]);

  useEffect(() => {
    if (svgRef.current === null) return;

    const dimensions = {
      width,
      height,
      margins: 5,
    };

    const svg = d3
      .select<Element, unknown>(svgRef.current)
      .classed('line-chart-svg', true)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`);

    let container: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> =
      svg.select('g.container');

    if (svg.select('g.container').empty()) {
      container = svg
        .append('g') /* eslint-disable */
        // @ts-nocheck
        .classed('container', true)
        .attr('transform', `translate(${dimensions.margins}, ${dimensions.margins})`);
    }

    let links: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> = container.select('g.links');
    if (container.select('g.links').empty()) {
      links = container.append('g').classed('links', true);
    }

    let nodes: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> = container.select('g.nodes');
    if (container.select('g.nodes').empty()) {
      nodes = container.append('g').classed('nodes', true);
    }

    const zoom = d3.zoom<Element, unknown>().on('zoom', (e) => {
      container.attr('transform', e.transform);
    });

    const treeLayout = d3
      .tree<Data>()
      .size([dimensions.width, dimensions.height])
      .separation(function (a, b) {
        return (a.parent == b.parent ? 1 : 2) / a.depth;
      });

    let root = d3.hierarchy<Data>(data);

    const x_max =
      d3.max(root.descendants(), function (d) {
        return d.data.time;
      }) ?? 0;

    const x = d3.scaleLinear().domain([0, x_max]).range([0, dimensions.width]);

    let rootPoint = treeLayout(root);

    const adjust_x = function (d: d3.HierarchyPointNode<Data>) {
      return x(d.data.time);
    };

    const adjust_y = function (d: d3.HierarchyPointNode<Data>) {
      return d.y;
    };

    const textOffset = 25;
    const radiusFactor = 0.5;

    // Nodes
    nodes
      .selectAll('circle')
      .data<d3.HierarchyPointNode<Data>>(rootPoint.descendants())
      .join('circle')
      .classed('node', true)
      .attr('cx', adjust_x)
      .attr('cy', adjust_y)
      .attr('r', function (d) {
        return d.data.value * radiusFactor;
      });

    // add node text
    nodes
      .selectAll('text')
      .data<d3.HierarchyPointNode<Data>>(rootPoint.descendants())
      .join('text')
      .style('fill', function (d) {
        return 'white';
      })
      .attr('x', adjust_x)
      .attr('y', adjust_y)
      .attr('dy', function (d) {
        return d.data.value * radiusFactor + textOffset;
      })
      .attr('text-anchor', 'middle')
      .text(function (d) {
        return d.data.value;
      });

    // Links
    links
      .selectAll('line')
      .data<d3.HierarchyPointLink<Data>>(rootPoint.links())
      .join('line')
      .classed('link', true)
      .style('stroke', function (d) {
        return 'black';
      })
      .attr('x1', function (d) {
        return adjust_x(d.source);
      })
      .attr('y1', function (d) {
        return adjust_y(d.source);
      })
      .attr('x2', function (d) {
        return adjust_x(d.target);
      })
      .attr('y2', function (d) {
        return adjust_y(d.target);
      });

    function ticked() {
      nodes
        .selectAll('circle')
        .data<d3.HierarchyPointNode<Data>>(rootPoint.descendants())
        .join('circle')
        .classed('node', true)
        .attr('cx', adjust_x)
        .attr('cy', adjust_y)
        .attr('r', function (d) {
          return d.data.value * radiusFactor;
        });
      nodes
        .selectAll('text')
        .data<d3.HierarchyPointNode<Data>>(rootPoint.descendants())
        .join('text')
        .style('fill', 'black')
        .attr('x', adjust_x)
        .attr('y', adjust_y)
        .attr('dy', function (d) {
          return d.data.value * radiusFactor + textOffset;
        })
        .attr('text-anchor', 'middle')
        .text(function (d) {
          return d.data.value;
        });
      links
        .selectAll('line')
        .data<d3.HierarchyPointLink<Data>>(rootPoint.links())
        .join('line')
        .classed('link', true)
        .style('stroke', function (d) {
          return 'black';
        })
        .attr('x1', function (d) {
          return adjust_x(d.source);
        })
        .attr('y1', function (d) {
          return adjust_y(d.source);
        })
        .attr('x2', function (d) {
          return adjust_x(d.target);
        })
        .attr('y2', function (d) {
          return adjust_y(d.target);
        });
    }

    // const rootDescendants = root.descendants();
    // // convert to d3.SimulationNodeDatum
    // const simulationNodes = rootDescendants.map((d) => {
    //   return {
    //     data: d.data,
    //     x: x(d.data.time),
    //     y: y(d.data.value),
    //   };
    // });

    const simulation = d3
      .forceSimulation<d3.HierarchyPointNode<Data>>(rootPoint.descendants())
      // .force(
      //   'charge',
      //   d3.forceManyBody<d3.HierarchyNode<Data>>().strength(function (d, i) {
      //     // return -(d.data.value / radiusFactor);
      //     // return -1000
      //     return i==0 ? -10000 : -500;
      //   }),
      // )
      .force(
        'center',
        d3.forceCenter<d3.HierarchyPointNode<Data>>(dimensions.width / 2, dimensions.height / 2),
      )
      .force(
        'x',
        d3.forceX<d3.HierarchyPointNode<Data>>().x(function (d) {
          return x(d.data.time);
        }),
      )
      // force y to center
      .force(
        'y',
        d3.forceY<d3.HierarchyPointNode<Data>>().y(function (d) {
          return d.data.yOffset * 200;
        }),
      )
      // .force(
      //   'collision',
      //   d3.forceCollide<d3.HierarchyPointNode<Data>>().radius(function (d) {
      //     // radius of the circle
      //     return d.data.value * radiusFactor + textOffset + 50;
      //   }),
      // )
      // .force('link', d3.forceLink().links(rootPoint.links()).distance(200))
      .tick(2000)
      .on('tick', ticked);

    svg.call(zoom);

    const des = rootPoint.descendants();
    const lastDes = des[des.length - 1];
    svg
      .transition()
      .duration(0)
      .call(zoom.transform, d3.zoomIdentity.scale(1).translate(-lastDes.x + dimensions.width / 2, 0));

    function zoomNode(node: d3.HierarchyPointNode<Data>, duration = 2500) {
      svg
        .transition()
        .duration(duration)
        .call(
          zoom.transform,
          d3.zoomIdentity
            .translate(dimensions.width / 2, dimensions.height / 2)
            .scale(1)
            .translate(-node.x, -(dimensions.height / 2)),
        );
    }

    setTimeout(() => {
      simulation.alpha(0.5).restart();
      zoomNode(lastDes);
    }, 1000);

  }, [width, height]);

  return (
    <div className={className}>
      <div className="flex">
          <svg data-testid="svg" ref={svgRef} className="flex-no-shrink fill-current" />
      </div>
    </div>
  );
};

export default Graph;
