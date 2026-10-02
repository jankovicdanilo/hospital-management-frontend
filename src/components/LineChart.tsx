import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface LineChartProps<T> {
  data: T[];
  getId: (d: T) => string | number;
  getLabel: (d: T) => string;
  getValue: (d: T) => number;
  formatValue?: (value: number) => string;
  lineColor?: string;
}

interface TooltipState {
  x: number;
  y: number;
  label: string;
  value: string;
}

const DEFAULT_LINE_COLOR = '#0ea5e9';
const CHART_HEIGHT = 280;
const MARGIN = { top: 16, right: 16, bottom: 40, left: 56 };

export default function LineChart<T>({
  data,
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
    if (!svgRef.current || width === 0 || data.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 10);
    const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    const ids = data.map((d) => String(getId(d)));
    const x = d3.scalePoint<string>().domain(ids).range([0, innerWidth]).padding(0.5);
    const maxValue = d3.max(data, getValue) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, maxValue === 0 ? 1 : maxValue])
      .nice()
      .range([innerHeight, 0]);

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const labelById = new Map(data.map((d) => [String(getId(d)), getLabel(d)]));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((id) => labelById.get(id) ?? ''),
      )
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

    g.append('path').datum(data).attr('fill', 'none').attr('stroke', lineColor).attr('stroke-width', 2).attr('d', line);

    g.selectAll('circle.point')
      .data(data)
      .join('circle')
      .attr('class', 'point')
      .attr('cx', (d) => x(String(getId(d))) ?? 0)
      .attr('cy', (d) => y(getValue(d)))
      .attr('r', 4)
      .attr('fill', lineColor)
      .style('cursor', 'pointer')
      .on('mousemove', (event, d) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setTooltip({ x: mx, y: my, label: getLabel(d), value: formatValue(getValue(d)) });
      })
      .on('mouseleave', () => setTooltip(null));
  }, [data, width, formatValue, lineColor, getId, getLabel, getValue]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: CHART_HEIGHT }}>
      <svg ref={svgRef} width="100%" height={CHART_HEIGHT} />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-gray-800 px-3 py-2 text-xs text-white shadow-md"
          style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}
        >
          <p className="font-semibold">{tooltip.label}</p>
          <p>{tooltip.value}</p>
        </div>
      )}
    </div>
  );
}
