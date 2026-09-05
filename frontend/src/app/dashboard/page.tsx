"use client";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  FileText,
  Filter,
  Orbit,
  RefreshCw,
  Satellite,
  ScanSearch,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { AnalysisHistoryItem, AnalysisResult } from "@/types/api";

type ResultRegistry = Record<string, AnalysisResult>;

const pipeline = [
  { label: "Upload", detail: "Dataset ingestion", icon: Upload },
  { label: "Preprocessing", detail: "Clean & normalize", icon: Filter },
  { label: "BLS Detection", detail: "Transit search", icon: Activity },
  { label: "ML Classification", detail: "Candidate scoring", icon: BrainCircuit },
  { label: "Scientific Report", detail: "Evidence export", icon: FileText },
];

function missionFromFilename(filename: string) {
  const normalized = filename.toLowerCase();
  if (normalized.includes("tess") || normalized.includes("tic")) return "TESS";
  if (normalized.includes("k2")) return "K2";
  if (normalized.includes("kepler") || normalized.includes("kic")) return "Kepler";
  return "Uploaded observation";
}

function statusClasses(status: string) {
  if (status === "completed") return "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200";
  if (status === "failed") return "border-rose-300/20 bg-rose-300/[0.08] text-rose-200";
  return "border-amber-300/20 bg-amber-300/[0.08] text-amber-200";
}

async function fetchDashboardData() {
  const items = await api.analysisHistory();
  const completedItems = items.filter((item) => item.status === "completed");
  const settled = await Promise.allSettled(completedItems.map((item) => api.getAnalysisResult(item.id)));
  const registry: ResultRegistry = {};
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") registry[completedItems[index].id] = result.value;
  });
  return { items, registry };
}

export default function DashboardPage() {
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}

function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [results, setResults] = useState<ResultRegistry>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items, registry } = await fetchDashboardData();
      setHistory(items);
      setResults(registry);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Analysis history could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchDashboardData()
      .then(({ items, registry }) => {
        if (!active) return;
        setHistory(items);
        setResults(registry);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : "Analysis history could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const completed = history.filter((item) => item.status === "completed").length;
  const orderedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [history]
  );
  const latest = orderedHistory.find((item) => item.status === "completed") ?? orderedHistory[0];
  const latestResult = latest ? results[latest.id] : undefined;
  const latestCandidate = latestResult?.candidates[0];
  const allCandidates = Object.values(results).flatMap((result) => result.candidates);
  const averageConfidence = allCandidates.length
    ? allCandidates.reduce((sum, candidate) => sum + candidate.confidence, 0) / allCandidates.length
    : null;

  const statistics = [
    { label: "Observation Archive", caption: "Total analyses", value: history.length.toString().padStart(2, "0"), icon: Database, tone: "text-cyan-300", glow: "from-cyan-300/35" },
    { label: "Completed Missions", caption: "Finished analyses", value: completed.toString().padStart(2, "0"), icon: CheckCircle2, tone: "text-emerald-300", glow: "from-emerald-300/35" },
    { label: "Candidate Signals", caption: "Detected candidates", value: allCandidates.length ? allCandidates.length.toString().padStart(2, "0") : "—", icon: ScanSearch, tone: "text-violet-300", glow: "from-violet-300/35" },
    { label: "Model Score", caption: "Average classifier output", value: averageConfidence === null ? "—" : `${(averageConfidence * 100).toFixed(1)}%`, icon: BrainCircuit, tone: "text-amber-300", glow: "from-amber-300/35" },
  ];

  return (
    <main className="app-workspace">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-16 -z-10 h-[680px] overflow-hidden">
        <div className="absolute left-1/2 top-[-320px] h-[720px] w-[720px] -translate-x-1/2 rounded-full border border-cyan-300/[0.06]" />
        <div className="absolute left-1/2 top-[-230px] h-[540px] w-[540px] -translate-x-1/2 rounded-full border border-cyan-300/[0.05]" />
        <div className="absolute left-[12%] top-24 h-1 w-1 rounded-full bg-white/60 shadow-[180px_80px_0_rgba(255,255,255,.35),520px_20px_0_rgba(103,232,249,.35),880px_130px_0_rgba(255,255,255,.25),1040px_10px_0_rgba(103,232,249,.3)]" />
      </div>

      <header className="mission-panel data-grid flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:p-10">
        <div>
          <p className="workspace-kicker">ExoVision operations / system nominal</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Research Command Center</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">Analyze stellar light curves, detect transit signals, and investigate potential exoplanets using AI.</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300/10 font-mono text-xs font-semibold text-cyan-200">{user?.display_name?.slice(0, 1).toUpperCase() ?? "R"}<span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-300" /></span>
            <div><p className="telemetry-label">Lead researcher</p><p className="mt-1 max-w-36 truncate text-xs font-medium text-slate-200">{user?.display_name ?? "Researcher"}</p></div>
          </div>
          <div className="flex items-center gap-3 px-1 text-xs"><Satellite className="h-4 w-4 text-emerald-300" /><div><p className="telemetry-label">System status</p><p className="mt-1 text-emerald-200">Pipeline online</p></div></div>
          <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-200 px-6 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(103,232,249,.22)] transition hover:-translate-y-0.5 hover:bg-white" href="/upload"><Sparkles className="h-4 w-4" /> New Analysis</Link>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Mission statistics">
        {statistics.map((item) => (
          <article className="telemetry-card group min-h-40" key={item.label}>
            <div className="flex items-start justify-between"><div><p className="telemetry-label">{item.label}</p><p className="mt-1 text-xs text-slate-600">{item.caption}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-black/20"><item.icon className={`h-4 w-4 ${item.tone}`} /></span></div>
            <p className="mt-6 font-mono text-3xl font-semibold tracking-tight text-white">{loading ? "—" : item.value}</p>
            <div className={`mt-4 h-px bg-gradient-to-r ${item.glow} to-transparent transition-all group-hover:w-full`} />
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,.55fr)]">
        <article className="mission-panel min-h-[330px]">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6"><div><p className="telemetry-label">Latest screening result</p><h2 className="mt-1 font-semibold text-white">Featured analysis</h2></div><Orbit className="h-5 w-5 text-cyan-300" /></div>
          {latest ? (
            <div className="grid min-h-[270px] gap-8 p-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
              <div>
                <span className={`inline-flex rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] ${latestCandidate ? "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-200" : statusClasses(latest.status)}`}>{latestCandidate ? "Exoplanet candidate detected" : latest.status === "completed" ? "Analysis complete" : `Mission ${latest.status}`}</span>
                <h3 className="mt-5 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">{latest.filename}</h3>
                <p className="mt-2 font-mono text-[10px] text-slate-600">MISSION ID / {latest.id}</p>
                <p className="mt-6 max-w-xl text-sm leading-6 text-slate-400">{latestCandidate ? "Transit-like signal detected and ranked by the ExoVision candidate-screening pipeline." : latest.status === "completed" ? "The analysis pipeline completed successfully. Open the evidence workspace to review transit detection and classification." : "This observation is moving through the scientific analysis pipeline."}</p>
                {latest.status === "completed" && <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white" href={`/results/${latest.id}`}>Investigate result <ArrowRight className="h-4 w-4" /></Link>}
              </div>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08]">
                {[{ label: "Mission", value: missionFromFilename(latest.filename) }, { label: "Detection", value: latestResult?.transit.detected ? "Candidate detected" : latestResult ? "Not detected" : "Unavailable" }, { label: "Model score", value: latestCandidate ? `${(latestCandidate.confidence * 100).toFixed(1)}%` : "Unavailable" }, { label: "Classification", value: latestCandidate?.classification ?? "Unclassified" }].map((item) => <div className="bg-[#050a15] p-4" key={item.label}><dt className="telemetry-label">{item.label}</dt><dd className="mt-2 break-words text-sm font-medium text-slate-200">{item.value}</dd></div>)}
              </dl>
            </div>
          ) : <div className="flex min-h-[270px] flex-col items-center justify-center p-8 text-center"><FileSearch className="h-8 w-8 text-cyan-300/50" /><h3 className="mt-4 font-semibold text-white">No analysis selected</h3><p className="mt-2 max-w-md text-sm text-slate-500">Run your first observation to populate the featured analysis panel.</p></div>}
        </article>

        <aside className="mission-panel">
          <div className="border-b border-white/[0.08] px-5 py-4"><p className="telemetry-label">Analysis timeline</p><h2 className="mt-1 font-semibold text-white">Scientific pipeline</h2></div>
          <ol className="p-5 sm:p-6">
            {pipeline.map((step, index) => <li className="relative flex gap-4 pb-5 last:pb-0" key={step.label}>{index < pipeline.length - 1 && <span className="absolute left-[17px] top-9 h-[calc(100%-28px)] w-px bg-gradient-to-b from-cyan-300/40 to-cyan-300/5" />}<span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.07]"><step.icon className="h-4 w-4 text-cyan-200" /></span><div className="pt-0.5"><p className="text-sm font-medium text-slate-200">{step.label}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-600">{step.detail}</p></div></li>)}
          </ol>
        </aside>
      </section>

      <section className="mission-panel mt-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6"><div><p className="telemetry-label">Observation archive</p><h2 className="mt-1 font-semibold text-white">Analysis history</h2><p className="mt-1 text-sm text-slate-500">Recent datasets and pipeline activity.</p></div><button aria-label="Refresh analysis history" className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5 text-slate-400 transition hover:border-cyan-200/20 hover:text-cyan-200 disabled:opacity-50" disabled={loading} onClick={() => void loadHistory()} type="button"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div>
        {loading ? <div className="grid gap-3 p-5 sm:p-6 lg:grid-cols-2" aria-label="Loading analysis history"><div className="skeleton-line h-28" /><div className="skeleton-line h-28" /><div className="skeleton-line h-28" /><div className="skeleton-line h-28" /></div>
        : error ? <div className="flex flex-col items-center px-6 py-16 text-center"><AlertCircle className="h-8 w-8 text-rose-300" /><h3 className="mt-4 font-semibold text-white">Unable to load analyses</h3><p className="mt-2 max-w-md text-sm text-slate-400">{error}</p><button className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/[0.05]" onClick={() => void loadHistory()} type="button"><RefreshCw className="h-4 w-4" /> Try again</button></div>
        : orderedHistory.length === 0 ? <div className="flex flex-col items-center px-6 py-16 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04]"><FileSearch className="h-7 w-7 text-cyan-200" /></span><h3 className="mt-5 text-lg font-semibold text-white">Observation archive empty</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Upload your first FITS, CSV, or TXT light curve to begin a reproducible transit search.</p><Link className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-200 px-5 py-2.5 text-sm font-semibold text-slate-950" href="/upload">Upload a light curve <ArrowRight className="h-4 w-4" /></Link></div>
        : <div className="grid gap-3 p-4 sm:p-6 lg:grid-cols-2">{orderedHistory.map((item) => <article className="group rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/20 hover:bg-cyan-200/[0.035]" key={item.id}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="telemetry-label">{missionFromFilename(item.filename)} observation</p><h3 className="mt-2 truncate font-medium text-white">{item.filename}</h3></div><span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider ${statusClasses(item.status)}`}>{item.status}</span></div><div className="mt-5 flex flex-col gap-3 border-t border-white/[0.06] pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span className="flex min-w-0 items-center gap-2"><Clock3 className="h-3.5 w-3.5 shrink-0" /><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></span>{item.status === "completed" ? <Link className="inline-flex items-center gap-1.5 font-semibold text-cyan-200 transition group-hover:text-white" href={`/results/${item.id}`}>View evidence <ArrowRight className="h-3.5 w-3.5" /></Link> : <span className="truncate font-mono text-[9px] text-slate-700">{item.id}</span>}</div></article>)}</div>}
      </section>
    </main>
  );
}
