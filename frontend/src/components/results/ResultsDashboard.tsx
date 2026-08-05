"use client";

import { ArrowLeft, CircleCheck, Orbit, Telescope } from "lucide-react";
import Link from "next/link";
import { FoldedCurveChart } from "@/components/charts/FoldedCurveChart";
import { LightCurveChart } from "@/components/charts/LightCurveChart";
import { ReportButton } from "@/components/reports/ReportButton";
import { CandidateCard } from "@/components/results/CandidateCard";
import { ExplanationPanel } from "@/components/results/ExplanationPanel";
import { FeatureImportanceChart } from "@/components/results/FeatureImportanceChart";
import { AnalysisSummary } from "@/components/results/AnalysisSummary";
import type { AnalysisResult } from "@/types/api";

function measurement(value: number | null, unit: string, digits = 3) {
  return value === null ? "Not available" : `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

export function ResultsDashboard({ analysis }: { analysis: AnalysisResult }) {
  const candidate = analysis.candidates[0];
  const overview = [
    { label: "Classification", value: candidate?.classification ?? "No candidate detected" },
    { label: "Model confidence", value: candidate ? `${(candidate.confidence * 100).toFixed(1)}%` : "Not classified" },
    { label: "Orbital period", value: measurement(analysis.transit.period, "days") },
    { label: "Transit SNR", value: measurement(analysis.transit.snr, "", 2) },
  ];
  const parameters = [
    ["Epoch", measurement(analysis.transit.epoch, "days")],
    ["Duration", measurement(analysis.transit.duration, "days")],
    ["Depth", analysis.transit.depth === null ? "Not available" : `${(analysis.transit.depth * 100).toFixed(4)}%`],
    ["Detected", analysis.transit.detected ? "Yes" : "No"],
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-6 border-b border-white/[0.08] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-200" href="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
          <div className="mt-6 flex items-center gap-2 text-sm text-emerald-300"><CircleCheck className="h-4 w-4" /> Analysis completed</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Candidate analysis</h1>
          <p className="mt-3 break-all font-mono text-xs text-slate-500">Analysis ID: {analysis.analysis_id}</p>
        </div>
        <ReportButton analysisId={analysis.analysis_id} />
      </header>
      <section className="mt-8"><AnalysisSummary result={analysis} /></section>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Candidate overview">
        {overview.map((item) => <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5" key={item.label}><p className="text-xs font-medium uppercase tracking-wider text-slate-500">{item.label}</p><p className="mt-3 break-words text-lg font-semibold text-white">{item.value}</p></div>)}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/45">
            <div className="flex flex-col gap-2 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-white">Observed light curve</h2><p className="mt-1 text-sm text-slate-500">Normalized flux measured over observation time.</p></div><span className="text-xs text-slate-500">{analysis.lightcurve.sample_count.toLocaleString()} samples</span></div>
            <div className="p-3 sm:p-5"><LightCurveChart flux={analysis.lightcurve.flux} time={analysis.lightcurve.time} /></div>
          </article>
          <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/45">
            <div className="border-b border-white/[0.08] px-5 py-4"><h2 className="font-semibold text-white">Phase-folded transit</h2><p className="mt-1 text-sm text-slate-500">Measurements aligned by the detected orbital period to reveal the repeated transit profile.</p></div>
            <div className="p-3 sm:p-5"><FoldedCurveChart flux={analysis.transit.flux} phase={analysis.transit.phase} /></div>
          </article>
        </div>
        <aside className="space-y-6">
          {candidate ? <CandidateCard candidate={candidate} /> : <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-7 text-center"><Telescope className="mx-auto h-8 w-8 text-slate-500" /><h2 className="mt-4 font-semibold text-white">No ranked candidate</h2><p className="mt-2 text-sm leading-6 text-slate-400">The pipeline did not identify a signal suitable for ML classification in this light curve.</p></div>}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6"><div className="flex items-center gap-2"><Orbit className="h-4 w-4 text-cyan-200" /><h2 className="font-semibold text-white">Transit parameters</h2></div><dl className="mt-5 divide-y divide-white/[0.07] text-sm">{parameters.map(([label, value]) => <div className="flex items-center justify-between gap-4 py-3" key={label}><dt className="text-slate-500">{label}</dt><dd className="text-right font-mono text-xs text-slate-200">{value}</dd></div>)}</dl></div>
        </aside>
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><ExplanationPanel candidate={candidate} /><FeatureImportanceChart attributions={candidate?.explanation.feature_importance} /></section>
    </main>
  );
}
