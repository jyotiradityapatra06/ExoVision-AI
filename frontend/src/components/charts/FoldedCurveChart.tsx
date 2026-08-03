import { InteractiveLineChart } from "@/components/charts/InteractiveLineChart";

export function FoldedCurveChart({ phase, flux }: { phase: number[]; flux: number[] }) {
  return <InteractiveLineChart accent="#5eead4" x={phase} y={flux} xLabel="Phase" yLabel="Flux" />;
}
