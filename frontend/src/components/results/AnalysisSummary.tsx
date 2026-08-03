import { Activity, Database, Orbit, ScanSearch } from "lucide-react";

import { Card } from "@/components/card";
import type { AnalysisResult } from "@/types/api";

export function AnalysisSummary({ result }: { result: AnalysisResult }) {
  const items = [
    { label: "Pipeline status", value: result.summary.pipeline_status ?? result.summary.status ?? "Unknown", icon: Activity },
    { label: "Samples analyzed", value: (result.summary.sample_count ?? result.lightcurve.sample_count).toLocaleString(), icon: Database },
    { label: "Candidates", value: String(result.candidates.length), icon: ScanSearch },
    { label: "Transit detected", value: result.transit.detected ? "Yes" : "No", icon: Orbit },
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Analysis summary">
      {items.map((item) => <Card className="p-5" key={item.label}><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p><item.icon className="h-4 w-4 text-sky-300" /></div><p className="mt-4 capitalize text-2xl font-semibold text-white">{item.value}</p></Card>)}
    </section>
  );
}
