import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { DataFlow, RegionMetric } from '../types';

interface WorldFeature {
  type: string;
  properties?: {
    name?: string;
  };
  geometry: object;
}

interface WorldGeoJson {
  type: string;
  features: WorldFeature[];
}

interface CountryAggregate {
  name: string;
  sales: number;
  intensity: number;
  nodeCount: number;
}

interface TooltipState {
  x: number;
  y: number;
  content: CountryAggregate | null;
}

interface WorldMapProps {
  regions: RegionMetric[];
  flows: DataFlow[];
  selectedRegion?: string | null;
  onSelectRegion?: (regionName: string | null) => void;
}

const WORLD_GEOJSON_URL = '/world.geojson';

let worldGeoJsonPromise: Promise<WorldGeoJson> | null = null;

const initialRotation: [number, number, number] = [0, -30, 0];

const normalizeName = (value: string) => value.trim().toLowerCase();

const getFeatureName = (feature: WorldFeature) => feature.properties?.name ?? 'Unknown';

function loadWorldGeoJson() {
  if (!worldGeoJsonPromise) {
    worldGeoJsonPromise = d3.json<WorldGeoJson>(WORLD_GEOJSON_URL).then((data) => {
      if (!data) {
        throw new Error('Unable to load world geometry');
      }

      return data;
    });
  }

  return worldGeoJsonPromise;
}

const WorldMap: React.FC<WorldMapProps> = ({
  regions,
  flows,
  selectedRegion = null,
  onSelectRegion,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geoDataRef = useRef<WorldGeoJson | null>(null);
  const countryAggregatesRef = useRef<Map<string, CountryAggregate>>(new Map());
  const regionCountryCacheRef = useRef<Map<string, string>>(new Map());
  const rotationRef = useRef<[number, number, number]>(initialRotation);
  const renderScheduledRef = useRef(false);
  const initializedRef = useRef(false);

  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, content: null });
  const [rotationDisplay, setRotationDisplay] = useState<[number, number, number]>(initialRotation);

  const syncCountryAggregates = useCallback((nextRegions: RegionMetric[]) => {
    const geoData = geoDataRef.current;
    if (!geoData) return;

    const nextAggregates = new Map<string, CountryAggregate>();
    const featureByName = new Map(
      geoData.features.map((feature) => [normalizeName(getFeatureName(feature)), feature])
    );

    nextRegions.forEach((region) => {
      const regionKey = `${normalizeName(region.name)}:${region.coords[0]},${region.coords[1]}`;
      let countryName = regionCountryCacheRef.current.get(regionKey);

      if (!countryName) {
        const namedFeature = featureByName.get(normalizeName(region.name));
        const fallbackFeature =
          namedFeature ??
          geoData.features.find((feature) =>
            d3.geoContains(feature as any, region.coords as [number, number])
          );

        countryName = fallbackFeature ? getFeatureName(fallbackFeature) : region.name;
        regionCountryCacheRef.current.set(regionKey, countryName);
      }

      const aggregate = nextAggregates.get(countryName) ?? {
        name: countryName,
        sales: 0,
        intensity: 0,
        nodeCount: 0,
      };

      aggregate.sales += region.sales;
      aggregate.intensity += region.intensity;
      aggregate.nodeCount += 1;
      nextAggregates.set(countryName, aggregate);
    });

    nextAggregates.forEach((aggregate) => {
      aggregate.intensity /= aggregate.nodeCount || 1;
    });

    countryAggregatesRef.current = nextAggregates;
  }, []);

  const initializeScene = useCallback(() => {
    if (!svgRef.current || initializedRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.attr('class', 'w-full h-full cursor-move');

    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    svg.append('circle').attr('data-layer', 'atmosphere');
    svg.append('path').attr('data-layer', 'graticule');
    svg.append('g').attr('data-layer', 'land');
    svg.append('g').attr('data-layer', 'flows');
    svg.append('g').attr('data-layer', 'focus');

    const drag = d3.drag<SVGSVGElement, unknown>().on('drag', (event) => {
      const sensitivity = 0.25;
      rotationRef.current = [
        rotationRef.current[0] + event.dx * sensitivity,
        Math.max(-90, Math.min(90, rotationRef.current[1] - event.dy * sensitivity)),
        rotationRef.current[2],
      ];
      setRotationDisplay([...rotationRef.current] as [number, number, number]);
      scheduleRender();
    });

    svg.call(drag as never);
    initializedRef.current = true;
  }, []);

  const renderGlobe = useCallback(() => {
    renderScheduledRef.current = false;

    if (!svgRef.current || !containerRef.current || !geoDataRef.current) return;

    initializeScene();

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    const radius = Math.min(width, height) / 2.2;
    const rotation = rotationRef.current;
    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([width / 2, height / 2])
      .rotate(rotation)
      .clipAngle(90);
    const path = d3.geoPath().projection(projection);
    const graticule = d3.geoGraticule();

    const countryAggregates = countryAggregatesRef.current;
    const intensityScale = d3
      .scaleLinear<string>()
      .domain([0, 45, 75, 100])
      .range(['#111217', '#14313d', '#126177', '#32d74b'])
      .clamp(true);

    const atmosphere = svg.select<SVGCircleElement>('circle[data-layer="atmosphere"]');
    atmosphere
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', radius)
      .attr('fill', '#0a192f')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .style('filter', 'url(#glow)')
      .attr('opacity', 0.6);

    svg.attr('width', width).attr('height', height);

    svg
      .select<SVGPathElement>('path[data-layer="graticule"]')
      .datum(graticule())
      .attr('d', path as never)
      .attr('fill', 'none')
      .attr('stroke', '#2c3235')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);

    const selectedName = selectedRegion ? normalizeName(selectedRegion) : null;
    const landGroup = svg.select<SVGGElement>('g[data-layer="land"]');
    const countries = landGroup
      .selectAll<SVGPathElement, WorldFeature>('path.country')
      .data(geoDataRef.current.features, (feature) => getFeatureName(feature));

    countries
      .join((enter) =>
        enter
          .append('path')
          .attr('class', 'country')
          .style('cursor', 'pointer')
          .on('mouseenter', (event, feature) => {
            const countryName = getFeatureName(feature);
            setTooltip({
              x: event.clientX,
              y: event.clientY,
              content: countryAggregates.get(countryName) ?? null,
            });
          })
          .on('mousemove', (event, feature) => {
            const countryName = getFeatureName(feature);
            setTooltip({
              x: event.clientX,
              y: event.clientY,
              content: countryAggregates.get(countryName) ?? null,
            });
          })
          .on('mouseleave', () => {
            setTooltip((prev) => ({ ...prev, content: null }));
          })
          .on('click', (_, feature) => {
            const countryName = getFeatureName(feature);
            onSelectRegion?.(selectedName === normalizeName(countryName) ? null : countryName);
          })
      )
      .attr('d', path as never)
      .attr('fill', (feature) => {
        const aggregate = countryAggregates.get(getFeatureName(feature));
        return aggregate ? intensityScale(aggregate.intensity) : '#111217';
      })
      .attr('stroke', (feature) => {
        const countryName = normalizeName(getFeatureName(feature));
        return selectedName === countryName ? '#f8fafc' : '#3b82f6';
      })
      .attr('stroke-width', (feature) => {
        const countryName = normalizeName(getFeatureName(feature));
        return selectedName === countryName ? 1 : 0.35;
      })
      .attr('opacity', (feature) => {
        const aggregate = countryAggregates.get(getFeatureName(feature));
        return aggregate ? 0.96 : 0.9;
      });

    const visibleFlows = flows
      .slice()
      .sort((left, right) => right.value - left.value)
      .filter((flow) => {
        const sourceVisible = d3.geoDistance(flow.source, [-rotation[0], -rotation[1]]) < Math.PI / 2;
        const targetVisible = d3.geoDistance(flow.target, [-rotation[0], -rotation[1]]) < Math.PI / 2;
        return sourceVisible && targetVisible;
      })
      .slice(0, 24)
      .map((flow) => ({ ...flow, type: 'LineString', coordinates: [flow.source, flow.target] }));

    svg
      .select<SVGGElement>('g[data-layer="flows"]')
      .selectAll<SVGPathElement, DataFlow & { type: string; coordinates: [[number, number], [number, number]] }>('path.flow')
      .data(visibleFlows, (flow) => flow.id)
      .join((enter) => enter.append('path').attr('class', 'flow'))
      .attr('d', path as never)
      .attr('fill', 'none')
      .attr('stroke', '#f97316')
      .attr('stroke-width', (flow) => Math.max(1, Math.min(2.4, flow.value / 15000)))
      .attr('stroke-dasharray', '5,7')
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0.55);

    const selectedAggregate =
      selectedRegion
        ? (Array.from(countryAggregates.values()) as CountryAggregate[]).find(
            (aggregate) => normalizeName(aggregate.name) === normalizeName(selectedRegion)
          ) ?? null
        : null;

    const focusFeature =
      selectedAggregate &&
      geoDataRef.current.features.find(
        (feature) => normalizeName(getFeatureName(feature)) === normalizeName(selectedAggregate.name)
      );

    const focusData = focusFeature
      ? (() => {
          const [x, y] = path.centroid(focusFeature as never);
          return Number.isFinite(x) && Number.isFinite(y) ? [{ x, y }] : [];
        })()
      : [];

    svg
      .select<SVGGElement>('g[data-layer="focus"]')
      .selectAll<SVGCircleElement, { x: number; y: number }>('circle')
      .data(focusData)
      .join((enter) => enter.append('circle'))
      .attr('cx', (point) => point.x)
      .attr('cy', (point) => point.y)
      .attr('r', 5)
      .attr('fill', '#f8fafc')
      .attr('stroke', '#32d74b')
      .attr('stroke-width', 3)
      .attr('opacity', 0.95);
  }, [flows, initializeScene, onSelectRegion, selectedRegion]);

  const scheduleRender = useCallback(() => {
    if (renderScheduledRef.current) return;
    renderScheduledRef.current = true;
    requestAnimationFrame(() => {
      renderGlobe();
    });
  }, [renderGlobe]);

  useEffect(() => {
    let cancelled = false;

    loadWorldGeoJson()
      .then((data) => {
        if (cancelled) return;
        geoDataRef.current = data;
        syncCountryAggregates(regions);
        scheduleRender();
      })
      .catch(() => {
        if (!cancelled) {
          setTooltip((prev) => ({ ...prev, content: null }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [regions, scheduleRender, syncCountryAggregates]);

  useEffect(() => {
    syncCountryAggregates(regions);
    scheduleRender();
  }, [regions, scheduleRender, syncCountryAggregates]);

  useEffect(() => {
    scheduleRender();
  }, [flows, scheduleRender, selectedRegion]);

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
      <div className="absolute inset-0 border border-blue-500/10 pointer-events-none">
        <div className="absolute top-0 left-0 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-l-2 border-blue-500/30"></div>
        <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-r-2 border-blue-500/30"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-l-2 border-blue-500/30"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-r-2 border-blue-500/30"></div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-move" />

      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 text-[8px] sm:text-[9px] font-mono text-blue-500/50 flex flex-col items-end">
        <span>ROT_X: {rotationDisplay[0].toFixed(2)}</span>
        <span>ROT_Y: {rotationDisplay[1].toFixed(2)}</span>
        <span className="text-green-500">MODE: CHOROPLETH</span>
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
            Avg. Intensity: {tooltip.content.intensity.toFixed(1)}%
          </div>
          <div className="text-[9px] text-gray-500">Nodes: {tooltip.content.nodeCount}</div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex flex-col gap-1 p-1.5 sm:p-2 bg-black/40 border border-blue-500/10 rounded backdrop-blur-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500"></div>
          <span className="text-[7px] sm:text-[9px] font-bold text-gray-400 uppercase">
            Prioritized Flow Paths
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></div>
          <span className="text-[7px] sm:text-[9px] font-bold text-gray-400 uppercase">
            Country Load Overlay
          </span>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
