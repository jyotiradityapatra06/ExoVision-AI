import { InteractiveLineChart } from "@/components/charts/InteractiveLineChart";

export function LightCurveChart({ time, flux }: { time: number[]; flux: number[] }) {
  return <InteractiveLineChart x={time} y={flux} xLabel="Time" yLabel="Flux" zoom />;
}
