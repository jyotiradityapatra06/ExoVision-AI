import { Activity, Database, Orbit, ScanSearch } from "lucide-react";

import { Card } from "@/components/card";
import type { AnalysisResult } from "@/types/api";

export function AnalysisSummary({ result }: { result: AnalysisResult }) {
  const items = [
    {
      label: "PIPELINE STATUS",
      value: result.summary.pipeline_status ?? result.summary.status ?? "Completed",
      icon: Activity,
      accent: "cyan",
    },
    {
      label: "DATA POINTS ANALYZED",
      value: (result.summary.sample_count ?? result.lightcurve.sample_count).toLocaleString(),
      icon: Database,
      accent: "cyan",
    },
    {
      label: "CANDIDATES RANKED",
      value: String(result.candidates.length),
      icon: ScanSearch,
      accent: "orange",
    },
    {
      label: "TRANSIT SIGNAL DETECTED",
      value: result.transit.detected ? "CONFIRMED YES" : "NO TRANSIT",
      icon: Orbit,
      accent: result.transit.detected ? "emerald" : "orange",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Analysis summary">
      {items.map((item) => (
        <Card key={item.label} className="p-5" hudCorners glow={item.accent === "orange" ? "orange" : "cyan"}>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {item.label}
            </p>
            <item.icon className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-4 font-mono text-2xl font-bold text-white tracking-tight">
            {item.value}
          </p>
        </Card>
      ))}
    </section>
  );
}
