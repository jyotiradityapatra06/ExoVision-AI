"use client";

import { RotateCcw, ZoomIn } from "lucide-react";
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

const PADDING = { left: 62, right: 24, top: 22, bottom: 44 };

export function InteractiveLineChart({
  x,
  y,
  xLabel,
  yLabel,
  accent = "#00f0ff",
  zoom = false,
}: InteractiveLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 700, height: 320 });
  const [domain, setDomain] = useState<[number, number]>([0, 1]);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const pairedLength = Math.min(x.length, y.length);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: Math.max(280, entry.contentRect.width), height: 320 })
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pairedLength < 2) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = size.width * ratio;
    canvas.height = size.height * ratio;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, size.width, size.height);

    const xMinimum = x[0] + (x[pairedLength - 1] - x[0]) * domain[0];
    const xMaximum = x[0] + (x[pairedLength - 1] - x[0]) * domain[1];

    let yMinimum = Infinity;
    let yMaximum = -Infinity;
    let visibleCount = 0;

    for (let i = 0; i < pairedLength; i += 1) {
      const px = x[i];
      const py = y[i];
      if (px >= xMinimum && px <= xMaximum && Number.isFinite(py)) {
        if (py < yMinimum) yMinimum = py;
        if (py > yMaximum) yMaximum = py;
        visibleCount += 1;
      }
    }

    if (visibleCount < 2 || !Number.isFinite(yMinimum) || !Number.isFinite(yMaximum)) return;

    const margin = Math.max((yMaximum - yMinimum) * 0.14, Math.abs(yMaximum) * 0.0005, 1e-8);
    yMinimum -= margin;
    yMaximum += margin;

    const plotWidth = size.width - PADDING.left - PADDING.right;
    const plotHeight = size.height - PADDING.top - PADDING.bottom;
    const projectX = (value: number) =>
      PADDING.left + ((value - xMinimum) / (xMaximum - xMinimum || 1)) * plotWidth;
    const projectY = (value: number) =>
      PADDING.top + (1 - (value - yMinimum) / (yMaximum - yMinimum || 1)) * plotHeight;

    // Draw Technical Outer Frame
    context.strokeStyle = "rgba(255, 255, 255, 0.08)";
    context.lineWidth = 1;
    context.strokeRect(PADDING.left, PADDING.top, plotWidth, plotHeight);

    // Draw Horizontal Grid Ticks
    context.fillStyle = "#64748b";
    context.font = "10px monospace";
    for (let index = 0; index <= 4; index += 1) {
      const horizontal = PADDING.top + (plotHeight * index) / 4;
      context.beginPath();
      context.moveTo(PADDING.left, horizontal);
      context.lineTo(size.width - PADDING.right, horizontal);
      context.strokeStyle = "rgba(255, 255, 255, 0.04)";
      context.stroke();
      const label = (yMaximum - ((yMaximum - yMinimum) * index) / 4).toFixed(4);
      context.fillText(label, 6, horizontal + 3);
    }

    // Draw Plot Line - crisp, restrained scientific stroke
    context.save();
    context.shadowBlur = 0;
    context.strokeStyle = accent;
    context.lineWidth = 1.5;
    context.beginPath();
    let first = true;
    for (let i = 0; i < pairedLength; i += 1) {
      const px = x[i];
      const py = y[i];
      if (px >= xMinimum && px <= xMaximum && Number.isFinite(py)) {
        const horizontal = projectX(px);
        const vertical = projectY(py);
        if (first) {
          context.moveTo(horizontal, vertical);
          first = false;
        } else {
          context.lineTo(horizontal, vertical);
        }
      }
    }
    context.stroke();
    context.restore();

    // Axis Labels
    context.fillStyle = "#94a3b8";
    context.fillText(xMinimum.toFixed(2), PADDING.left, size.height - 18);
    context.fillText(xMaximum.toFixed(2), size.width - PADDING.right - 44, size.height - 18);
    context.fillText(xLabel, size.width / 2 - 20, size.height - 5);

    context.save();
    context.translate(14, size.height / 2 + 20);
    context.rotate(-Math.PI / 2);
    context.fillText(yLabel, 0, 0);
    context.restore();
  }, [accent, domain, pairedLength, size, x, xLabel, y, yLabel]);

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (pairedLength === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = Math.max(
      0,
      Math.min(
        1,
        (event.clientX - bounds.left - PADDING.left) /
          Math.max(1, bounds.width - PADDING.left - PADDING.right)
      )
    );
    const fraction = domain[0] + position * (domain[1] - domain[0]);
    const index = Math.min(pairedLength - 1, Math.max(0, Math.round(fraction * (pairedLength - 1))));
    setTooltip({
      left: event.clientX - bounds.left,
      top: event.clientY - bounds.top,
      x: x[index],
      y: y[index],
    });
  }

  function wheel(event: WheelEvent<HTMLCanvasElement>) {
    if (!zoom) return;
    event.preventDefault();
    const width = domain[1] - domain[0];
    const nextWidth = Math.min(1, Math.max(0.06, width * (event.deltaY > 0 ? 1.25 : 0.8)));
    const bounds = event.currentTarget.getBoundingClientRect();
    const anchor = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const center = domain[0] + anchor * width;
    let start = center - anchor * nextWidth;
    start = Math.max(0, Math.min(1 - nextWidth, start));
    setDomain([start, start + nextWidth]);
  }

  if (pairedLength < 2) {
    return (
      <div className="flex h-[320px] items-center justify-center font-mono text-xs text-slate-500">
        Photometric telemetry data unavailable for plotting.
      </div>
    );
  }

  return (
    <div className="relative font-mono" ref={containerRef}>
      {zoom && domain[1] - domain[0] < 1 && (
        <button
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5 border border-white/15 bg-[#060a0f]/90 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:border-cyan-300/40 hover:text-white transition"
          onClick={() => setDomain([0, 1])}
          type="button"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Zoom</span>
        </button>
      )}

      <canvas
        aria-label={`${yLabel} plotted against ${xLabel}`}
        className={zoom ? "cursor-crosshair" : ""}
        onPointerLeave={() => setTooltip(null)}
        onPointerMove={move}
        onWheel={wheel}
        ref={canvasRef}
        role="img"
      />

      {tooltip && (
        <div
          className="pointer-events-none absolute border border-white/10 bg-[#060a0f]/95 px-3 py-2 text-xs font-mono shadow-xl"
          style={{
            left: Math.min(tooltip.left + 12, size.width - 160),
            top: Math.max(10, tooltip.top - 58),
          }}
        >
          <p className="text-slate-400 text-[11px]">
            {xLabel}: <span className="text-white font-semibold">{tooltip.x.toFixed(4)}</span>
          </p>
          <p className="mt-0.5 text-slate-400 text-[11px]">
            {yLabel}: <span className="text-cyan-300 font-semibold">{tooltip.y.toFixed(6)}</span>
          </p>
        </div>
      )}

      {zoom && (
        <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1 text-slate-400">
            <ZoomIn className="h-3 w-3 text-cyan-400/70" /> Scroll on canvas to zoom · Drag crosshair to inspect
          </span>
          <span>Domain: {(domain[0] * 100).toFixed(0)}%–{(domain[1] * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
