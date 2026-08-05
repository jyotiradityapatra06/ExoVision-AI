"use client";

import { AlertCircle, ArrowRight, Clock3, FileSearch, RefreshCw, Upload } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { AnalysisHistoryItem } from "@/types/api";

export default function DashboardPage() {
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}

function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setHistory(await api.analysisHistory()); }
    catch (caught) { setError(caught instanceof ApiError ? caught.message : "Analysis history could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    api.analysisHistory()
      .then((items) => { if (active) setHistory(items); })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : "Analysis history could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const completed = history.filter((item) => item.status === "completed").length;
  const inProgress = history.filter((item) => item.status === "uploaded" || item.status === "processing").length;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-20 pt-28 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-6 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">Research workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Welcome back{user?.display_name ? `, ${user.display_name}` : ""}</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Review your real analysis history or begin a new light-curve investigation.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-200 px-5 text-sm font-semibold text-slate-950 transition hover:bg-white" href="/upload"><Upload className="h-4 w-4" /> New analysis</Link>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Analysis overview">
        {[{ label: "Total analyses", value: history.length }, { label: "Completed", value: completed }, { label: "In progress", value: inProgress }].map((item) => (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5" key={item.label}>
            <p className="text-sm text-slate-400">{item.label}</p><p className="mt-2 text-3xl font-semibold text-white">{loading ? "—" : item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/45">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <div><h2 className="font-semibold text-white">Analysis history</h2><p className="mt-1 text-sm text-slate-500">Your uploaded datasets and current processing status.</p></div>
          <button aria-label="Refresh analysis history" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50" disabled={loading} onClick={() => void loadHistory()} type="button"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
        </div>

        {loading ? (
          <div className="space-y-3 p-5 sm:p-6" aria-label="Loading analysis history"><div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" /><div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" /><div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" /></div>
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center"><AlertCircle className="h-8 w-8 text-rose-300" /><h3 className="mt-4 font-semibold text-white">Unable to load analyses</h3><p className="mt-2 max-w-md text-sm text-slate-400">{error}</p><button className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/[0.05]" onClick={() => void loadHistory()} type="button"><RefreshCw className="h-4 w-4" /> Try again</button></div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center"><FileSearch className="h-9 w-9 text-cyan-200" /><h3 className="mt-4 text-lg font-semibold text-white">No analyses yet</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Upload your first FITS, CSV, or TXT light curve to begin a reproducible transit search.</p><Link className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-200 px-5 py-2.5 text-sm font-semibold text-slate-950" href="/upload">Upload a light curve <ArrowRight className="h-4 w-4" /></Link></div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {history.map((item) => (
              <article className="grid gap-4 px-5 py-5 transition hover:bg-white/[0.025] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6" key={item.id}>
                <div className="min-w-0"><h3 className="truncate font-medium text-white">{item.filename}</h3><p className="mt-1 truncate font-mono text-xs text-slate-500">{item.id}</p></div>
                <div className="flex items-center gap-2 text-sm text-slate-400"><Clock3 className="h-4 w-4" /><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></div>
                <div className="flex items-center justify-between gap-4 sm:justify-end"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${item.status === "completed" ? "bg-emerald-400/10 text-emerald-300" : item.status === "failed" ? "bg-rose-400/10 text-rose-300" : "bg-amber-300/10 text-amber-200"}`}>{item.status}</span>{item.status === "completed" && <Link aria-label={`View results for ${item.filename}`} className="rounded-lg border border-white/10 p-2 text-cyan-200 transition hover:border-cyan-200/30 hover:bg-cyan-200/[0.06]" href={`/results/${item.id}`}><ArrowRight className="h-4 w-4" /></Link>}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
