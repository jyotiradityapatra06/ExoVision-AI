import { InteractiveLineChart } from "@/components/charts/InteractiveLineChart";

export function LightCurveChart({ time, flux }: { time: number[]; flux: number[] }) {
  return (
    <InteractiveLineChart
      accent="#80d7e4"
      x={time}
      xLabel="Time (days)"
      y={flux}
      yLabel="Relative Flux"
      zoom
    />
  );
}
