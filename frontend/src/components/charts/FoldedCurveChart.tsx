"use client";

import { useMemo } from "react";
import { InteractiveLineChart } from "@/components/charts/InteractiveLineChart";

type FoldedCurveChartProps = {
  phase: number[];
  flux: number[];
  depth?: number | null;
  duration?: number | null;
  period?: number | null;
};

export function FoldedCurveChart({
  phase,
  flux,
  depth,
  duration,
  period,
}: FoldedCurveChartProps) {
  // Generate smooth theoretical limb-darkened transit model overlay curve
  const { modelX, modelY } = useMemo(() => {
    if (
      !depth ||
      !duration ||
      !period ||
      !Number.isFinite(depth) ||
      !Number.isFinite(duration) ||
      !Number.isFinite(period) ||
      period <= 0 ||
      depth <= 0
    ) {
      return { modelX: undefined, modelY: undefined };
    }

    const halfPhaseDuration = Math.min(0.25, (duration / period) * 0.5);
    const ingressWidth = Math.max(0.002, halfPhaseDuration * 0.22);
    const mX: number[] = [];
    const mY: number[] = [];
    const steps = 300;

    for (let i = 0; i <= steps; i++) {
      const p = -0.5 + i / steps;
      const absP = Math.abs(p);
      let transitFactor = 0;

      if (absP < Math.max(0, halfPhaseDuration - ingressWidth)) {
        // Full in-transit bottom with subtle limb darkening curvature
        const limbCurvature = Math.cos((absP / Math.max(0.001, halfPhaseDuration - ingressWidth)) * (Math.PI * 0.25));
        transitFactor = 0.96 + 0.04 * limbCurvature;
      } else if (absP <= halfPhaseDuration + ingressWidth) {
        // Smooth cosine transition across ingress/egress
        const progress = (absP - (halfPhaseDuration - ingressWidth)) / (2 * ingressWidth);
        const smoothStep = 0.5 * (1 + Math.cos(progress * Math.PI));
        transitFactor = smoothStep;
      } else {
        // Out of transit
        transitFactor = 0;
      }

      mX.push(p);
      mY.push(1.0 - depth * transitFactor);
    }

    return { modelX: mX, modelY: mY };
  }, [depth, duration, period]);

  return (
    <InteractiveLineChart
      accent="#38bdf8"
      renderMode="scatter"
      modelX={modelX}
      modelY={modelY}
      modelAccent="#f59e0b"
      x={phase}
      xLabel="Orbital Phase (-0.5 to +0.5)"
      y={flux}
      yLabel="Normalized Flux"
      zoom
    />
  );
}
