import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface BarChartProps<T> {
  data: T[];
  getId: (d: T) => string | number;
  getLabel: (d: T) => string;
  getValue: (d: T) => number;
  formatValue?: (value: number) => string;
  getTooltipDetail?: (d: T) => string | null;
  barColor?: string;
  onBarClick?: (d: T) => void;
}

interface TooltipState {
  x: number;
  y: number;
  label: string;
  value: string;
  detail: string | null;
}

const DEFAULT_BAR_COLOR = '#2563eb';
const ROW_HEIGHT = 36;
const MARGIN = { top: 8, right: 16, bottom: 28, left: 140 };

function truncateToWidth(context: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (context.measureText(`${text.slice(0, mid)}…`).width <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low === 0 ? '…' : `${text.slice(0, low)}…`;
}

export default function BarChart<T>({
  data,
  getId,
  getLabel,
  getValue,
  formatValue = (value) => String(value),
  getTooltipDetail,
  barColor = DEFAULT_BAR_COLOR,
  onBarClick,
}: BarChartProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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

  const chartHeight = data.length * ROW_HEIGHT + MARGIN.top + MARGIN.bottom;

  useEffect(() => {
    if (!svgRef.current || width === 0 || data.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 10);
    const rowsHeight = data.length * ROW_HEIGHT;
    const maxValue = d3.max(data, getValue) ?? 0;

    const x = d3
      .scaleLinear()
      .domain([0, maxValue === 0 ? 1 : maxValue])
      .range([0, innerWidth])
      .nice();
    const y = d3
      .scaleBand<string>()
      .domain(data.map((d) => String(getId(d))))
      .range([0, rowsHeight])
      .padding(0.3);

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = '12px sans-serif';
    }

    g.append('g')
      .attr('transform', `translate(0,${rowsHeight})`)
      .call(d3.axisBottom(x).ticks(4).tickFormat((v) => formatValue(Number(v))))
      .call((sel) => sel.select('.domain').attr('stroke', '#e5e7eb'))
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280');

    g.selectAll('.tick line').attr('stroke', '#e5e7eb');

    const isHovered = (d: T) => onBarClick !== undefined && hoveredId === String(getId(d));

    g.selectAll('text.bar-label')
      .data(data)
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', -10)
      .attr('y', (d) => (y(String(getId(d))) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.32em')
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .attr('fill', (d) => (isHovered(d) ? barColor : '#374151'))
      .attr('font-weight', (d) => (isHovered(d) ? 600 : 400))
      .text((d) => (context ? truncateToWidth(context, getLabel(d), MARGIN.left - 16) : getLabel(d)));

    g.selectAll('rect.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', (d) => y(String(getId(d))) ?? 0)
      .attr('width', (d) => x(getValue(d)))
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', (d) => (isHovered(d) ? (d3.color(barColor)?.darker(0.4).toString() ?? barColor) : barColor));

    // Full-width transparent hit target per row so hovering anywhere in the
    // row (including short/zero-length bars and the label) shows the tooltip.
    g.selectAll('rect.bar-hit')
      .data(data)
      .join('rect')
      .attr('class', 'bar-hit')
      .attr('x', -MARGIN.left)
      .attr('y', (d) => y(String(getId(d))) ?? 0)
      .attr('width', innerWidth + MARGIN.left)
      .attr('height', y.bandwidth())
      .attr('fill', 'transparent')
      .style('cursor', onBarClick ? 'pointer' : 'default')
      .on('mousemove', (event, d) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setTooltip({
          x: mx,
          y: my,
          label: getLabel(d),
          value: formatValue(getValue(d)),
          detail: getTooltipDetail ? getTooltipDetail(d) : null,
        });
        setHoveredId(String(getId(d)));
      })
      .on('mouseleave', () => {
        setTooltip(null);
        setHoveredId(null);
      })
      .on('click', (_event, d) => onBarClick?.(d));
  }, [data, width, formatValue, getTooltipDetail, barColor, onBarClick, hoveredId, getId, getLabel, getValue]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: chartHeight }}>
      <svg ref={svgRef} width="100%" height={chartHeight} />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-lg bg-gray-800 px-3 py-2 text-xs text-white shadow-md"
          style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}
        >
          <p className="font-semibold">{tooltip.label}</p>
          <p>{tooltip.value}</p>
          {tooltip.detail && <p className="text-gray-300">{tooltip.detail}</p>}
        </div>
      )}
    </div>
  );
}
