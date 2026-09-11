"use client";

import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Download,
  FileDown,
  FlaskConical,
  LoaderCircle,
  RefreshCw,
  Search,
  Telescope,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { api, ApiError } from "@/lib/api";
import type { AnalysisHistoryPage, AnalysisSummaryItem } from "@/types/api";

const PAGE_SIZE = 24;
const emptyPage: AnalysisHistoryPage = {
  items: [],
  counts: { total: 0, completed: 0, processing: 0, failed: 0 },
  total: 0,
  limit: PAGE_SIZE,
  offset: 0,
};

type CandidateFilter = "all" | "candidate" | "no-candidate";

function missionFromFilename(filename: string) {
  const normalized = filename.toLowerCase();
  if (normalized.includes("tess") || normalized.includes("tic")) return "TESS";
  if (normalized.includes("k2")) return "K2";
  if (normalized.includes("kepler") || normalized.includes("kic")) return "Kepler";
  return "FITS";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function safeFilename(filename: string) {
  return filename.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9_-]+/gi, "_");
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsArchive />
    </ProtectedRoute>
  );
}

function ReportsArchive() {
  const [page, setPage] = useState<AnalysisHistoryPage>(emptyPage);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CandidateFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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
          : "The scientific archive could not be loaded safely. Please try again.",
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
              : "The scientific archive could not be loaded safely. Please try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const completed = useMemo(
    () => page.items.filter((item) => item.status === "completed"),
    [page.items],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return completed.filter((item) => {
      const matchesQuery =
        !query ||
        item.filename.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        (item.classification ?? "").toLowerCase().includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "candidate" ? item.candidate_detected === true : item.candidate_detected === false);
      return matchesQuery && matchesFilter;
    });
  }, [completed, filter, search]);

  const candidateCount = completed.filter((item) => item.candidate_detected === true).length;
  const hasMore = page.items.length < page.total;

  async function handleDownload(item: AnalysisSummaryItem) {
    setDownloadingId(item.id);
    setDownloadError(null);
    try {
      await api.generateReport(item.id);
      const blob = await api.downloadReport(item.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${safeFilename(item.filename)}_scientific_report.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setDownloadError(caught instanceof ApiError ? caught.message : "The scientific PDF could not be prepared.");
    } finally {
      setDownloadingId(null);
    }
  }

  function exportBibtex(item: AnalysisSummaryItem) {
    const year = new Date(item.updated_at).getFullYear();
    const bibtex = `@misc{exovision_${item.id.slice(0, 8)},\n  title={Candidate Analysis Report for ${item.filename}},\n  author={{ExoVision AI Candidate-Screening Pipeline}},\n  year={${year}},\n  howpublished={ExoVision AI Research Platform},\n  url={${typeof window !== "undefined" ? window.location.origin : ""}/results/${item.id}}\n}`;
    const url = URL.createObjectURL(new Blob([bibtex], { type: "application/x-bibtex" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(item.filename)}_citation.bib`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10 text-[#090D0F]">
      {/* Editorial Header */}
      <header className="border-b border-[#090D0F]/10 pb-8 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            <span>Research Repository</span>
            <span className="text-zinc-400">/</span>
            <span>Reports & Citations</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#090D0F] tracking-tight">
            Scientific Reports Catalogue
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 font-sans max-w-2xl leading-relaxed">
            Review completed candidate-screening analyses. Download publication-ready PDF evidence packages
            and export BibTeX citation records on demand.
          </p>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#090D0F] text-[#F7F5EF] text-xs font-semibold hover:bg-[#1E293B] transition-colors"
        >
          <Telescope className="w-3.5 h-3.5" />
          <span>Analyze Observation</span>
          <ArrowRight className="w-3 h-3 text-zinc-400" />
        </Link>
      </header>

      {loading ? (
        <ReportsSkeleton />
      ) : error ? (
        <ReportsError message={error} retry={() => void load()} />
      ) : page.counts.completed === 0 ? (
        <ReportsEmpty />
      ) : (
        <div className="space-y-8">
          {/* Editorial Statistics Strip (NO 4 KPI cards) */}
          <section className="border-b border-[#090D0F]/10 pb-6 text-xs font-mono text-zinc-600">
            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
              <div>
                <span className="font-serif text-2xl font-medium text-[#090D0F] mr-2">
                  {page.counts.completed}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Completed Analyses
                </span>
              </div>
              <span className="text-zinc-300 font-light">|</span>
              <div>
                <span className="font-serif text-2xl font-medium text-signal mr-2">
                  {candidateCount}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Candidates Flagged
                </span>
              </div>
              <span className="text-zinc-300 font-light">|</span>
              <div>
                <span className="text-zinc-700 text-xs">
                  Latest: {completed[0] ? formatDate(completed[0].updated_at) : "—"}
                </span>
              </div>
            </div>
          </section>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search input */}
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by target, analysis ID, or classification"
                className="w-full h-10 pl-10 pr-4 rounded border border-[#090D0F]/15 bg-white text-xs text-[#090D0F] placeholder:text-zinc-400 focus:outline-none focus:border-[#090D0F] transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded border border-[#090D0F]/15 bg-white p-0.5 text-xs font-mono">
                {(
                  [
                    ["all", "All Records"],
                    ["candidate", "Candidates Only"],
                    ["no-candidate", "Non-Detections"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`px-3 py-1 rounded text-[11px] transition-colors ${
                      filter === value
                        ? "bg-[#090D0F] text-[#F7F5EF] font-medium"
                        : "text-zinc-600 hover:text-[#090D0F]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void load()}
                aria-label="Refresh archive"
                className="p-2 rounded border border-[#090D0F]/15 bg-white text-zinc-600 hover:text-[#090D0F] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {downloadError && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-900 text-xs flex items-center justify-between">
              <span>{downloadError}</span>
              <button
                type="button"
                onClick={() => setDownloadError(null)}
                className="text-xs font-mono underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Scientific Research Catalogue Table (NO CARD GALLERIES!) */}
          <section aria-labelledby="catalogue-table-heading">
            <div className="overflow-x-auto border border-[#090D0F]/10 bg-white rounded">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-[#090D0F]/10 text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-[#FAF9F5]">
                    <th className="py-3 px-4 font-medium">Observation Target</th>
                    <th className="py-3 px-4 font-medium">Classification</th>
                    <th className="py-3 px-4 font-medium font-mono text-right">Period (P)</th>
                    <th className="py-3 px-4 font-medium font-mono text-right">Depth (δ)</th>
                    <th className="py-3 px-4 font-medium font-mono text-right">Model Score</th>
                    <th className="py-3 px-4 font-medium">Date Completed</th>
                    <th className="py-3 px-4 text-right font-medium">Deliverables</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#090D0F]/05">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                        No completed research reports matching this search criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const mission = missionFromFilename(item.filename);
                      const isCandidate = item.candidate_detected === true;
                      const isDownloading = downloadingId === item.id;
                      return (
                        <tr key={item.id} className="hover:bg-black/[0.02] transition-colors group">
                          {/* Target Column */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="rounded border border-[#090D0F]/10 px-1.5 py-0.5 text-[9px] font-mono font-medium uppercase bg-[#FAF9F5] text-zinc-700">
                                {mission}
                              </span>
                              <span className="font-medium text-[#090D0F]">
                                {item.filename}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block">
                              EV-{item.id.slice(0, 8).toUpperCase()}
                            </span>
                          </td>

                          {/* Classification Column */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                                isCandidate
                                  ? "bg-amber-50 text-amber-900 border border-amber-300"
                                  : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                              }`}
                            >
                              {item.classification ?? (isCandidate ? "Candidate" : "Non-Detection")}
                            </span>
                          </td>

                          {/* Period (P) Column */}
                          <td className="py-3.5 px-4 font-mono text-right text-zinc-800 whitespace-nowrap">
                            {item.period_days === null ? "—" : `${item.period_days.toFixed(4)} d`}
                          </td>

                          {/* Depth (δ) Column */}
                          <td className="py-3.5 px-4 font-mono text-right text-zinc-800 whitespace-nowrap">
                            {item.depth === null ? "—" : `${(item.depth * 100).toFixed(4)}%`}
                          </td>

                          {/* Model Score Column */}
                          <td className="py-3.5 px-4 font-mono text-right text-signal font-medium whitespace-nowrap">
                            {item.model_score === null ? "—" : `${(item.model_score * 100).toFixed(1)}%`}
                          </td>

                          {/* Date Completed Column */}
                          <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                            {formatDate(item.updated_at)}
                          </td>

                          {/* Actions Column */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <Link
                                href={`/results/${item.id}`}
                                className="px-2.5 py-1 rounded border border-[#090D0F]/15 font-mono text-[11px] text-[#090D0F] hover:bg-black/[0.03] transition-colors"
                              >
                                Inspect
                              </Link>
                              <button
                                type="button"
                                onClick={() => exportBibtex(item)}
                                title="Export BibTeX citation file"
                                className="p-1.5 rounded border border-[#090D0F]/15 text-zinc-600 hover:text-[#090D0F] hover:bg-black/[0.03] transition-colors"
                              >
                                <BookOpen className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDownload(item)}
                                disabled={isDownloading}
                                title="Download PDF Research Report"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#090D0F] text-[#F7F5EF] font-mono text-[11px] font-medium hover:bg-[#1E293B] disabled:opacity-50 transition-colors"
                              >
                                {isDownloading ? (
                                  <>
                                    <LoaderCircle className="w-3 h-3 animate-spin text-signal" />
                                    <span>Compiling…</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3 h-3" />
                                    <span>PDF</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <footer className="mt-4 flex items-center justify-between pt-2 text-xs font-mono text-zinc-500">
              <p>
                Showing {filtered.length} matching records from {completed.length} loaded
              </p>
              {hasMore && (
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void load(page.items.length, true)}
                  className="inline-flex items-center gap-1.5 rounded border border-[#090D0F]/15 px-3 py-1.5 text-xs text-[#090D0F] hover:bg-black/[0.03] transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading analyses…</span>
                    </>
                  ) : (
                    <>
                      <span>Load more analyses</span>
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

function ReportsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status">
      <span className="sr-only">Loading scientific archive…</span>
      <div className="h-10 w-72 bg-zinc-200/60 rounded" />
      <div className="h-64 border border-[#090D0F]/10 bg-white/60 rounded" />
    </div>
  );
}

function ReportsError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <section className="border border-red-200 bg-red-50 p-8 rounded text-center" role="alert">
      <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" aria-hidden="true" />
      <h2 className="font-serif text-lg text-red-950 font-medium">Unable to Open Scientific Archive</h2>
      <p className="text-xs text-red-800/80 max-w-md mx-auto mt-1 mb-4 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={retry}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-red-300 bg-white text-xs font-medium text-red-900 hover:bg-red-50"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try again</span>
      </button>
    </section>
  );
}

function ReportsEmpty() {
  return (
    <section className="border border-[#090D0F]/10 bg-white rounded p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full border border-[#090D0F]/10 bg-[#FAF9F5] flex items-center justify-center mx-auto mb-4 text-[#090D0F]">
          <FileDown className="w-5 h-5" />
        </div>
        <h2 className="font-serif text-2xl font-normal text-[#090D0F]">
          No Completed Reports Yet
        </h2>
        <p className="mt-2 text-xs text-zinc-500 font-sans leading-relaxed">
          Completed analyses become archived records here. Publication-grade PDF dossiers and BibTeX
          citations are compiled deterministically on demand without repeating calculations.
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded border border-[#090D0F]/20 text-xs font-medium hover:border-[#090D0F]/40 transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5 text-zinc-500" />
            <span>Explore Demo</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
