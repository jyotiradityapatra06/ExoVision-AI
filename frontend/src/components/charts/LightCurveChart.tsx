import { InteractiveLineChart } from "@/components/charts/InteractiveLineChart";

export function LightCurveChart({ time, flux }: { time: number[]; flux: number[] }) {
  return (
    <InteractiveLineChart
      accent="#0284c7"
      x={time}
      xLabel="Observation Time (days)"
      y={flux}
      yLabel="Relative Stellar Flux"
      zoom
    />
  );
}
