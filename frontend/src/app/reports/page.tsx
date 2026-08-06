"use client";

import { BookOpen, CalendarDays, Download, ExternalLink, FileText, LoaderCircle, Orbit, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { api, ApiError } from "@/lib/api";
import type { AnalysisHistoryItem, AnalysisResult } from "@/types/api";

type ResultRegistry = Record<string, AnalysisResult>;

function missionFromFilename(filename: string) {
  const normalized = filename.toLowerCase();
  if (normalized.includes("tess") || normalized.includes("tic")) return "TESS";
  if (normalized.includes("k2")) return "K2";
  if (normalized.includes("kepler") || normalized.includes("kic")) return "Kepler";
  return "Independent observation";
}

export default function ReportsPage() {
  return <ProtectedRoute><ReportsContent /></ProtectedRoute>;
}

function ReportsContent() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [results, setResults] = useState<ResultRegistry>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    api.analysisHistory()
      .then(async (data) => {
        const completed = data.filter((item) => item.status === "completed");
        const settled = await Promise.allSettled(completed.map((item) => api.getAnalysisResult(item.id)));
        const registry: ResultRegistry = {};
        settled.forEach((result, index) => {
          if (result.status === "fulfilled") registry[completed[index].id] = result.value;
        });
        if (isSubscribed) { setHistory(data); setResults(registry); setLoading(false); }
      })
      .catch((caught) => {
        if (isSubscribed) {
          setHistory([]);
          setError(caught instanceof ApiError ? caught.message : "The report registry could not be loaded.");
          setLoading(false);
        }
      });
    return () => { isSubscribed = false; };
  }, []);

  const filteredHistory = history
    .filter((item) => item.status === "completed" && (item.filename.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  async function handleDownload(id: string, filename: string) {
    setDownloadingId(id);
    setError(null);
    try {
      await api.generateReport(id);
      const blob = await api.downloadReport(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Report PDF generation failed.");
    } finally {
      setDownloadingId(null);
    }
  }

  function handleBibtexExport(item: AnalysisHistoryItem) {
    const bibtex = `@misc{exovision_${item.id.slice(0, 8)},
  title={Candidate Analysis Report for Target ${item.filename}},
  author={ExoVision AI Autonomous Pipeline},
  year={2026},
  howpublished={ExoVision AI analysis platform},
  url={${window.location.origin}/results/${item.id}}
}`;
    const blob = new Blob([bibtex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.filename}_citation.bib`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-workspace">
      <header className="mb-8 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
        <div><p className="workspace-kicker">Evidence repository / verified exports</p><h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Scientific Archive</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">Browse reproducible candidate analyses, inspect scientific metadata, and export publication-ready evidence.</p></div>
        <div className="relative w-full md:w-80"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input className="h-11 w-full rounded-xl border border-white/[0.09] bg-slate-950/70 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 focus:shadow-[0_0_18px_rgba(103,232,249,.08)]" onChange={(event) => setSearch(event.target.value)} placeholder="Search targets or report IDs…" type="search" value={search} /></div>
      </header>

      {error && <p className="mb-6 rounded-xl border border-rose-400/25 bg-rose-400/[0.08] p-4 text-sm text-rose-200" role="alert">{error}</p>}

      <section aria-live="polite">
        <div className="mb-4 flex items-end justify-between"><div><p className="telemetry-label">Report collection</p><h2 className="mt-1 text-lg font-semibold text-white">Archived analyses</h2></div>{!loading && <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">{filteredHistory.length} reports available</span>}</div>
        {loading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Syncing reports"><div className="skeleton-line h-[410px]" /><div className="skeleton-line h-[410px]" /><div className="skeleton-line h-[410px]" /></div>
        : filteredHistory.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredHistory.map((item) => {
          const result = results[item.id];
          const candidate = result?.candidates[0];
          return <article className="group mission-panel flex min-h-[410px] flex-col p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/25 hover:shadow-[0_28px_80px_rgba(0,0,0,.4),0_0_35px_rgba(103,232,249,.055)] sm:p-6" key={item.id}>
            <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#eef7f8] p-4 text-slate-900 shadow-[0_16px_35px_rgba(0,0,0,.25)]">
              <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-cyan-100 to-transparent" />
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900"><Orbit className="h-3.5 w-3.5 text-cyan-200" /></span><span className="text-[10px] font-bold uppercase tracking-[0.14em]">ExoVision AI</span></div><span className="font-mono text-[8px] text-slate-500">EV-{item.id.slice(0, 8).toUpperCase()}</span></div>
              <p className="mt-4 text-[8px] font-bold uppercase tracking-[0.16em] text-cyan-700">Candidate analysis report</p><h3 className="mt-1 truncate text-lg font-bold tracking-tight">{item.filename}</h3>
              <div className="mt-4 grid grid-cols-3 gap-2"><span className="h-8 rounded bg-slate-900/[0.06]" /><span className="h-8 rounded bg-slate-900/[0.06]" /><span className="h-8 rounded bg-slate-900/[0.06]" /></div><div className="mt-2 h-1.5 w-full rounded bg-slate-900/10" /><div className="mt-1.5 h-1.5 w-3/4 rounded bg-slate-900/10" />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
              {[{ label: "Mission", value: missionFromFilename(item.filename) }, { label: "Target", value: item.filename }, { label: "Generated date", value: new Date(item.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) }, { label: "Classification", value: candidate?.classification ?? "Unavailable" }].map((metadata) => <div className="min-w-0" key={metadata.label}><dt className="telemetry-label">{metadata.label}</dt><dd className="mt-1.5 truncate text-xs font-medium text-slate-300" title={metadata.value}>{metadata.value}</dd></div>)}
            </dl>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/20 p-3"><div><p className="telemetry-label">AI confidence</p><p className="mt-1 font-mono text-lg font-semibold text-white">{candidate ? `${(candidate.confidence * 100).toFixed(1)}%` : "—"}</p></div><div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-200" style={{ width: `${candidate ? candidate.confidence * 100 : 0}%` }} /></div></div>
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
              <Link className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/[0.07] px-3 text-[11px] font-semibold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-300/[0.12]" href={`/results/${item.id}`}><ExternalLink className="h-3.5 w-3.5" /> View Report</Link>
              <button className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-200 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-950 transition hover:bg-white disabled:opacity-50" disabled={downloadingId !== null} onClick={() => handleDownload(item.id, item.filename)} type="button">{downloadingId === item.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}{downloadingId === item.id ? "Preparing…" : "Download PDF"}</button>
              <button aria-label={`Export BibTeX citation for ${item.filename}`} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-white/[0.08] px-3 text-slate-500 transition hover:border-cyan-300/20 hover:text-cyan-200" onClick={() => handleBibtexExport(item)} title="Export BibTeX citation" type="button"><BookOpen className="h-3.5 w-3.5" /></button>
            </div>
          </article>;
        })}</div>
        : <div className="mission-panel p-14 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04]"><FileText className="h-6 w-6 text-cyan-300/60" /></span><h2 className="mt-5 font-semibold text-white">No reports in view</h2><p className="mt-2 text-sm text-slate-500">Complete an analysis or adjust the current search filter.</p></div>}
      </section>

      <footer className="mt-6 flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-violet-300" /> Reports are generated from persisted pipeline evidence.</span><span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> Dates reflect analysis archive records.</span></footer>
    </main>
  );
}
