import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface LineChartSeries<T> {
  id: string | number;
  label: string;
  color?: string;
  data: T[];
  onClick?: () => void;
}

export interface LineChartProps<T> {
  data?: T[];
  series?: LineChartSeries<T>[];
  getId: (d: T) => string | number;
  getLabel: (d: T) => string;
  getValue: (d: T) => number;
  formatValue?: (value: number) => string;
  lineColor?: string;
}

interface TooltipState {
  x: number;
  y: number;
  seriesLabel: string;
  pointLabel: string;
  value: string;
}

const DEFAULT_LINE_COLOR = '#0ea5e9';
// Distinguishable palette for multi-series charts, so lines don't rely on the
// single blue accent used everywhere else in the app.
const SERIES_PALETTE = [
  '#0ea5e9',
  '#f97316',
  '#8b5cf6',
  '#22c55e',
  '#ec4899',
  '#eab308',
  '#14b8a6',
  '#6366f1',
  '#ef4444',
  '#64748b',
];
const CHART_HEIGHT = 280;
const MARGIN = { top: 16, right: 16, bottom: 40, left: 56 };

export default function LineChart<T>({
  data,
  series,
  getId,
  getLabel,
  getValue,
  formatValue = (value) => String(value),
  lineColor = DEFAULT_LINE_COLOR,
}: LineChartProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredSeriesId, setHoveredSeriesId] = useState<string | null>(null);

  const isMultiSeries = series !== undefined;
  // Memoized so hover-only re-renders (tooltip/hoveredSeriesId state changes handled by the
  // drawing effect below) don't produce a new array/object identity on every mousemove — that
  // would re-trigger the effect's full svg teardown-and-rebuild mid-hover.
  const resolvedSeries = useMemo(
    () =>
      (series ?? [{ id: '__single__', label: '', color: lineColor, data: data ?? [] }]).map((s, i) => ({
        ...s,
        color: s.color ?? (isMultiSeries ? SERIES_PALETTE[i % SERIES_PALETTE.length] : lineColor),
      })),
    [series, data, lineColor, isMultiSeries],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const allPoints = resolvedSeries.flatMap((s) => s.data);
    if (!svgRef.current || width === 0 || allPoints.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 10);
    const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    // The backend aligns every series on the same set of points, so the x
    // domain can be taken from their union while preserving first-seen order.
    const xIds: string[] = [];
    const seen = new Set<string>();
    const labelById = new Map<string, string>();
    for (const s of resolvedSeries) {
      for (const p of s.data) {
        const id = String(getId(p));
        if (!seen.has(id)) {
          seen.add(id);
          xIds.push(id);
        }
        labelById.set(id, getLabel(p));
      }
    }

    const x = d3.scalePoint<string>().domain(xIds).range([0, innerWidth]).padding(0.5);
    const maxValue = d3.max(allPoints, getValue) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, maxValue === 0 ? 1 : maxValue])
      .nice()
      .range([innerHeight, 0]);

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat((id) => labelById.get(id) ?? ''))
      .call((sel) => sel.select('.domain').attr('stroke', '#e5e7eb'))
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280')
      .attr('transform', 'rotate(-35)')
      .style('text-anchor', 'end');

    g.selectAll('.tick line').attr('stroke', '#e5e7eb');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((v) => formatValue(Number(v))))
      .call((sel) => sel.select('.domain').remove())
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280');

    const line = d3
      .line<T>()
      .x((d) => x(String(getId(d))) ?? 0)
      .y((d) => y(getValue(d)));

    resolvedSeries.forEach((s) => {
      const isClickable = !!s.onClick;
      const isDimmed = hoveredSeriesId !== null && hoveredSeriesId !== String(s.id);

      const seriesGroup = g.append('g');

      seriesGroup
        .append('path')
        .datum(s.data)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', isDimmed ? 1.5 : 2.5)
        .attr('opacity', isDimmed ? 0.25 : 1)
        .attr('d', line)
        .style('pointer-events', 'none');

      // Wider invisible hit path layered over the visible line so hovering
      // near it (not just exactly on the thin stroke) highlights the series.
      seriesGroup
        .append('path')
        .datum(s.data)
        .attr('fill', 'none')
        .attr('stroke', 'transparent')
        .attr('stroke-width', 16)
        .attr('d', line)
        .style('cursor', isClickable ? 'pointer' : 'default')
        .on('mouseenter', () => setHoveredSeriesId(String(s.id)))
        .on('mouseleave', () => setHoveredSeriesId(null))
        .on('click', () => s.onClick?.());

      seriesGroup
        .selectAll('circle.point')
        .data(s.data)
        .join('circle')
        .attr('class', 'point')
        .attr('cx', (d) => x(String(getId(d))) ?? 0)
        .attr('cy', (d) => y(getValue(d)))
        .attr('r', isDimmed ? 2.5 : 4)
        .attr('fill', s.color)
        .attr('opacity', isDimmed ? 0.25 : 1)
        .style('cursor', isClickable ? 'pointer' : 'default')
        .on('mousemove', (event, d) => {
          const [mx, my] = d3.pointer(event, containerRef.current);
          setTooltip({ x: mx, y: my, seriesLabel: s.label, pointLabel: getLabel(d), value: formatValue(getValue(d)) });
          setHoveredSeriesId(String(s.id));
        })
        .on('mouseleave', () => {
          setTooltip(null);
          setHoveredSeriesId(null);
        })
        .on('click', () => s.onClick?.());
    });
  }, [resolvedSeries, width, formatValue, hoveredSeriesId, getId, getLabel, getValue]);

  return (
    <div>
      <div ref={containerRef} className="relative w-full" style={{ height: CHART_HEIGHT }}>
        <svg ref={svgRef} width="100%" height={CHART_HEIGHT} />
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg bg-gray-800 px-3 py-2 text-xs text-white shadow-md"
            style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}
          >
            {isMultiSeries && <p className="font-semibold">{tooltip.seriesLabel}</p>}
            <p>{tooltip.pointLabel}</p>
            <p>{tooltip.value}</p>
          </div>
        )}
      </div>

      {isMultiSeries && (
        <div className="mt-3 flex flex-wrap gap-2">
          {resolvedSeries.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseEnter={() => setHoveredSeriesId(String(s.id))}
              onMouseLeave={() => setHoveredSeriesId(null)}
              onClick={() => s.onClick?.()}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity ${
                s.onClick ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
              } ${hoveredSeriesId !== null && hoveredSeriesId !== String(s.id) ? 'opacity-40' : 'opacity-100'}`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-gray-700">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
