"use client";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  FlaskConical,
  LoaderCircle,
  Orbit,
  RefreshCw,
  ScanSearch,
  Telescope,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PrecisionButton, SegmentedControl, StatusBadge } from "@/components/ui";
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

function missionFromFilename(filename: string): { label: string; color: string } {
  const norm = filename.toLowerCase();
  if (norm.includes("tess") || norm.includes("tic")) return { label: "TESS", color: "border-sky-500/30 text-sky-400 bg-sky-950/40" };
  if (norm.includes("k2")) return { label: "K2", color: "border-purple-500/30 text-purple-400 bg-purple-950/40" };
  if (norm.includes("kepler") || norm.includes("kic")) return { label: "Kepler", color: "border-amber-500/30 text-amber-400 bg-amber-950/40" };
  return { label: "FITS", color: "border-zinc-700 text-zinc-400 bg-zinc-800/40" };
}

function InlineSparkline({ detected, depth }: { detected?: boolean | null; depth?: number | null }) {
  const hasDip = Boolean(detected && depth && depth > 0);
  const dipDepth = hasDip ? Math.min(8, Math.max(3, Math.round((depth ?? 0.01) * 300))) : 1;
  return (
    <svg className="h-4 w-12 shrink-0 opacity-80" viewBox="0 0 48 16" fill="none">
      <path
        d={`M 0 6 L 16 6 Q 22 6 24 ${6 + dipDepth} Q 26 6 32 6 L 48 6`}
        stroke={hasDip ? "#38bdf8" : "#52525b"}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function candidateLabel(item: AnalysisSummaryItem) {
  if (item.status !== "completed") return "Pending analysis";
  if (item.candidate_detected === true) return item.classification ?? "Candidate detected";
  if (item.candidate_detected === false) return "No candidate detected";
  return "Summary unavailable";
}

type DashboardFilter = "all" | "candidate" | "processing" | "failed";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [page, setPage] = useState<AnalysisHistoryPage>({
    items: [],
    counts: emptyCounts,
    total: 0,
    limit: PAGE_SIZE,
    offset: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DashboardFilter>("all");

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await api.dashboardHistory(PAGE_SIZE, offset);
      setPage((current) => ({
        ...response,
        items: append
          ? [
              ...current.items,
              ...response.items.filter(
                (item) => !current.items.some((existing) => existing.id === item.id),
              ),
            ]
          : response.items,
      }));
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 0
          ? "The ExoVision API could not be reached. Check the service and try again."
          : "Analysis history could not be loaded safely. Please try again.",
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .dashboardHistory(PAGE_SIZE, 0)
      .then((response) => {
        if (active) setPage(response);
      })
      .catch((caught) => {
        if (active)
          setError(
            caught instanceof ApiError && caught.status === 0
              ? "The ExoVision API could not be reached. Check the service and try again."
              : "Analysis history could not be loaded safely. Please try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const active = useMemo(
    () => page.items.filter((item) => item.status === "processing"),
    [page.items],
  );

  const candidateCount = useMemo(
    () => page.items.filter((item) => item.candidate_detected === true).length,
    [page.items],
  );

  const filteredItems = useMemo(() => {
    if (filter === "candidate") return page.items.filter((item) => item.candidate_detected === true);
    if (filter === "processing") return page.items.filter((item) => item.status === "processing");
    if (filter === "failed") return page.items.filter((item) => item.status === "failed");
    return page.items;
  }, [page.items, filter]);

  const hasMore = page.items.length < page.total;

  return (
    <main className="app-workspace dashboard-workspace">
      {/* Research Workspace Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-mono text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            Pipeline operational · Screening pipeline v2.4
          </div>
          <h1 className="mt-2.5 text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
            {user?.display_name ? `${user.display_name}’s Workspace` : "Research Workspace"}
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-sans max-w-xl">
            AI-assisted exoplanet candidate screening from stellar light-curve observations.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <PrecisionButton
            href="/demo"
            variant="secondary"
            size="md"
          >
            <span className="flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-zinc-400" />
              <span>Explore Demo</span>
            </span>
          </PrecisionButton>
          <PrecisionButton
            href="/upload"
            variant="primary"
            size="md"
          >
            <span className="flex items-center gap-1.5">
              <Telescope className="h-3.5 w-3.5 text-zinc-950" />
              <span>Analyze Observation</span>
            </span>
          </PrecisionButton>
        </div>
      </header>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <DashboardError message={error} retry={() => void load()} />
      ) : page.total === 0 ? (
        <DashboardEmpty />
      ) : (
        <>
          {/* Research Summary Metric Strip */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Analysis summary">
            {/* Total Observations */}
            <div className="rounded-lg border border-white/[0.08] bg-[#0d1015] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span>Total Observations</span>
                <ScanSearch className="h-4 w-4 text-zinc-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <strong className="text-2xl font-semibold font-mono tracking-tight text-white">
                  {page.counts.total}
                </strong>
                <span className="text-[11px] text-zinc-500 font-mono">registered</span>
              </div>
            </div>

            {/* Candidates Flagged */}
            <div className="rounded-lg border border-white/[0.08] bg-[#0d1015] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span>Candidates Flagged</span>
                <Orbit className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <strong className="text-2xl font-semibold font-mono tracking-tight text-emerald-400">
                  {candidateCount}
                </strong>
                <span className="text-[11px] text-zinc-500 font-mono">SNR &ge; 7.0</span>
              </div>
            </div>

            {/* Active Pipeline Runs */}
            <div className="rounded-lg border border-white/[0.08] bg-[#0d1015] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span>Active Pipeline</span>
                <Activity className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <strong className="text-2xl font-semibold font-mono tracking-tight text-cyan-300">
                  {page.counts.processing}
                </strong>
                <span className="text-[11px] text-zinc-500 font-mono">in-flight</span>
              </div>
            </div>

            {/* Under Review / Failed */}
            <div className="rounded-lg border border-white/[0.08] bg-[#0d1015] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span>Under Review / Failed</span>
                <AlertCircle className={`h-4 w-4 ${page.counts.failed > 0 ? "text-rose-400" : "text-zinc-500"}`} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <strong className={`text-2xl font-semibold font-mono tracking-tight ${page.counts.failed > 0 ? "text-rose-300" : "text-zinc-300"}`}>
                  {page.counts.failed}
                </strong>
                <span className="text-[11px] text-zinc-500 font-mono">flagged</span>
              </div>
            </div>
          </section>

          {/* Active In-Flight Processing Strip */}
          {active.length > 0 && (
            <section className="rounded-lg border border-cyan-500/25 bg-cyan-950/20 p-4" aria-labelledby="active-analysis-heading">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-3">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                <h2 id="active-analysis-heading">In-Flight Pipeline Runs ({active.length})</h2>
              </div>
              <div className="space-y-2">
                {active.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#0d1015]/80 px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-white">{item.filename}</span>
                      <span className="text-zinc-500 font-mono text-[11px]">
                        {stageLabels[item.stage] ?? "Processing"}
                        {item.processing_started_at ? ` · ${formatTimestamp(item.processing_started_at)}` : ""}
                      </span>
                    </div>
                    <Link
                      href={`/results/${item.id}`}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition text-[11px] font-mono"
                    >
                      <span>View Progress</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Observation Registry Section */}
          <section className="rounded-lg border border-white/[0.08] bg-[#0d1015] p-5 shadow-sm" aria-labelledby="recent-analyses-heading">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.06] mb-4">
              <div>
                <h2 id="recent-analyses-heading" className="text-base font-semibold text-white tracking-tight">
                  Observation Registry
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Scientific telemetry, BLS period searches, and Random Forest screening classifications
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <SegmentedControl<DashboardFilter>
                  value={filter}
                  onChange={(val) => setFilter(val)}
                  items={[
                    { id: "all", label: "All", count: page.items.length },
                    { id: "candidate", label: "Candidates", count: candidateCount },
                    { id: "processing", label: "Processing", count: page.counts.processing },
                    { id: "failed", label: "Failed", count: page.counts.failed },
                  ]}
                />
                <button
                  type="button"
                  onClick={() => void load()}
                  aria-label="Refresh analyses"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] bg-[#090b0e] text-zinc-400 transition hover:border-white/[0.16] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </header>

            {/* Desktop / Tablet Tabular View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    <th className="pb-3 font-medium">Observation Target</th>
                    <th className="pb-3 font-medium">Signal</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Classification</th>
                    <th className="pb-3 font-medium font-mono text-right">Period (P)</th>
                    <th className="pb-3 font-medium font-mono text-right">Depth (δ)</th>
                    <th className="pb-3 font-medium font-mono text-right">Model Score</th>
                    <th className="pb-3 font-medium">Updated</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-zinc-500 font-mono text-xs">
                        No observations found matching this filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const mission = missionFromFilename(item.filename);
                      return (
                        <tr key={item.id} className="transition-colors hover:bg-white/[0.02]">
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <span className={`rounded border px-1.5 py-0.2 text-[9px] font-mono font-medium uppercase ${mission.color}`}>
                                {mission.label}
                              </span>
                              <span className="font-medium text-zinc-200 truncate max-w-[220px]" title={item.filename}>
                                {item.filename}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{item.id.slice(0, 18)}…</div>
                          </td>
                          <td className="py-3 pr-3">
                            <InlineSparkline detected={item.candidate_detected} depth={item.depth} />
                          </td>
                          <td className="py-3 pr-3">
                            <StatusBadge
                              status={
                                item.status === "completed"
                                  ? item.candidate_detected
                                    ? "candidate"
                                    : "non-detection"
                                  : item.status === "processing"
                                    ? "processing"
                                    : item.status === "uploaded"
                                      ? "ready"
                                      : "failed"
                              }
                            />
                          </td>
                          <td className="py-3 pr-3 text-zinc-300 font-sans">
                            {candidateLabel(item)}
                          </td>
                          <td className="py-3 pr-3 font-mono text-right text-zinc-300">
                            {formatNumber(item.period_days, 4, " d")}
                          </td>
                          <td className="py-3 pr-3 font-mono text-right text-zinc-300">
                            {formatDepth(item.depth)}
                          </td>
                          <td className="py-3 pr-3 font-mono text-right text-cyan-300 font-medium">
                            {item.model_score === null ? "—" : `${(item.model_score * 100).toFixed(1)}%`}
                          </td>
                          <td className="py-3 pr-3 text-zinc-500 font-mono text-[11px]">
                            <time dateTime={item.updated_at}>{formatTimestamp(item.updated_at)}</time>
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              href={`/results/${item.id}`}
                              className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-cyan-300 transition-colors"
                            >
                              <span>{item.status === "completed" ? "Dossier" : "Review"}</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-Based Registry View */}
            <div className="md:hidden divide-y divide-white/[0.06]">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                  No observations found matching this filter criteria.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const mission = missionFromFilename(item.filename);
                  return (
                    <article key={item.id} className="py-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`rounded border px-1.5 py-0.2 text-[9px] font-mono font-medium uppercase ${mission.color}`}>
                              {mission.label}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-500 truncate">{item.id.slice(0, 16)}…</span>
                          </div>
                          <h3 className="font-medium text-xs text-white truncate" title={item.filename}>
                            {item.filename}
                          </h3>
                        </div>
                        <StatusBadge
                          status={
                            item.status === "completed"
                              ? item.candidate_detected
                                ? "candidate"
                                : "non-detection"
                              : item.status === "processing"
                                ? "processing"
                                : item.status === "uploaded"
                                  ? "ready"
                                  : "failed"
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs rounded border border-white/[0.06] bg-[#090b0e] p-2.5">
                        <div>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Classification</span>
                          <span className="text-zinc-300 font-medium text-[11px] truncate block">{candidateLabel(item)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Model Score</span>
                          <span className="font-mono font-medium text-cyan-300 text-[11px]">
                            {item.model_score === null ? "—" : `${(item.model_score * 100).toFixed(1)}%`}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Period</span>
                          <span className="font-mono text-zinc-300 text-[11px]">{formatNumber(item.period_days, 4, " d")}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Transit Depth</span>
                          <span className="font-mono text-zinc-300 text-[11px]">{formatDepth(item.depth)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <time dateTime={item.updated_at} className="font-mono text-[10px] text-zinc-500">
                          {formatTimestamp(item.updated_at)}
                        </time>
                        <Link
                          href={`/results/${item.id}`}
                          className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          <span>{item.status === "completed" ? "Dossier" : "Review"}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {/* Footer / Pagination */}
            <footer className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-zinc-500 font-mono">
              <p>
                Showing {filteredItems.length} of {page.total} analyses
              </p>
              {hasMore && (
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void load(page.items.length, true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#090b0e] px-2.5 py-1 text-xs text-zinc-300 transition hover:border-white/[0.16] hover:bg-white/[0.04] disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      Load more <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </button>
              )}
            </footer>
          </section>
        </>
      )}
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Loading analysis dashboard</span>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((item) => (
          <div className="h-24 rounded-lg border border-white/[0.08] bg-[#0d1015] animate-pulse" key={item} />
        ))}
      </div>
      <div className="h-72 rounded-lg border border-white/[0.08] bg-[#0d1015] animate-pulse" />
    </div>
  );
}

function DashboardError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <section className="rounded-lg border border-rose-500/25 bg-rose-500/[0.06] p-8 text-center" role="alert">
      <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" aria-hidden="true" />
      <h2 className="text-base font-medium text-white">Unable to load your workspace</h2>
      <p className="mt-1 text-xs text-rose-300/80 max-w-md mx-auto">{message}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-white/[0.12] bg-[#0d1015] px-3.5 py-1.5 text-xs text-zinc-200 transition hover:bg-white/[0.06]"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
      </button>
    </section>
  );
}

function DashboardEmpty() {
  return (
    <section className="rounded-lg border border-white/[0.08] bg-[#0d1015] p-10 text-center" aria-labelledby="first-observation-heading">
      <div className="max-w-md mx-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.03] text-zinc-400 mx-auto mb-4">
          <Telescope className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 id="first-observation-heading" className="text-lg font-semibold text-white">
          Begin your first observation
        </h2>
        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
          Provide a stellar light curve from NASA MAST or upload your own FITS/CSV file. ExoVision will screen its photometry for periodic transit signals using Box Least Squares and Random Forest candidate classification.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <PrecisionButton href="/upload" variant="primary" size="md">
            Analyze Observation <ArrowRight className="h-3.5 w-3.5" />
          </PrecisionButton>
          <PrecisionButton href="/demo" variant="secondary" size="md">
            Explore Demo
          </PrecisionButton>
        </div>
      </div>
    </section>
  );
}
