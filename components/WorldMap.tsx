
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { RegionMetric, DataFlow } from '../types';

interface WorldMapProps {
  regions: RegionMetric[];
  flows: DataFlow[];
}

const WorldMap: React.FC<WorldMapProps> = ({ regions, flows }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geoDataRef = useRef<any>(null);
  // Keep latest props in refs for D3 imperative rendering (avoids stale closures)
  const dataRef = useRef<RegionMetric[]>(regions);
  const flowsRef = useRef<DataFlow[]>(flows);
  const rotationRef = useRef<[number, number, number]>([0, -30, 0]);
  const renderScheduledRef = useRef(false);

  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: RegionMetric | null }>({
    x: 0,
    y: 0,
    content: null,
  });
  const [rotationDisplay, setRotationDisplay] = useState<[number, number, number]>([0, -30, 0]);

  // Render the globe imperatively using D3 -- no React state in the loop
  const renderGlobe = useCallback(() => {
    renderScheduledRef.current = false;

    if (!svgRef.current || !containerRef.current || !geoDataRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    const radius = Math.min(width, height) / 2.2;
    const rotation = rotationRef.current;
    const data = dataRef.current;

    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([width / 2, height / 2])
      .rotate(rotation);

    const path = d3.geoPath().projection(projection);

    // Atmosphere
    svg
      .append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', radius)
      .attr('fill', '#0a192f')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .style('filter', 'url(#glow)')
      .attr('opacity', 0.6);

    // Graticule
    const graticule = d3.geoGraticule();
    svg
      .append('path')
      .datum(graticule())
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#2c3235')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);

    // Landmass
    svg
      .append('g')
      .selectAll('path')
      .data(geoDataRef.current.features)
      .enter()
      .append('path')
      .attr('d', path as any)
      .attr('fill', '#111217')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 0.3)
      .attr('opacity', 0.9);

    // Data arcs (flows)
    const flowsGroup = svg.append('g');
    flowsRef.current.forEach((flow) => {
      const sourcePoint = projection(flow.source);
      const targetPoint = projection(flow.target);
      if (!sourcePoint || !targetPoint) return;

      const isSourceVisible =
        d3.geoDistance(flow.source, [-rotation[0], -rotation[1]]) < Math.PI / 2;
      const isTargetVisible =
        d3.geoDistance(flow.target, [-rotation[0], -rotation[1]]) < Math.PI / 2;

      if (isSourceVisible && isTargetVisible) {
        const geoLine = { type: 'LineString', coordinates: [flow.source, flow.target] };
        flowsGroup
          .append('path')
          .datum(geoLine as any)
          .attr('d', path as any)
          .attr('fill', 'none')
          .attr('stroke', '#f97316')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '10,10')
          .attr('opacity', 0.6)
          .append('animate')
          .attr('attributeName', 'stroke-dashoffset')
          .attr('from', 100)
          .attr('to', 0)
          .attr('dur', '2s')
          .attr('repeatCount', 'indefinite');
      }
    });

    // Region hotspots
    const hotspots = svg.append('g');
    data.forEach((region) => {
      const coords = projection(region.coords as [number, number]);
      const isVisible =
        d3.geoDistance(region.coords as [number, number], [-rotation[0], -rotation[1]]) <
        Math.PI / 2;

      if (coords && isVisible) {
        const [x, y] = coords;
        const bubbleSize = Math.max(3, (region.sales / 5000) * 4);

        hotspots
          .append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', bubbleSize)
          .attr('fill', '#32d74b')
          .attr('stroke', 'white')
          .attr('stroke-width', 0.5)
          .style('cursor', 'pointer')
          .on('mouseover', (event: MouseEvent) => {
            setTooltip({ x: event.clientX, y: event.clientY, content: region });
          })
          .on('mouseout', () => setTooltip((prev) => ({ ...prev, content: null })));
      }
    });

    // Drag interaction
    const drag = d3.drag<SVGSVGElement, unknown>().on('drag', (event) => {
      const sensitivity = 0.25;
      rotationRef.current = [
        rotationRef.current[0] + event.dx * sensitivity,
        rotationRef.current[1] - event.dy * sensitivity,
        rotationRef.current[2],
      ];
      setRotationDisplay([...rotationRef.current] as [number, number, number]);
      scheduleRender();
    });

    svg.call(drag as any);
  }, []);

  // Schedule a render on the next animation frame (deduplicated)
  const scheduleRender = useCallback(() => {
    if (renderScheduledRef.current) return;
    renderScheduledRef.current = true;
    requestAnimationFrame(() => {
      renderGlobe();
    });
  }, [renderGlobe]);

  // Load GeoJSON once
  useEffect(() => {
    d3.json(
      'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
    ).then((data) => {
      geoDataRef.current = data;
      scheduleRender();
    });
  }, [scheduleRender]);

  // Sync props into refs and re-render whenever regions or flows change
  useEffect(() => {
    dataRef.current = regions;
    scheduleRender();
  }, [regions, scheduleRender]);

  useEffect(() => {
    flowsRef.current = flows;
    scheduleRender();
  }, [flows, scheduleRender]);

  // Responsive resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      scheduleRender();
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [scheduleRender]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center"
      style={{ minHeight: '200px' }}
    >
      {/* HUD Borders */}
      <div className="absolute inset-0 border border-blue-500/10 pointer-events-none">
        <div className="absolute top-0 left-0 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-l-2 border-blue-500/30"></div>
        <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-r-2 border-blue-500/30"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-l-2 border-blue-500/30"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-r-2 border-blue-500/30"></div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-move" />

      {/* Rotation display */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 text-[8px] sm:text-[9px] font-mono text-blue-500/50 flex flex-col items-end">
        <span>ROT_X: {rotationDisplay[0].toFixed(2)}</span>
        <span>ROT_Y: {rotationDisplay[1].toFixed(2)}</span>
        <span className="text-green-500">SYNC: LIVE</span>
      </div>

      {tooltip.content && (
        <div
          className="fixed pointer-events-none z-50 bg-[#0b0c10]/90 border border-blue-500/50 p-2 rounded shadow-2xl backdrop-blur-md"
          style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
        >
          <div className="text-[9px] uppercase font-bold text-blue-400 mb-1">
            {tooltip.content.name}
          </div>
          <div className="text-[11px] font-bold text-white">
            ${Math.round(tooltip.content.sales).toLocaleString()}
          </div>
          <div className="text-[9px] text-gray-500">
            Node Intensity: {tooltip.content.intensity.toFixed(1)}%
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex flex-col gap-1 p-1.5 sm:p-2 bg-black/40 border border-blue-500/10 rounded backdrop-blur-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 animate-pulse"></div>
          <span className="text-[7px] sm:text-[9px] font-bold text-gray-400 uppercase">
            Live Data Flow
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></div>
          <span className="text-[7px] sm:text-[9px] font-bold text-gray-400 uppercase">
            Edge Node
          </span>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
