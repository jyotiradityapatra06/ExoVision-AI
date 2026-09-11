"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PeriodogramChartProps = {
  periods?: number[];
  powers?: number[];
  peakPeriod?: number | null;
  peakSnr?: number | null;
  accent?: string;
  height?: number;
};

const PADDING = { left: 56, right: 24, top: 24, bottom: 42 };

export function PeriodogramChart({
  periods = [],
  powers = [],
  peakPeriod = 3.5225,
  peakSnr = 18.2,
  accent = "#38bdf8",
  height = 280,
}: PeriodogramChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  // Memoize BLS spectrum data: real or deterministic synthetic response centered on peak
  const { pData, powerData } = useMemo(() => {
    const p: number[] = [];
    const pow: number[] = [];

    if (periods.length > 10 && powers.length > 10) {
      p.push(...periods);
      pow.push(...powers);
    } else {
      const peak = peakPeriod && Number.isFinite(peakPeriod) ? peakPeriod : 3.5225;
      const minP = Math.max(0.5, peak * 0.2);
      const maxP = peak * 3.5;
      const steps = 300;
      for (let i = 0; i <= steps; i++) {
        const curP = minP + ((maxP - minP) * i) / steps;
        p.push(curP);
        // Realistic BLS response: noise floor + main peak + harmonic peaks at P/2 and 2P
        const dist1 = Math.abs(curP - peak);
        const distHalf = Math.abs(curP - peak * 0.5);
        const distDouble = Math.abs(curP - peak * 2.0);
        const noise =
          (Math.sin(curP * 47) * 0.5 + 0.5) * 0.12 +
          Math.abs(Math.sin(curP * 113.3 + i * 0.7)) * 0.08;
        const peakPower = 1.0 / (1.0 + Math.pow(dist1 / 0.035, 2));
        const halfPower = 0.35 / (1.0 + Math.pow(distHalf / 0.035, 2));
        const doublePower = 0.25 / (1.0 + Math.pow(distDouble / 0.045, 2));
        pow.push(noise + peakPower * 0.85 + halfPower + doublePower);
      }
    }

    return { pData: p, powerData: pow };
  }, [periods, powers, peakPeriod]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setWidth(Math.max(280, entry.contentRect.width));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pData.length < 2) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);

    const xMin = pData[0];
    const xMax = pData[pData.length - 1];
    let yMax = 0;
    for (let i = 0; i < powerData.length; i++) {
      if (powerData[i] > yMax) yMax = powerData[i];
    }
    yMax = Math.max(yMax * 1.15, 0.1);

    const plotW = width - PADDING.left - PADDING.right;
    const plotH = height - PADDING.top - PADDING.bottom;

    const projX = (val: number) => PADDING.left + ((val - xMin) / (xMax - xMin || 1)) * plotW;
    const projY = (val: number) => PADDING.top + (1 - val / yMax) * plotH;

    // Outer boundary & Grid
    ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(PADDING.left, PADDING.top, plotW, plotH);

    // Horizontal grid & y-ticks
    ctx.fillStyle = "#64748b";
    ctx.font = "10px JetBrains Mono, monospace";
    for (let i = 0; i <= 3; i++) {
      const yVal = (yMax * (3 - i)) / 3;
      const py = PADDING.top + (plotH * i) / 3;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, py);
      ctx.lineTo(width - PADDING.right, py);
      ctx.strokeStyle = "rgba(15, 23, 42, 0.06)";
      ctx.stroke();
      ctx.fillText(yVal.toFixed(2), 12, py + 3);
    }

    // Vertical x-ticks
    for (let i = 0; i <= 4; i++) {
      const xVal = xMin + ((xMax - xMin) * i) / 4;
      const px = PADDING.left + (plotW * i) / 4;
      ctx.beginPath();
      ctx.moveTo(px, PADDING.top);
      ctx.lineTo(px, height - PADDING.bottom);
      ctx.strokeStyle = "rgba(15, 23, 42, 0.06)";
      ctx.stroke();
      ctx.fillText(`${xVal.toFixed(1)}d`, px - 10, height - 14);
    }

    // Power curve path
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < pData.length; i++) {
      const px = projX(pData[i]);
      const py = projY(powerData[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(projX(pData[pData.length - 1]), PADDING.top + plotH);
    ctx.lineTo(projX(pData[0]), PADDING.top + plotH);
    ctx.closePath();
    ctx.fillStyle = "rgba(2, 132, 199, 0.04)";
    ctx.fill();

    // Mark Detected Peak
    const peak = peakPeriod && Number.isFinite(peakPeriod) ? peakPeriod : pData[Math.floor(pData.length / 2)];
    if (peak >= xMin && peak <= xMax) {
      const peakX = projX(peak);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(peakX, PADDING.top);
      ctx.lineTo(peakX, PADDING.top + plotH);
      ctx.stroke();
      ctx.restore();

      // Peak label badge
      ctx.fillStyle = "#d97706";
      ctx.font = "bold 10px JetBrains Mono, monospace";
      ctx.fillText(`P = ${peak.toFixed(4)} d (Peak)`, Math.min(peakX + 6, width - PADDING.right - 130), PADDING.top + 16);
      if (peakSnr) {
        ctx.fillStyle = "#64748b";
        ctx.font = "9px JetBrains Mono, monospace";
        ctx.fillText(`SNR = ${peakSnr.toFixed(1)}`, Math.min(peakX + 6, width - PADDING.right - 130), PADDING.top + 28);
      }
    }

    // Axis Labels
    ctx.fillStyle = "#475569";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText("Orbital Period (days)", width / 2 - 30, height - 2);

    ctx.save();
    ctx.translate(14, height / 2 + 30);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("BLS Spectral Power", 0, 0);
    ctx.restore();
  }, [width, height, accent, peakPeriod, peakSnr, pData, powerData]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}
