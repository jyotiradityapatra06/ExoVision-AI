import { InteractiveLineChart } from "@/components/charts/InteractiveLineChart";

export function FoldedCurveChart({ phase, flux }: { phase: number[]; flux: number[] }) {
  return (
    <InteractiveLineChart
      accent="#e7bb82"
      x={phase}
      xLabel="Orbital Phase (-0.5 to +0.5)"
      y={flux}
      yLabel="Normalized Flux"
      zoom
    />
  );
}
