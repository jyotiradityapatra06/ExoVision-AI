"use client";

import { Aperture, BadgeCheck, CalendarDays, Download, FileArchive, LoaderCircle, RadioTower, Search, Telescope, TriangleAlert } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/button";
import { api, ApiError } from "@/lib/api";
import type { DatasetSearchResult } from "@/types/api";

export default function DatasetsPage() { return <ProtectedRoute><DatasetExplorer /></ProtectedRoute>; }

function formatBytes(bytes: number) {
  if (!bytes) return "Size unavailable";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function missionBadge(mission: string) {
  const normalized = mission.toLowerCase();
  if (normalized.includes("tess")) return "border-violet-300/20 bg-violet-300/[0.08] text-violet-200";
  if (normalized.includes("k2")) return "border-amber-300/20 bg-amber-300/[0.08] text-amber-200";
  return "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200";
}

function DatasetExplorer() {
  const router = useRouter();
  const [target, setTarget] = useState("Kepler-452");
  const [mission, setMission] = useState<"all" | "kepler" | "tess">("all");
  const [results, setResults] = useState<DatasetSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [archiveUnavailable, setArchiveUnavailable] = useState(false);

  async function search(event: FormEvent) {
    event.preventDefault(); await runSearch(target, mission);
  }
  async function runSearch(searchTarget: string, searchMission: typeof mission) {
    setTarget(searchTarget); setMission(searchMission); setLoading(true); setError(null); setHasSearched(true); setArchiveUnavailable(false);
    try { setResults(await api.searchDatasets(searchTarget, searchMission)); }
    catch (caught) {
      setResults([]); setArchiveUnavailable(true);
      setError(caught instanceof ApiError ? caught.message : "NASA MAST is temporarily unavailable. The bundled demo remains available below.");
    }
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
  async function analyzeDemo() {
    setAnalyzing("demo"); setError(null);
    try {
      const file = await api.downloadDemoDataset();
      const upload = await api.uploadLightcurve(file);
      await api.startAnalysis(upload.analysis_id);
      router.push(`/results/${upload.analysis_id}`);
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : "The bundled demo could not be analyzed."); setAnalyzing(null); }
  }
  return (
    <main className="app-workspace">
      <header className="flex flex-col gap-6 border-b border-white/[0.08] pb-8 lg:flex-row lg:items-end lg:justify-between"><div><p className="workspace-kicker">NASA archive access</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">Dataset explorer</h1><p className="mt-4 max-w-2xl text-slate-400">Search public Kepler, K2, and TESS observations in MAST, then send a FITS light curve directly into ExoVision’s scientific pipeline.</p></div><div className="flex items-center gap-3 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.04] px-4 py-3"><RadioTower className="h-4 w-4 text-emerald-300" /><div><p className="telemetry-label">Archive relay</p><p className="mt-1 text-xs text-slate-300">MAST connection ready</p></div></div></header>
      <form className="mission-panel mt-8 grid gap-3 p-4 sm:grid-cols-[1fr_160px_auto]" onSubmit={search}>
        <label className="relative"><span className="sr-only">Astronomical target</span><Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" /><input className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-11 pr-4 text-white outline-none focus:border-cyan-300/50" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Kepler-452, TIC 307210830…" required /></label>
        <select aria-label="Mission" className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" value={mission} onChange={(event) => setMission(event.target.value as typeof mission)}><option value="all">All missions</option><option value="kepler">Kepler / K2</option><option value="tess">TESS</option></select>
        <Button type="submit" disabled={loading}>{loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Search MAST</Button>
      </form>
      {error && <p className="mt-5 flex items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-sm text-amber-100"><TriangleAlert className="h-4 w-4 shrink-0" />{error}</p>}
      <section className="mt-8" aria-live="polite">
        {(results.length > 0 || loading) && <div className="mb-4 flex items-end justify-between gap-4"><div><p className="telemetry-label">Observation catalog</p><h2 className="mt-1 text-lg font-semibold text-white">Archive results</h2></div>{!loading && <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{results.length} compatible {results.length === 1 ? "product" : "products"}</span>}</div>}
        {loading && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Searching archive"><div className="skeleton-line h-72" /><div className="skeleton-line h-72" /><div className="skeleton-line h-72" /></div>}
        {!loading && results.length === 0 && !archiveUnavailable && <div className="mission-panel border-dashed p-12 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04]"><Telescope className="h-7 w-7 text-cyan-300/60" /></span><p className="mt-5 text-slate-300">{hasSearched ? "No compatible light-curve FITS products were found for this target." : "Search for a target to view available light curves."}</p><p className="mt-2 text-xs text-slate-600">Query by catalog identifier, common target name, or mission object ID.</p></div>}
        {!loading && results.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{results.map((item) => <article className="group mission-panel flex min-h-[300px] flex-col p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/25 hover:shadow-[0_24px_70px_rgba(0,0,0,.38),0_0_30px_rgba(103,232,249,.06)] sm:p-6" key={item.data_uri}>
          <div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] transition group-hover:border-cyan-300/30 group-hover:bg-cyan-300/[0.09]"><Aperture className="h-5 w-5 text-cyan-200" /></span><span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] ${missionBadge(item.mission)}`}>{item.mission}</span></div>
          <div className="mt-5 min-w-0"><p className="telemetry-label">Target</p><h3 className="mt-2 truncate text-xl font-semibold tracking-tight text-white">{item.target_name}</h3><p className="mt-1 truncate font-mono text-[9px] text-slate-600" title={item.filename}>{item.filename}</p></div>
          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07]">
            <div className="bg-[#050a15] p-3.5"><dt className="flex items-center gap-1.5 telemetry-label"><CalendarDays className="h-3 w-3" /> Observation period</dt><dd className="mt-2 break-words text-xs leading-5 text-slate-300">{item.observation_period}</dd></div>
            <div className="bg-[#050a15] p-3.5"><dt className="flex items-center gap-1.5 telemetry-label"><FileArchive className="h-3 w-3" /> Data type</dt><dd className="mt-2 text-xs font-medium text-slate-300">FITS <span className="ml-1 text-slate-600">· {formatBytes(item.size_bytes)}</span></dd></div>
          </dl>
          <div className="mt-auto flex items-center justify-between gap-4 pt-5"><span className="flex items-center gap-2 text-xs text-emerald-200"><BadgeCheck className="h-4 w-4" /><span><span className="block telemetry-label">Quality</span><span className="mt-0.5 block">MAST verified</span></span></span><Button onClick={() => analyze(item)} disabled={analyzing !== null} size="sm">{analyzing === item.data_uri ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Analyze</Button></div>
        </article>)}</div>}
      </section>
      <section className="mt-10" aria-labelledby="reliable-samples">
        <h2 className="text-lg font-semibold text-white" id="reliable-samples">Reliable sample paths</h2>
        <p className="mt-2 text-sm text-slate-400">The bundled demo remains available when the NASA archive is slow. Kepler and TESS shortcuts retry live MAST searches.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5"><p className="text-xs uppercase tracking-wider text-cyan-300">Local fallback</p><h3 className="mt-2 font-semibold text-white">Demo Dataset</h3><p className="mt-2 text-sm text-slate-400">Bundled deterministic FITS transit sample.</p><Button className="mt-5" disabled={analyzing !== null} onClick={() => void analyzeDemo()} size="sm">{analyzing === "demo" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Analyze demo</Button></article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-wider text-slate-500">NASA Kepler</p><h3 className="mt-2 font-semibold text-white">Kepler Sample</h3><p className="mt-2 text-sm text-slate-400">Search the live archive for Kepler-10.</p><Button className="mt-5" disabled={loading} onClick={() => void runSearch("Kepler-10", "kepler")} size="sm" variant="secondary">Search Kepler-10</Button></article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-wider text-slate-500">NASA TESS</p><h3 className="mt-2 font-semibold text-white">TESS Sample</h3><p className="mt-2 text-sm text-slate-400">Search the live archive for TOI-700.</p><Button className="mt-5" disabled={loading} onClick={() => void runSearch("TOI-700", "tess")} size="sm" variant="secondary">Search TOI-700</Button></article>
        </div>
      </section>
    </main>
  );
}
