"use client";

import { Activity, ArrowLeft, BadgeCheck, BrainCircuit, CircleCheck, Database, FileText, Orbit, ScanSearch, Telescope } from "lucide-react";
import Link from "next/link";

import { FoldedCurveChart } from "@/components/charts/FoldedCurveChart";
import { LightCurveChart } from "@/components/charts/LightCurveChart";
import { ReportButton } from "@/components/reports/ReportButton";
import { AnalysisSummary } from "@/components/results/AnalysisSummary";
import { ExplanationPanel } from "@/components/results/ExplanationPanel";
import { FeatureImportanceChart } from "@/components/results/FeatureImportanceChart";
import type { AnalysisResult } from "@/types/api";

function measurement(value: number | null, unit: string, digits = 3) {
  return value === null ? "Not available" : `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

export function ResultsDashboard({ analysis }: { analysis: AnalysisResult }) {
  const candidate = analysis.candidates[0];
  const confidence = candidate ? `${(candidate.confidence * 100).toFixed(1)}%` : "—";
  const scientificMetrics = [
    { label: "Transit depth", value: analysis.transit.depth === null ? "Not available" : `${(analysis.transit.depth * 100).toFixed(4)}%`, icon: ScanSearch, tone: "text-cyan-200" },
    { label: "Orbital period", value: measurement(analysis.transit.period, "days"), icon: Orbit, tone: "text-violet-200" },
    { label: "Signal strength", value: measurement(analysis.transit.snr, "SNR", 2), icon: Activity, tone: "text-emerald-200" },
  ];
  const parameters = [
    ["Epoch", measurement(analysis.transit.epoch, "days")],
    ["Duration", measurement(analysis.transit.duration, "days")],
    ["Depth", scientificMetrics[0].value],
    ["Detection", analysis.transit.detected ? "Confirmed" : "Not detected"],
  ];

  return (
    <main className="app-workspace max-w-[1480px]">
      <Link className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-cyan-200" href="/dashboard"><ArrowLeft className="h-4 w-4" /> Research Command Center</Link>

      <header className="mission-panel data-grid relative mt-5 overflow-hidden p-6 sm:p-8 lg:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-44 h-[560px] w-[560px] rounded-full border border-cyan-300/[0.07]"><span className="absolute inset-16 rounded-full border border-dashed border-cyan-300/[0.08]" /><span className="absolute inset-36 rounded-full border border-cyan-300/[0.08]" /></div>
        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div><div className="flex items-center gap-2 text-xs font-medium text-emerald-300"><CircleCheck className="h-4 w-4" /> Analysis sequence complete</div><p className="workspace-kicker mt-6">Peer-review workspace / candidate 01</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">{candidate ? "Potential Exoplanet Candidate" : "Stellar Observation Analysis"}</h1><p className="mt-4 break-all font-mono text-[10px] uppercase tracking-[0.13em] text-slate-600">Analysis record / {analysis.analysis_id}</p></div>
          <div className="rounded-2xl border border-cyan-300/15 bg-[#040a16]/75 p-5 backdrop-blur-xl"><div className="flex items-start justify-between"><div><p className="telemetry-label">AI confidence</p><p className="mt-2 font-mono text-5xl font-semibold tracking-tight text-white">{confidence}</p></div><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08]"><BadgeCheck className="h-5 w-5 text-cyan-200" /></span></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-200 shadow-[0_0_12px_rgba(103,232,249,.6)]" style={{ width: `${candidate ? candidate.confidence * 100 : 0}%` }} /></div><div className="mt-5 border-t border-white/[0.07] pt-4"><p className="telemetry-label">Classification</p><p className="mt-2 text-lg font-semibold text-cyan-100">{candidate?.classification ?? "No candidate classified"}</p></div></div>
        </div>
      </header>

      <section className="mt-6"><AnalysisSummary result={analysis} /></section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Scientific signal measurements">{scientificMetrics.map((metric) => <article className="telemetry-card" key={metric.label}><div className="flex items-center justify-between"><p className="telemetry-label">{metric.label}</p><metric.icon className={`h-4 w-4 ${metric.tone}`} /></div><p className="mt-4 font-mono text-xl font-semibold text-white">{metric.value}</p><div className="mt-4 h-px bg-gradient-to-r from-cyan-300/25 to-transparent" /></article>)}</section>

      <section className="mt-8" aria-labelledby="observation-visualizations">
        <div className="mb-4"><p className="telemetry-label">Figure series 01–02</p><h2 className="mt-1 text-xl font-semibold text-white" id="observation-visualizations">Observation visualizations</h2><p className="mt-2 text-sm text-slate-500">Interactive photometric evidence supporting the candidate assessment.</p></div>
        <div className="grid gap-6 xl:grid-cols-2">
          <article className="mission-panel"><div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="telemetry-label">Figure 01 / source photometry</p><h3 className="mt-1 font-semibold text-white">Observed light curve</h3><p className="mt-1 text-xs text-slate-500">Normalized flux across observation time.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-black/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500"><Database className="h-3 w-3" /> {analysis.lightcurve.sample_count.toLocaleString()} samples</span></div><div className="p-3 sm:p-5"><LightCurveChart flux={analysis.lightcurve.flux} time={analysis.lightcurve.time} /></div><div className="grid grid-cols-3 border-t border-white/[0.06]">{scientificMetrics.map((metric) => <div className="border-r border-white/[0.06] px-4 py-3 last:border-r-0" key={metric.label}><p className="telemetry-label">{metric.label}</p><p className="mt-1 truncate font-mono text-[10px] text-slate-300">{metric.value}</p></div>)}</div></article>
          <article className="mission-panel"><div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="telemetry-label">Figure 02 / periodic signal</p><h3 className="mt-1 font-semibold text-white">Phase-folded transit</h3><p className="mt-1 text-xs text-slate-500">Measurements aligned to the detected orbital period.</p></div><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider ${analysis.transit.detected ? "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-200" : "border-slate-300/10 bg-white/[0.03] text-slate-500"}`}><Orbit className="h-3 w-3" /> {analysis.transit.detected ? "Signal confirmed" : "No signal"}</span></div><div className="p-3 sm:p-5"><FoldedCurveChart flux={analysis.transit.flux} phase={analysis.transit.phase} /></div><div className="grid grid-cols-3 border-t border-white/[0.06]">{scientificMetrics.map((metric) => <div className="border-r border-white/[0.06] px-4 py-3 last:border-r-0" key={metric.label}><p className="telemetry-label">{metric.label}</p><p className="mt-1 truncate font-mono text-[10px] text-slate-300">{metric.value}</p></div>)}</div></article>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="ai-explanation"><div className="mb-4 flex items-end justify-between"><div><p className="workspace-kicker">Model transparency layer</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white" id="ai-explanation">AI Explanation & Evidence</h2><p className="mt-2 max-w-2xl text-sm text-slate-500">Understand which measurable properties supported or challenged the classifier’s conclusion.</p></div><BrainCircuit className="hidden h-7 w-7 text-violet-300 sm:block" /></div><div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]"><ExplanationPanel candidate={candidate} /><FeatureImportanceChart attributions={candidate?.explanation.feature_importance} /></div></section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="mission-panel p-6 sm:p-8"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06]"><Orbit className="h-5 w-5 text-cyan-200" /></span><div><p className="telemetry-label">Table 01</p><h2 className="mt-1 font-semibold text-white">Transit parameters</h2></div></div><dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2">{parameters.map(([label, value]) => <div className="flex items-center justify-between gap-4 bg-[#050a15] p-4" key={label}><dt className="text-sm text-slate-500">{label}</dt><dd className="text-right font-mono text-xs text-slate-200">{value}</dd></div>)}</dl></article>
        <aside className="mission-panel flex flex-col items-center justify-center p-7 text-center">{candidate ? <><BadgeCheck className="h-8 w-8 text-cyan-200" /><p className="telemetry-label mt-4">Ranked candidate</p><h2 className="mt-2 text-lg font-semibold text-white">{candidate.candidate_id}</h2><p className="mt-2 text-sm text-slate-500">Rank #{candidate.rank} · {candidate.classification}</p></> : <><Telescope className="h-8 w-8 text-slate-600" /><h2 className="mt-4 font-semibold text-white">No ranked candidate</h2><p className="mt-2 text-sm leading-6 text-slate-500">No signal was suitable for ML classification.</p></>}</aside>
      </section>

      <section className="mission-panel data-grid mt-8 flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08]"><FileText className="h-5 w-5 text-cyan-200" /></span><div><p className="workspace-kicker">Publication export</p><h2 className="mt-2 text-2xl font-semibold text-white">Generate Scientific Report</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Package the candidate assessment, transit parameters, visualizations, and explainability evidence into a reproducible PDF.</p></div></div><ReportButton analysisId={analysis.analysis_id} /></section>
    </main>
  );
}
