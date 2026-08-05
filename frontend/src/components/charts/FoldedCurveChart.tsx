import { InteractiveLineChart } from "@/components/charts/InteractiveLineChart";

export function FoldedCurveChart({ phase, flux }: { phase: number[]; flux: number[] }) {
  return <InteractiveLineChart accent="#ff6b00" x={phase} y={flux} xLabel="Orbital Phase" yLabel="Normalized Flux" zoom />;
}
