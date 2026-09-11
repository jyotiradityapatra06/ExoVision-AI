"use client";

import {
  AlertCircle,
  ArrowRight,
  Compass,
  FlaskConical,
  LoaderCircle,
  RefreshCw,
  Telescope,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StatusBadge } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { AnalysisHistoryPage, AnalysisSummaryItem } from "@/types/api";

const PAGE_SIZE = 15;
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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function missionFromFilename(filename: string): { label: string; badgeClass: string } {
  const norm = filename.toLowerCase();
  if (norm.includes("tess") || norm.includes("tic")) {
    return {
      label: "TESS",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
    };
  }
  if (norm.includes("k2")) {
    return {
      label: "K2",
      badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    };
  }
  if (norm.includes("kepler") || norm.includes("kic")) {
    return {
      label: "Kepler",
      badgeClass: "bg-stone-100 text-stone-800 border-stone-300",
    };
  }
  return {
    label: "FITS",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
  };
}

function InlineSparkline({ detected, depth }: { detected?: boolean | null; depth?: number | null }) {
  const hasDip = Boolean(detected && depth && depth > 0);
  const dipDepth = hasDip ? Math.min(7, Math.max(3, Math.round((depth ?? 0.01) * 300))) : 1;
  return (
    <svg className="h-4 w-12 shrink-0" viewBox="0 0 48 16" fill="none" aria-hidden="true">
      <path
        d={`M 0 7 L 16 7 Q 22 7 24 ${7 + dipDepth} Q 26 7 32 7 L 48 7`}
        stroke={hasDip ? "#d97706" : "#94a3b8"}
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
    <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10 text-[#090D0F]">
      {/* Editorial Header */}
      <header className="border-b border-[#090D0F]/10 pb-8 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            <span>Research Workspace</span>
            <span className="text-zinc-400">/</span>
            <span>Observatory Registry</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#090D0F] tracking-tight">
            Welcome back, {user?.display_name || "Researcher"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 font-sans max-w-xl leading-relaxed">
            Photometric transit screening and astrophysical candidate registries.
          </p>
        </div>

        {/* Primary Research Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded border border-[#090D0F]/20 text-[#090D0F] text-xs font-medium hover:border-[#090D0F]/40 hover:bg-[#090D0F]/[0.02] transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5 text-zinc-500" />
            <span>Kepler-10b Demo</span>
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#090D0F] text-[#F7F5EF] text-xs font-semibold hover:bg-[#1E293B] transition-colors"
          >
            <Telescope className="w-3.5 h-3.5" />
            <span>Analyze Observation</span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
          </Link>
        </div>
      </header>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <DashboardError message={error} retry={() => void load()} />
      ) : page.total === 0 ? (
        <DashboardEmpty />
      ) : (
        <div className="space-y-10">
          {/* Editorial Statistics Row (Strict Requirement: NO KPI Cards) */}
          <section
            className="border-b border-[#090D0F]/10 pb-6 text-sm font-sans"
            aria-label="Workspace overview statistics"
          >
            <div className="flex flex-wrap items-baseline gap-y-3 gap-x-6 sm:gap-x-10 text-xs sm:text-sm text-zinc-600 font-mono">
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-medium text-[#090D0F] mr-2">
                  {page.counts.total}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Analyses
                </span>
              </div>
              <span className="text-zinc-300 font-light select-none">|</span>
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-medium text-emerald-700 mr-2">
                  {page.counts.completed}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Completed
                </span>
              </div>
              <span className="text-zinc-300 font-light select-none">|</span>
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-medium text-amber-700 mr-2">
                  {page.counts.processing}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Processing
                </span>
              </div>
              <span className="text-zinc-300 font-light select-none">|</span>
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-medium text-zinc-600 mr-2">
                  {page.counts.failed}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Flagged
                </span>
              </div>
              {candidateCount > 0 && (
                <>
                  <span className="text-zinc-300 font-light select-none">|</span>
                  <div className="text-amber-800">
                    <span className="font-serif text-2xl sm:text-3xl font-medium text-signal mr-2">
                      {candidateCount}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-amber-800">
                      Candidates
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Active In-Flight Analyses (If processing) */}
          {active.length > 0 && (
            <section aria-labelledby="active-heading" className="border border-amber-300/60 bg-amber-50/40 rounded p-5">
              <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-amber-900">
                <LoaderCircle className="w-3.5 h-3.5 animate-spin text-signal" />
                <h2 id="active-heading">Active Pipeline Operations ({active.length})</h2>
              </div>
              <div className="divide-y divide-amber-200/50">
                {active.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs font-sans">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-[#090D0F]">{item.filename}</span>
                      <span className="text-zinc-500 font-mono text-[11px]">
                        {stageLabels[item.stage] ?? "Processing"}
                        {item.processing_started_at ? ` · started ${formatTimestamp(item.processing_started_at)}` : ""}
                      </span>
                    </div>
                    <Link
                      href={`/results/${item.id}`}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-900 font-medium hover:underline underline-offset-2"
                    >
                      <span>Inspect Progress</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Observation Registry (Clean Research Table, No Heavy Container Box) */}
          <section aria-labelledby="registry-heading">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 pb-4 border-b border-[#090D0F]/10 mb-4">
              <div>
                <h2 id="registry-heading" className="font-serif text-xl sm:text-2xl font-medium text-[#090D0F]">
                  Observation Registry
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Calibrated stellar time-series, BLS period searches, and Random Forest classifications
                </p>
              </div>

              {/* Editorial Filter Tabs & Refresh */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded border border-[#090D0F]/15 bg-white p-0.5 text-xs font-mono">
                  {(
                    [
                      { id: "all", label: "All", count: page.items.length },
                      { id: "candidate", label: "Candidates", count: candidateCount },
                      { id: "processing", label: "Processing", count: page.counts.processing },
                      { id: "failed", label: "Flagged", count: page.counts.failed },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilter(tab.id)}
                      className={`px-3 py-1 rounded text-[11px] transition-colors ${
                        filter === tab.id
                          ? "bg-[#090D0F] text-[#F7F5EF] font-medium"
                          : "text-zinc-600 hover:text-[#090D0F]"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void load()}
                  aria-label="Refresh analyses"
                  className="p-1.5 rounded border border-[#090D0F]/15 bg-white text-zinc-600 hover:text-[#090D0F] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scientific Registry Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-[#090D0F]/10 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    <th className="py-3 pr-4 font-medium">Observation Target</th>
                    <th className="py-3 pr-4 font-medium">Signal</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Classification</th>
                    <th className="py-3 pr-4 font-medium font-mono text-right">Period (P)</th>
                    <th className="py-3 pr-4 font-medium font-mono text-right">Depth (δ)</th>
                    <th className="py-3 pr-4 font-medium font-mono text-right">Model Score</th>
                    <th className="py-3 pr-4 font-medium">Updated</th>
                    <th className="py-3 text-right font-medium">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#090D0F]/05">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-zinc-500 font-mono text-xs">
                        No photometric observations found matching this filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const mission = missionFromFilename(item.filename);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-black/[0.02] transition-colors group"
                        >
                          {/* Target Column */}
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[9px] font-mono font-medium uppercase ${mission.badgeClass}`}
                              >
                                {mission.label}
                              </span>
                              <span className="font-medium text-[#090D0F]">
                                {item.filename}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                              ID: {item.id.slice(0, 16)}…
                            </div>
                          </td>

                          {/* Sparkline Column */}
                          <td className="py-3.5 pr-4">
                            <InlineSparkline
                              detected={item.candidate_detected}
                              depth={item.depth}
                            />
                          </td>

                          {/* Status Badge Column */}
                          <td className="py-3.5 pr-4">
                            <StatusBadge
                              status={
                                item.status === "completed"
                                  ? item.candidate_detected
                                    ? "candidate"
                                    : "non-detection"
                                  : item.status === "processing"
                                  ? "processing"
                                  : "failed"
                              }
                            />
                          </td>

                          {/* Classification Column */}
                          <td className="py-3.5 pr-4 text-zinc-700">
                            {candidateLabel(item)}
                          </td>

                          {/* Period (P) Column */}
                          <td className="py-3.5 pr-4 font-mono text-right text-zinc-800">
                            {formatNumber(item.period_days, 4, " d")}
                          </td>

                          {/* Depth (δ) Column */}
                          <td className="py-3.5 pr-4 font-mono text-right text-zinc-800">
                            {formatDepth(item.depth)}
                          </td>

                          {/* Model Score Column */}
                          <td className="py-3.5 pr-4 font-mono text-right font-medium text-signal">
                            {item.model_score === null
                              ? "—"
                              : `${(item.model_score * 100).toFixed(1)}%`}
                          </td>

                          {/* Timestamp Column */}
                          <td className="py-3.5 pr-4 text-zinc-500 font-mono text-[11px]">
                            <time dateTime={item.updated_at}>
                              {formatTimestamp(item.updated_at)}
                            </time>
                          </td>

                          {/* Action Link Column */}
                          <td className="py-3.5 text-right font-mono text-xs">
                            <Link
                              href={`/results/${item.id}`}
                              className="inline-flex items-center gap-1 text-[#090D0F] font-medium hover:underline underline-offset-4"
                            >
                              <span>{item.status === "completed" ? "Inspect" : "Status"}</span>
                              <ArrowRight className="w-3 h-3 text-zinc-400" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <footer className="mt-6 flex items-center justify-between border-t border-[#090D0F]/10 pt-4 text-xs font-mono text-zinc-500">
              <p>
                Showing {filteredItems.length} of {page.total} registered observations
              </p>
              {hasMore && (
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void load(page.items.length, true)}
                  className="inline-flex items-center gap-1.5 rounded border border-[#090D0F]/20 px-3 py-1.5 text-xs text-[#090D0F] hover:bg-black/[0.04] transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading records…</span>
                    </>
                  ) : (
                    <>
                      <span>Load older observations</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" role="status" aria-live="polite">
      <span className="sr-only">Loading research workspace…</span>
      <div className="h-10 w-80 bg-zinc-200/70 rounded" />
      <div className="h-6 w-96 bg-zinc-200/50 rounded" />
      <div className="h-72 border border-[#090D0F]/10 bg-white/60 rounded" />
    </div>
  );
}

function DashboardError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <section className="border border-red-200 bg-red-50/50 rounded p-8 text-center" role="alert">
      <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" aria-hidden="true" />
      <h2 className="font-serif text-lg font-medium text-red-950">Unable to load research records</h2>
      <p className="mt-1 text-xs text-red-800/80 max-w-md mx-auto leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-5 inline-flex items-center gap-1.5 rounded border border-red-300 bg-white px-4 py-2 text-xs font-medium text-red-900 hover:bg-red-50 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Try again</span>
      </button>
    </section>
  );
}

function DashboardEmpty() {
  return (
    <section
      className="border border-[#090D0F]/10 bg-white p-12 text-center rounded"
      aria-labelledby="empty-heading"
    >
      <div className="max-w-md mx-auto">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#F7F5EF] text-[#090D0F] mx-auto mb-4 border border-[#090D0F]/10">
          <Compass className="w-5 h-5" aria-hidden="true" />
        </div>
        <h2 id="empty-heading" className="font-serif text-2xl font-normal text-[#090D0F]">
          Begin Your First Observation
        </h2>
        <p className="mt-2 text-xs text-zinc-600 leading-relaxed font-sans">
          Query calibrated Kepler or TESS light curves directly from NASA MAST,
          or upload your own FITS/CSV photometric time-series.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#090D0F] text-[#F7F5EF] text-xs font-semibold hover:bg-[#1E293B] transition-colors"
          >
            <span>Analyze Observation</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded border border-[#090D0F]/20 text-[#090D0F] text-xs font-medium hover:border-[#090D0F]/40 transition-colors"
          >
            <span>Explore Kepler-10b Demo</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
