"use client";

import { RotateCcw } from "lucide-react";
import { PointerEvent, WheelEvent, useEffect, useRef, useState } from "react";

type InteractiveLineChartProps = {
  x: number[];
  y: number[];
  xLabel: string;
  yLabel: string;
  accent?: string;
  zoom?: boolean;
};

type Tooltip = { left: number; top: number; x: number; y: number };

const PADDING = { left: 58, right: 20, top: 18, bottom: 42 };

export function InteractiveLineChart({ x, y, xLabel, yLabel, accent = "#7dd3fc", zoom = false }: InteractiveLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 700, height: 300 });
  const [domain, setDomain] = useState<[number, number]>([0, 1]);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: Math.max(280, entry.contentRect.width), height: 300 }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || x.length < 2 || y.length < 2) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = size.width * ratio;
    canvas.height = size.height * ratio;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, size.width, size.height);

    const xMinimum = x[0] + (x[x.length - 1] - x[0]) * domain[0];
    const xMaximum = x[0] + (x[x.length - 1] - x[0]) * domain[1];
    const points = x.map((value, index) => ({ x: value, y: y[index] })).filter((point) => point.x >= xMinimum && point.x <= xMaximum && Number.isFinite(point.y));
    if (points.length < 2) return;
    const yValues = points.map((point) => point.y);
    let yMinimum = Math.min(...yValues);
    let yMaximum = Math.max(...yValues);
    const margin = Math.max((yMaximum - yMinimum) * 0.12, Math.abs(yMaximum) * 0.0005, 1e-8);
    yMinimum -= margin;
    yMaximum += margin;
    const plotWidth = size.width - PADDING.left - PADDING.right;
    const plotHeight = size.height - PADDING.top - PADDING.bottom;
    const projectX = (value: number) => PADDING.left + ((value - xMinimum) / (xMaximum - xMinimum || 1)) * plotWidth;
    const projectY = (value: number) => PADDING.top + (1 - (value - yMinimum) / (yMaximum - yMinimum || 1)) * plotHeight;

    context.strokeStyle = "rgba(148,163,184,.12)";
    context.fillStyle = "#64748b";
    context.font = "11px Arial";
    context.lineWidth = 1;
    for (let index = 0; index <= 4; index += 1) {
      const horizontal = PADDING.top + (plotHeight * index) / 4;
      context.beginPath(); context.moveTo(PADDING.left, horizontal); context.lineTo(size.width - PADDING.right, horizontal); context.stroke();
      const label = (yMaximum - ((yMaximum - yMinimum) * index) / 4).toFixed(4);
      context.fillText(label, 6, horizontal + 4);
    }
    context.beginPath();
    points.forEach((point, index) => { const horizontal = projectX(point.x); const vertical = projectY(point.y); if (index === 0) context.moveTo(horizontal, vertical); else context.lineTo(horizontal, vertical); });
    context.strokeStyle = accent;
    context.lineWidth = 1.6;
    context.stroke();
    context.fillStyle = "#94a3b8";
    context.fillText(xMinimum.toFixed(3), PADDING.left, size.height - 20);
    context.fillText(xMaximum.toFixed(3), size.width - PADDING.right - 42, size.height - 20);
    context.fillText(xLabel, size.width / 2 - 20, size.height - 5);
    context.save(); context.translate(12, size.height / 2 + 20); context.rotate(-Math.PI / 2); context.fillText(yLabel, 0, 0); context.restore();
  }, [accent, domain, size, x, xLabel, y, yLabel]);

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (x.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (event.clientX - bounds.left - PADDING.left) / Math.max(1, bounds.width - PADDING.left - PADDING.right)));
    const fraction = domain[0] + position * (domain[1] - domain[0]);
    const index = Math.min(x.length - 1, Math.max(0, Math.round(fraction * (x.length - 1))));
    setTooltip({ left: event.clientX - bounds.left, top: event.clientY - bounds.top, x: x[index], y: y[index] });
  }

  function wheel(event: WheelEvent<HTMLCanvasElement>) {
    if (!zoom) return;
    event.preventDefault();
    const width = domain[1] - domain[0];
    const nextWidth = Math.min(1, Math.max(0.08, width * (event.deltaY > 0 ? 1.25 : 0.8)));
    const bounds = event.currentTarget.getBoundingClientRect();
    const anchor = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const center = domain[0] + anchor * width;
    let start = center - anchor * nextWidth;
    start = Math.max(0, Math.min(1 - nextWidth, start));
    setDomain([start, start + nextWidth]);
  }

  if (x.length < 2 || y.length < 2) return <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">Chart data is unavailable for this analysis.</div>;

  return (
    <div className="relative" ref={containerRef}>
      {zoom && domain[1] - domain[0] < 1 && <button className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300" onClick={() => setDomain([0, 1])} type="button"><RotateCcw className="h-3 w-3" />Reset zoom</button>}
      <canvas aria-label={`${yLabel} plotted against ${xLabel}`} className={zoom ? "cursor-crosshair" : ""} onPointerLeave={() => setTooltip(null)} onPointerMove={move} onWheel={wheel} ref={canvasRef} role="img" />
      {tooltip && <div className="pointer-events-none absolute rounded-md border border-white/10 bg-slate-950/95 px-3 py-2 text-xs shadow-xl" style={{ left: Math.min(tooltip.left + 12, size.width - 140), top: Math.max(8, tooltip.top - 54) }}><p className="text-slate-400">{xLabel}: <span className="text-white">{tooltip.x.toFixed(5)}</span></p><p className="mt-1 text-slate-400">{yLabel}: <span className="text-sky-300">{tooltip.y.toFixed(6)}</span></p></div>}
      {zoom && <p className="mt-2 text-right text-xs text-slate-600">Scroll over chart to zoom</p>}
    </div>
  );
}
