"use client";

import { AlertCircle, ArrowRight, FileSearch, FlaskConical, LoaderCircle, RefreshCw, ScanSearch, Telescope, Waves } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OrbitalSystem } from "@/components/observatory/OrbitalSystem";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { AnalysisHistoryPage, AnalysisSummaryItem } from "@/types/api";

const PAGE_SIZE = 12;
const emptyCounts = { total: 0, completed: 0, processing: 0, failed: 0 };

const stageLabels: Record<string, string> = {
  ready: "Ready",
  preparing_observation: "Preparing observation",
  analyzing_lightcurve: "Searching light curve",
  classifying_candidate: "Classifying candidate",
  preparing_results: "Preparing results",
  completed: "Completed",
  failed: "Failed",
};

function formatNumber(value: number | null, digits: number, unit = "") {
  return value === null ? "—" : `${value.toFixed(digits)}${unit}`;
}

function formatDepth(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(4)}%`;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function statusLabel(item: AnalysisSummaryItem) {
  if (item.status === "processing") return stageLabels[item.stage] ?? "Processing";
  if (item.status === "completed") return "Completed";
  if (item.status === "failed") return "Failed";
  return "Ready";
}

function statusClass(status: string) {
  if (status === "completed") return "app-status-complete";
  if (status === "failed") return "app-status-failed";
  if (status === "processing") return "app-status-processing";
  return "app-status-info";
}

function candidateLabel(item: AnalysisSummaryItem) {
  if (item.status !== "completed") return "Pending analysis";
  if (item.candidate_detected === true) return item.classification ?? "Candidate detected";
  if (item.candidate_detected === false) return "No candidate detected";
  return "Summary unavailable";
}

export default function DashboardPage() {
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}

function Dashboard() {
  const { user } = useAuth();
  const [page, setPage] = useState<AnalysisHistoryPage>({ items: [], counts: emptyCounts, total: 0, limit: PAGE_SIZE, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await api.dashboardHistory(PAGE_SIZE, offset);
      setPage((current) => ({ ...response, items: append ? [...current.items, ...response.items.filter((item) => !current.items.some((existing) => existing.id === item.id))] : response.items }));
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 0 ? "The ExoVision API could not be reached. Check the service and try again." : "Analysis history could not be loaded safely. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.dashboardHistory(PAGE_SIZE, 0)
      .then((response) => { if (active) setPage(response); })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError && caught.status === 0 ? "The ExoVision API could not be reached. Check the service and try again." : "Analysis history could not be loaded safely. Please try again.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const active = useMemo(() => page.items.filter((item) => item.status === "processing"), [page.items]);
  const hasMore = page.items.length < page.total;

  return (
    <main className="app-workspace dashboard-workspace">
      {/* Observatory Console Header */}
      <header className="obs-console-header">
        <div>
          <div className="inline-flex items-center gap-2 rounded-sm border border-cyan-400/25 bg-cyan-950/30 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#38bdf8]" />
            Observatory Console · Session Active
          </div>
          <h1 className="obs-console-title mt-2">
            {user?.display_name ? `${user.display_name}’s Workspace` : "Research Workspace"}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            AI-assisted exoplanet candidate screening from stellar light-curve observations.
          </p>
        </div>

        {/* Primary Action Zone */}
        <div className="obs-console-actions">
          <Link href="/demo" className="btn-secondary">
            <FlaskConical className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" /> Explore Demo
          </Link>
          <Link href="/upload" className="obs-aperture-cta">
            <Telescope className="h-4 w-4 text-cyan-950" aria-hidden="true" />
            <span>Analyze Observation</span>
          </Link>
        </div>
      </header>

      {loading ? <DashboardSkeleton /> : error ? <DashboardError message={error} retry={() => void load()} /> : page.total === 0 ? <DashboardEmpty /> : <>
        {/* Compact Instrument Status Strip */}
        <section className="obs-instrument-strip" aria-label="Analysis summary">
          <article className="obs-instrument-chip">
            <div className="obs-chip-header">
              <span className="obs-chip-label">Total Observations</span>
              <span className="obs-chip-dot bg-slate-400" />
            </div>
            <strong className="obs-chip-value">{page.counts.total}</strong>
            <span className="obs-chip-sub">Registered runs</span>
          </article>

          <article className="obs-instrument-chip">
            <div className="obs-chip-header">
              <span className="obs-chip-label">Completed</span>
              <span className="obs-chip-dot bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            </div>
            <strong className="obs-chip-value text-emerald-300">{page.counts.completed}</strong>
            <span className="obs-chip-sub">Screening complete</span>
          </article>

          <article className="obs-instrument-chip">
            <div className="obs-chip-header">
              <span className="obs-chip-label">Processing</span>
              <span className="obs-chip-dot bg-sky-400 shadow-[0_0_6px_#38bdf8] animate-pulse" />
            </div>
            <strong className="obs-chip-value text-sky-300">{page.counts.processing}</strong>
            <span className="obs-chip-sub">Active pipeline runs</span>
          </article>

          <article className="obs-instrument-chip">
            <div className="obs-chip-header">
              <span className="obs-chip-label">Failed</span>
              <span className="obs-chip-dot bg-amber-400" />
            </div>
            <strong className="obs-chip-value text-amber-300">{page.counts.failed}</strong>
            <span className="obs-chip-sub">Requires review</span>
          </article>
        </section>

        {active.length > 0 && <section className="dashboard-active" aria-labelledby="active-analysis-heading">
          <div><p className="dashboard-section-label">Active analysis</p><h2 id="active-analysis-heading">Processing now</h2></div>
          <div className="dashboard-active-list">{active.map((item) => <article key={item.id}><span className="dashboard-active-icon"><LoaderCircle aria-hidden="true" /></span><div><h3>{item.filename}</h3><p>{stageLabels[item.stage] ?? "Processing observation"}{item.processing_started_at ? ` · Started ${formatTimestamp(item.processing_started_at)}` : ""}</p></div><span className="app-status app-status-processing">{statusLabel(item)}</span><Link href={`/results/${item.id}`}>View processing <ArrowRight aria-hidden="true" /></Link></article>)}</div>
        </section>}

        <section className="dashboard-history" aria-labelledby="recent-analyses-heading">
          <header><div><p className="dashboard-section-label">Research history</p><h2 id="recent-analyses-heading">Recent analyses</h2><p>Compact scientific summaries; full evidence remains on each result page.</p></div><button type="button" onClick={() => void load()} aria-label="Refresh analyses"><RefreshCw aria-hidden="true" /></button></header>
          <div className="dashboard-table-wrap">
            <table><thead><tr><th>Observation</th><th>Status</th><th>Candidate</th><th>Period</th><th>Depth</th><th><span className="model-score-label" title="Classifier output used for candidate screening; not confirmation probability.">Model score <span aria-hidden="true">?</span></span></th><th>Updated</th><th><span className="sr-only">Action</span></th></tr></thead>
              <tbody>{page.items.map((item) => <AnalysisRow item={item} key={item.id} />)}</tbody></table>
          </div>
          <div className="dashboard-mobile-list">{page.items.map((item) => <AnalysisCard item={item} key={item.id} />)}</div>
          <footer><p>Showing {page.items.length} of {page.total} analyses</p>{hasMore && <button type="button" disabled={loadingMore} onClick={() => void load(page.items.length, true)}>{loadingMore ? <><LoaderCircle className="animate-spin" aria-hidden="true" /> Loading</> : <>Load more analyses <ArrowRight aria-hidden="true" /></>}</button>}</footer>
        </section>
      </>}
    </main>
  );
}

function AnalysisRow({ item }: { item: AnalysisSummaryItem }) {
  return <tr><td><strong>{item.filename}</strong><span>{item.id}</span></td><td><span className={`app-status ${statusClass(item.status)}`}>{statusLabel(item)}</span>{item.status === "failed" && item.safe_error && <small>{item.safe_error}</small>}</td><td>{candidateLabel(item)}</td><td className="dashboard-value">{formatNumber(item.period_days, 4, " d")}</td><td className="dashboard-value">{formatDepth(item.depth)}</td><td className="dashboard-value">{item.model_score === null ? "—" : `${(item.model_score * 100).toFixed(1)}%`}</td><td><time dateTime={item.updated_at} title={new Date(item.updated_at).toISOString()}>{formatTimestamp(item.updated_at)}</time></td><td><Link href={`/results/${item.id}`}>{item.status === "completed" ? "View result" : item.status === "failed" ? "Review" : "Open"}<ArrowRight aria-hidden="true" /></Link></td></tr>;
}

function AnalysisCard({ item }: { item: AnalysisSummaryItem }) {
  return <article><div><div><h3>{item.filename}</h3><time dateTime={item.updated_at} title={new Date(item.updated_at).toISOString()}>{formatTimestamp(item.updated_at)}</time></div><span className={`app-status ${statusClass(item.status)}`}>{statusLabel(item)}</span></div><p className="dashboard-candidate"><ScanSearch aria-hidden="true" /> {candidateLabel(item)}</p>{item.status === "failed" && item.safe_error && <p className="dashboard-safe-error">{item.safe_error}</p>}<dl><div><dt>Period</dt><dd>{formatNumber(item.period_days, 4, " d")}</dd></div><div><dt>Depth</dt><dd>{formatDepth(item.depth)}</dd></div><div><dt>Transit SNR</dt><dd>{formatNumber(item.transit_snr, 2)}</dd></div><div><dt>Model score</dt><dd>{item.model_score === null ? "—" : `${(item.model_score * 100).toFixed(1)}%`}</dd></div></dl><Link href={`/results/${item.id}`}>{item.status === "completed" ? "View scientific result" : item.status === "failed" ? "Review failed analysis" : "Open analysis"}<ArrowRight aria-hidden="true" /></Link></article>;
}

function DashboardSkeleton() {
  return <div className="dashboard-loading" role="status" aria-live="polite"><span className="sr-only">Loading analysis dashboard</span><div className="dashboard-metrics">{[0,1,2,3].map((item) => <div className="skeleton-line h-32" key={item} />)}</div><div className="skeleton-line h-20" /><div className="skeleton-line h-72" /></div>;
}

function DashboardError({ message, retry }: { message: string; retry: () => void }) {
  return <section className="dashboard-state" role="alert"><AlertCircle aria-hidden="true" /><h2>Unable to load your workspace</h2><p>{message}</p><button type="button" onClick={retry}><RefreshCw aria-hidden="true" /> Try again</button></section>;
}

function DashboardEmpty() {
  return <section className="observatory-empty dashboard-observation-empty" aria-labelledby="first-observation-heading">
    <OrbitalSystem compact />
    <div className="observatory-empty-copy"><p className="dashboard-section-label">First observation</p><h2 id="first-observation-heading">Begin with a stellar light curve.</h2><p>Provide an observation and ExoVision will screen its photometry for periodic transit-like signals. Measurements and evidence will return to this workspace.</p><div><Link href="/upload" className="dashboard-primary-action">Analyze Observation <ArrowRight aria-hidden="true" /></Link><Link href="/demo" className="dashboard-secondary-action">Explore Demo</Link></div></div>
    <ol className="observatory-empty-steps" aria-label="Observation workflow"><li><Telescope aria-hidden="true" /><span><b>01</b><strong>Provide observation</strong><small>Upload or select a supported light curve</small></span></li><li><Waves aria-hidden="true" /><span><b>02</b><strong>Screen the signal</strong><small>Run the real photometric analysis pipeline</small></span></li><li><FileSearch aria-hidden="true" /><span><b>03</b><strong>Review evidence</strong><small>Inspect measurements, caveats, and reports</small></span></li></ol>
  </section>;
}
