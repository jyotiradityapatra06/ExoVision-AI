"use client";

import { Database, Download, LoaderCircle, Search, Telescope } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/button";
import { api, ApiError } from "@/lib/api";
import type { DatasetSearchResult } from "@/types/api";

export default function DatasetsPage() { return <ProtectedRoute><DatasetExplorer /></ProtectedRoute>; }

function DatasetExplorer() {
  const router = useRouter();
  const [target, setTarget] = useState("Kepler-452");
  const [mission, setMission] = useState<"all" | "kepler" | "tess">("all");
  const [results, setResults] = useState<DatasetSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(null);
    try { setResults(await api.searchDatasets(target, mission)); }
    catch (caught) { setError(caught instanceof ApiError ? caught.message : "NASA MAST search failed."); }
    finally { setLoading(false); }
  }
  async function analyze(item: DatasetSearchResult) {
    setAnalyzing(item.data_uri); setError(null);
    try {
      const file = await api.downloadDataset(item.data_uri, item.filename);
      const upload = await api.uploadLightcurve(file);
      await api.startAnalysis(upload.analysis_id);
      router.push(`/results/${upload.analysis_id}`);
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : "The archive light curve could not be analyzed."); setAnalyzing(null); }
  }
  return (
    <main className="mx-auto min-h-[80vh] max-w-6xl px-5 pb-24 pt-28 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-300">NASA archive access</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Dataset explorer</h1>
      <p className="mt-4 max-w-2xl text-slate-400">Search public Kepler, K2, and TESS observations in MAST, then send a FITS light curve directly into ExoVision’s scientific pipeline.</p>
      <form className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-[1fr_160px_auto]" onSubmit={search}>
        <label className="relative"><span className="sr-only">Astronomical target</span><Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" /><input className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-11 pr-4 text-white outline-none focus:border-cyan-300/50" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Kepler-452, TIC 307210830…" required /></label>
        <select aria-label="Mission" className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" value={mission} onChange={(event) => setMission(event.target.value as typeof mission)}><option value="all">All missions</option><option value="kepler">Kepler / K2</option><option value="tess">TESS</option></select>
        <Button type="submit" disabled={loading}>{loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Search MAST</Button>
      </form>
      {error && <p className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-4 text-sm text-rose-200">{error}</p>}
      <section className="mt-6 space-y-3" aria-live="polite">
        {!loading && results.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center"><Telescope className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-4 text-slate-400">Search for a target to view available light curves.</p></div>}
        {results.map((item) => <article className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[1.2fr_.7fr_1fr_.5fr_auto] md:items-center" key={item.data_uri}>
          <div><p className="text-xs uppercase tracking-wider text-slate-500">Target name</p><h2 className="mt-1 font-semibold text-white">{item.target_name}</h2><p className="mt-1 truncate text-xs text-slate-500">{item.filename}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-slate-500">Mission</p><p className="mt-1 text-sm text-cyan-200">{item.mission}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-slate-500">Observation period</p><p className="mt-1 text-sm text-slate-300">{item.observation_period}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-slate-500">Available data</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-300"><Database className="h-4 w-4" /> FITS</p></div>
          <Button onClick={() => analyze(item)} disabled={analyzing !== null} size="sm">{analyzing === item.data_uri ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Analyze</Button>
        </article>)}
      </section>
    </main>
  );
}
