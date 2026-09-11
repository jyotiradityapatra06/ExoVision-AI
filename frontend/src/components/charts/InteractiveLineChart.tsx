"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";

type InteractiveLineChartProps = {
  x: number[];
  y: number[];
  xLabel: string;
  yLabel: string;
  accent?: string;
  renderMode?: "line" | "scatter" | "both";
  modelX?: number[];
  modelY?: number[];
  modelAccent?: string;
  zoom?: boolean;
};

type Tooltip = { left: number; top: number; x: number; y: number };

const PADDING = { left: 62, right: 24, top: 22, bottom: 44 };

// Largest-Triangle-Three-Buckets (LTTB) downsampling algorithm for high-performance astronomical scatter rendering
function downsampleLTTB(x: number[], y: number[], threshold: number): [number[], number[]] {
  const dataLength = Math.min(x.length, y.length);
  if (threshold >= dataLength || threshold <= 2) return [x, y];

  const sampledX: number[] = new Array(threshold);
  const sampledY: number[] = new Array(threshold);
  let sampledIndex = 0;

  const every = (dataLength - 2) / (threshold - 2);
  let a = 0;
  sampledX[sampledIndex] = x[a];
  sampledY[sampledIndex] = y[a];
  sampledIndex++;

  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0;
    let avgY = 0;
    const avgRangeStart = Math.floor((i + 1) * every) + 1;
    let avgRangeEnd = Math.floor((i + 2) * every) + 1;
    avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += x[j];
      avgY += y[j];
    }
    avgX /= avgRangeLength || 1;
    avgY /= avgRangeLength || 1;

    let rangeOffs = Math.floor(i * every) + 1;
    const rangeTo = Math.floor((i + 1) * every) + 1;
    const pointAX = x[a];
    const pointAY = y[a];

    let maxArea = -1;
    let maxAreaIndex = rangeOffs;

    for (; rangeOffs < rangeTo; rangeOffs++) {
      const area = Math.abs(
        (pointAX - avgX) * (y[rangeOffs] - pointAY) -
          (pointAX - x[rangeOffs]) * (avgY - pointAY)
      ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = rangeOffs;
      }
    }

    sampledX[sampledIndex] = x[maxAreaIndex];
    sampledY[sampledIndex] = y[maxAreaIndex];
    sampledIndex++;
    a = maxAreaIndex;
  }

  sampledX[sampledIndex] = x[dataLength - 1];
  sampledY[sampledIndex] = y[dataLength - 1];

  return [sampledX, sampledY];
}

export function InteractiveLineChart({
  x,
  y,
  xLabel,
  yLabel,
  accent = "#38bdf8",
  renderMode = "both",
  modelX,
  modelY,
  modelAccent = "#38bdf8",
  zoom = false,
}: InteractiveLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 700, height: 320 });
  const [domain, setDomain] = useState<[number, number]>([0, 1]);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const [filteredX, filteredY] = useMemo(() => {
    if (x.length > 2500) {
      return downsampleLTTB(x, y, 2500);
    }
    return [x, y];
  }, [x, y]);

  const pairedLength = Math.min(filteredX.length, filteredY.length);

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

    const xMinimum = filteredX[0] + (filteredX[pairedLength - 1] - filteredX[0]) * domain[0];
    const xMaximum = filteredX[0] + (filteredX[pairedLength - 1] - filteredX[0]) * domain[1];

    let yMinimum = Infinity;
    let yMaximum = -Infinity;
    let visibleCount = 0;

    for (let i = 0; i < pairedLength; i += 1) {
      const px = filteredX[i];
      const py = filteredY[i];
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

    // Outer Frame
    context.strokeStyle = "rgba(15, 23, 42, 0.12)";
    context.lineWidth = 1;
    context.strokeRect(PADDING.left, PADDING.top, plotWidth, plotHeight);

    // Horizontal Grid Ticks
    context.fillStyle = "#64748b";
    context.font = "10px JetBrains Mono, monospace";
    for (let index = 0; index <= 4; index += 1) {
      const horizontal = PADDING.top + (plotHeight * index) / 4;
      context.beginPath();
      context.moveTo(PADDING.left, horizontal);
      context.lineTo(size.width - PADDING.right, horizontal);
      context.strokeStyle = "rgba(15, 23, 42, 0.06)";
      context.stroke();
      const label = (yMaximum - ((yMaximum - yMinimum) * index) / 4).toFixed(4);
      context.fillText(label, 8, horizontal + 3);
    }

    // Vertical Grid Ticks
    for (let index = 0; index <= 4; index += 1) {
      const xVal = xMinimum + ((xMaximum - xMinimum) * index) / 4;
      const vertical = PADDING.left + (plotWidth * index) / 4;
      context.beginPath();
      context.moveTo(vertical, PADDING.top);
      context.lineTo(vertical, size.height - PADDING.bottom);
      context.strokeStyle = "rgba(15, 23, 42, 0.06)";
      context.stroke();
      context.fillText(xVal.toFixed(2), vertical - 14, size.height - 14);
    }

    // Render Data Points (Scatter Dots)
    if (renderMode === "scatter" || renderMode === "both") {
      context.fillStyle = accent;
      for (let i = 0; i < pairedLength; i += 1) {
        const px = filteredX[i];
        const py = filteredY[i];
        if (px >= xMinimum && px <= xMaximum && Number.isFinite(py)) {
          const horizontal = projectX(px);
          const vertical = projectY(py);
          context.beginPath();
          context.arc(horizontal, vertical, 1.4, 0, Math.PI * 2);
          context.fill();
        }
      }
    }

    // Render Line Connection (if line or both)
    if (renderMode === "line" || (renderMode === "both" && pairedLength < 300)) {
      context.strokeStyle = accent;
      context.lineWidth = 1.2;
      context.beginPath();
      let first = true;
      for (let i = 0; i < pairedLength; i += 1) {
        const px = filteredX[i];
        const py = filteredY[i];
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
    }

    // Render Theoretical Transit Model Curve (Overlay)
    if (modelX && modelY && modelX.length > 2) {
      context.save();
      context.strokeStyle = modelAccent;
      context.lineWidth = 2.0;
      context.beginPath();
      let mFirst = true;
      const mLen = Math.min(modelX.length, modelY.length);
      for (let i = 0; i < mLen; i++) {
        const mx = modelX[i];
        const my = modelY[i];
        if (mx >= xMinimum && mx <= xMaximum && Number.isFinite(my)) {
          const h = projectX(mx);
          const v = projectY(my);
          if (mFirst) {
            context.moveTo(h, v);
            mFirst = false;
          } else {
            context.lineTo(h, v);
          }
        }
      }
      context.stroke();
      context.restore();
    }

    // Axis Labels
    context.fillStyle = "#475569";
    context.font = "11px Inter, sans-serif";
    context.fillText(xLabel, size.width / 2 - 30, size.height - 2);

    context.save();
    context.translate(14, size.height / 2 + 30);
    context.rotate(-Math.PI / 2);
    context.fillText(yLabel, 0, 0);
    context.restore();
  }, [domain, filteredX, filteredY, pairedLength, size, accent, renderMode, modelX, modelY, modelAccent, xLabel, yLabel]);

  function handlePointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const plotWidth = size.width - PADDING.left - PADDING.right;
    const rawLeft = event.clientX - bounds.left;
    if (rawLeft < PADDING.left || rawLeft > size.width - PADDING.right) {
      setTooltip(null);
      return;
    }

    const xMin = filteredX[0] + (filteredX[pairedLength - 1] - filteredX[0]) * domain[0];
    const xMax = filteredX[0] + (filteredX[pairedLength - 1] - filteredX[0]) * domain[1];
    const ratio = (rawLeft - PADDING.left) / (plotWidth || 1);
    const targetX = xMin + (xMax - xMin) * ratio;

    let closestIndex = 0;
    let smallestDelta = Infinity;
    for (let index = 0; index < pairedLength; index += 1) {
      const delta = Math.abs(filteredX[index] - targetX);
      if (delta < smallestDelta) {
        smallestDelta = delta;
        closestIndex = index;
      }
    }

    setTooltip({
      left: rawLeft,
      top: Math.max(12, Math.min(size.height - 70, event.clientY - bounds.top - 50)),
      x: filteredX[closestIndex],
      y: filteredY[closestIndex],
    });
  }

  function handleZoom(factor: number) {
    setDomain(([start, end]) => {
      const center = (start + end) / 2;
      const span = (end - start) * factor;
      const half = Math.max(0.02, span / 2);
      return [Math.max(0, center - half), Math.min(1, center + half)];
    });
  }

  function handleReset() {
    setDomain([0, 1]);
    setTooltip(null);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none bg-white rounded"
      onPointerMove={handlePointer}
      onPointerLeave={() => setTooltip(null)}
    >
      {zoom && (
        <div className="absolute top-2 right-4 z-10 flex items-center gap-1 rounded border border-[#090D0F]/15 bg-white p-0.5 shadow-sm">
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-black/5 hover:text-[#090D0F] transition"
            title="Zoom in"
            onClick={() => handleZoom(0.7)}
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-black/5 hover:text-[#090D0F] transition"
            title="Zoom out"
            onClick={() => handleZoom(1.3)}
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-black/5 hover:text-[#090D0F] transition"
            title="Reset view"
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="block w-full" />

      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 rounded border border-[#090D0F]/15 bg-white px-3 py-2 font-mono text-[11px] text-[#090D0F] shadow-lg"
          style={{ left: `${tooltip.left + 12}px`, top: `${tooltip.top}px` }}
        >
          <div className="text-zinc-500">Time: <span className="font-semibold text-[#090D0F]">{tooltip.x.toFixed(4)} d</span></div>
          <div className="text-zinc-500">Flux: <span className="font-semibold text-signal">{tooltip.y.toFixed(5)}</span></div>
        </div>
      )}
    </div>
  );
}
