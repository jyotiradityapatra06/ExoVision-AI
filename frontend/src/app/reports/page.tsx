"use client";

import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Download,
  FileCheck2,
  FileText,
  FlaskConical,
  LoaderCircle,
  MinusCircle,
  Orbit,
  RefreshCw,
  Search,
  Sparkles,
  Telescope,
  X,
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
type MissionFilter = "all" | "Kepler" | "TESS" | "K2" | "Independent";

function missionFromFilename(filename: string): "Kepler" | "TESS" | "K2" | "Independent" {
  const normalized = filename.toLowerCase();
  if (normalized.includes("tess") || normalized.includes("tic")) return "TESS";
  if (normalized.includes("k2")) return "K2";
  if (normalized.includes("kepler") || normalized.includes("kic") || normalized.includes("kplr")) return "Kepler";
  return "Independent";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value.slice(0, 10);
  }
}

function safeFilename(filename: string) {
  return filename.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9_-]+/gi, "_");
}

function formatPeriod(days: number | null): string {
  if (days === null || !Number.isFinite(days)) return "—";
  return `${days.toFixed(4)} d`;
}

function formatDepth(depth: number | null): string {
  if (depth === null || !Number.isFinite(depth)) return "—";
  return `${(depth * 100).toFixed(4)}%`;
}

function formatSnr(snr: number | null): string {
  if (snr === null || !Number.isFinite(snr)) return "—";
  return snr.toFixed(2);
}

function formatModelScore(score: number | null): string {
  if (score === null || !Number.isFinite(score)) return "—";
  return `${(score * 100).toFixed(1)}%`;
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ScientificArchiveContent />
    </ProtectedRoute>
  );
}

function ScientificArchiveContent() {
  const [page, setPage] = useState<AnalysisHistoryPage>(emptyPage);
  const [search, setSearch] = useState("");
  const [candidateFilter, setCandidateFilter] = useState<CandidateFilter>("all");
  const [missionFilter, setMissionFilter] = useState<MissionFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async (offset = 0, append = false) => {
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
                (item) => !current.items.some((existing) => existing.id === item.id)
              ),
            ]
          : response.items,
      }));
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 0
          ? "The ExoVision API could not be reached. Check the service connection and try again."
          : "The scientific archive could not be retrieved safely. Please try again."
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
        if (active) {
          setError(
            caught instanceof ApiError && caught.status === 0
              ? "The ExoVision API could not be reached. Check the service connection and try again."
              : "The scientific archive could not be retrieved safely. Please try again."
          );
        }
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
    [page.items]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return completed.filter((item) => {
      const matchesQuery =
        !query ||
        item.filename.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        (item.classification ?? "").toLowerCase().includes(query);

      const matchesCandidate =
        candidateFilter === "all" ||
        (candidateFilter === "candidate"
          ? item.candidate_detected === true
          : item.candidate_detected === false);

      const itemMission = missionFromFilename(item.filename);
      const matchesMission = missionFilter === "all" || itemMission === missionFilter;

      return matchesQuery && matchesCandidate && matchesMission;
    });
  }, [completed, candidateFilter, missionFilter, search]);

  const candidatesInView = useMemo(
    () => completed.filter((item) => item.candidate_detected === true).length,
    [completed]
  );

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
      setDownloadError(
        caught instanceof ApiError ? caught.message : "The scientific PDF could not be generated."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  function exportBibtex(item: AnalysisSummaryItem) {
    const year = new Date(item.updated_at).getFullYear();
    const bibtex = `@misc{exovision_${item.id.slice(0, 8)},
  title={ExoVision Candidate Screening Evidence Dossier for ${item.filename}},
  author={{ExoVision AI Candidate-Screening Pipeline}},
  year={${year}},
  howpublished={ExoVision AI Analysis Platform},
  note={Analysis ID: ${item.id}; Classification: ${item.classification ?? "Unclassified"}},
  url={${window.location.origin}/results/${item.id}}
}`;
    const url = URL.createObjectURL(new Blob([bibtex], { type: "application/x-bibtex" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(item.filename)}_citation.bib`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <main className="app-workspace min-h-screen bg-[#060913] text-[#d6e0ea] pb-24 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 md:pt-10">
        {/* 1. Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.07] pb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-wider uppercase text-cyan-400">
                <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                SCIENTIFIC ARCHIVE
              </span>
              <span className="text-white/20">/</span>
              <span className="font-mono text-[11px] text-slate-400">RESEARCH OUTPUTS</span>
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">
              Evidence Registry
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
              Review completed screening analyses and retrieve generated scientific reports. Measurements
              and candidate classifications are persisted from automated pipeline execution.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => void loadData(0, false)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono text-slate-300 bg-[#0d1424] hover:bg-[#131d33] border border-white/[0.08] hover:border-cyan-500/30 transition shadow-sm rounded-none min-h-[38px]"
              aria-label="Refresh scientific archive"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-400 ${loading ? "animate-spin text-cyan-400" : ""}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#030712] bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 transition shadow-sm rounded-none min-h-[38px]"
            >
              <Telescope className="h-3.5 w-3.5 text-slate-950" aria-hidden="true" />
              <span>Analyze Observation</span>
            </Link>
          </div>
        </header>

        {/* Dynamic States: Loading, Error, Empty, or Archive Content */}
        {loading && page.items.length === 0 ? (
          <ArchiveLoadingSkeleton />
        ) : error ? (
          <ArchiveErrorState message={error} retry={() => void loadData(0, false)} />
        ) : page.counts.completed === 0 ? (
          <ArchiveEmptyState />
        ) : (
          <div className="mt-8 space-y-8">
            {/* 2. Truthful Metrics Summary Strip */}
            <section
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
              aria-label="Archive summary metrics"
            >
              <article className="bg-[#090e1a]/80 border border-white/[0.06] p-4 flex flex-col justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Completed Analyses
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-semibold text-white tracking-tight">
                    {page.counts.completed.toLocaleString()}
                  </span>
                </div>
                <span className="mt-1 text-[11px] text-slate-500 font-mono">
                  Global user archive total
                </span>
              </article>

              <article className="bg-[#090e1a]/80 border border-white/[0.06] p-4 flex flex-col justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Candidates In View
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-semibold text-cyan-300 tracking-tight">
                    {candidatesInView.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    / {completed.length} loaded
                  </span>
                </div>
                <span className="mt-1 text-[11px] text-slate-500 font-mono">
                  Records loaded on this page
                </span>
              </article>

              <article className="bg-[#090e1a]/80 border border-white/[0.06] p-4 flex flex-col justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Loaded Archive Records
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-semibold text-white tracking-tight">
                    {completed.length}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    of {page.counts.completed}
                  </span>
                </div>
                <span className="mt-1 text-[11px] text-slate-500 font-mono">
                  Pagination buffer status
                </span>
              </article>

              <article className="bg-[#090e1a]/80 border border-white/[0.06] p-4 flex flex-col justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Latest Updated Record
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-base sm:text-lg font-semibold text-slate-200 tracking-tight truncate">
                    {completed[0] ? formatDate(completed[0].updated_at) : "—"}
                  </span>
                </div>
                <span className="mt-1 text-[11px] text-slate-500 font-mono truncate">
                  {completed[0] ? completed[0].filename : "No records"}
                </span>
              </article>
            </section>

            {/* 3. Search & Filter Controls Toolbar */}
            <section
              className="bg-[#0b1120] border border-white/[0.08] p-4 md:p-5 space-y-4"
              aria-label="Archive filters and query toolbar"
            >
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[260px]">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by target filename, analysis ID, or classification..."
                    className="w-full pl-10 pr-4 py-2 text-xs font-mono text-white bg-[#060a14] border border-white/[0.1] focus:border-cyan-400 focus:outline-none placeholder:text-slate-500 placeholder:font-sans transition"
                    aria-label="Search completed analyses"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label="Clear search input"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Segments */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Candidate Status Filter */}
                  <div
                    role="group"
                    aria-label="Filter by candidate detection"
                    className="inline-flex items-center border border-white/[0.08] bg-[#060a14] p-0.5"
                  >
                    {(
                      [
                        ["all", "All Results"],
                        ["candidate", "Candidates Only"],
                        ["no-candidate", "Non-Detections"],
                      ] as const
                    ).map(([val, label]) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setCandidateFilter(val)}
                        className={`px-3 py-1.5 text-xs font-mono transition ${
                          candidateFilter === val
                            ? "bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        aria-pressed={candidateFilter === val}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Mission Filter */}
                  <div className="relative inline-flex items-center">
                    <select
                      value={missionFilter}
                      onChange={(e) => setMissionFilter(e.target.value as MissionFilter)}
                      className="appearance-none bg-[#060a14] border border-white/[0.08] text-xs font-mono text-slate-300 pl-3 pr-8 py-2 focus:border-cyan-400 focus:outline-none transition cursor-pointer"
                      aria-label="Filter by mission provenance"
                    >
                      <option value="all">All Missions</option>
                      <option value="Kepler">Kepler Mission</option>
                      <option value="TESS">TESS Mission</option>
                      <option value="K2">K2 Mission</option>
                      <option value="Independent">Independent Data</option>
                    </select>
                    <ChevronDown
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Scope Bar */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="font-mono">
                    Showing <strong className="text-white">{filtered.length}</strong> matching
                    analyses
                  </span>
                  <span>·</span>
                  <span className="text-slate-500 font-mono">
                    {completed.length} currently loaded buffer
                  </span>
                </div>

                {(search || candidateFilter !== "all" || missionFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCandidateFilter("all");
                      setMissionFilter("all");
                    }}
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono transition text-[11px]"
                  >
                    <X className="h-3 w-3" /> Clear active filters
                  </button>
                )}
              </div>
            </section>

            {/* Download error alert */}
            {downloadError && (
              <div
                className="flex items-center justify-between gap-3 p-3 bg-red-950/40 border border-red-500/30 text-xs text-red-200"
                role="alert"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" aria-hidden="true" />
                  <span>{downloadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDownloadError(null)}
                  className="font-mono underline hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Copy citation feedback toast */}
            {copiedId && (
              <div
                className="flex items-center gap-2 p-2.5 bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200"
                role="status"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>BibTeX citation exported for {copiedId.slice(0, 8)}</span>
              </div>
            )}

            {/* 4. Evidence Registry (Desktop Table View) */}
            {filtered.length === 0 ? (
              <div className="bg-[#090e1a] border border-white/[0.08] p-12 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-500 mb-3" aria-hidden="true" />
                <h3 className="text-base font-medium text-white">No matching evidence records</h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                  No completed analyses match your active search query or filter criteria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCandidateFilter("all");
                    setMissionFilter("all");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono bg-[#121a2c] hover:bg-[#18233c] text-cyan-300 border border-cyan-500/30 transition"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop Registry Table (hidden on small screens) */}
                <div className="hidden lg:block overflow-x-auto border border-white/[0.08] bg-[#070b16]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-[#0b1122] text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                        <th scope="col" className="py-3 px-4">
                          Observation / Target
                        </th>
                        <th scope="col" className="py-3 px-4">
                          Analysis ID
                        </th>
                        <th scope="col" className="py-3 px-4">
                          Classification Outcome
                        </th>
                        <th scope="col" className="py-3 px-3 text-right">
                          <span
                            title="Maximum Random Forest class probability among 4 trained classes."
                            className="cursor-help border-b border-dotted border-slate-500"
                          >
                            Model Score
                          </span>
                        </th>
                        <th scope="col" className="py-3 px-3 text-right">
                          Period
                        </th>
                        <th scope="col" className="py-3 px-3 text-right">
                          Transit Depth
                        </th>
                        <th scope="col" className="py-3 px-3 text-right">
                          SNR
                        </th>
                        <th scope="col" className="py-3 px-4">
                          Completed
                        </th>
                        <th scope="col" className="py-3 px-4 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filtered.map((item) => (
                        <DesktopRegistryRow
                          key={item.id}
                          item={item}
                          busy={downloadingId !== null}
                          downloading={downloadingId === item.id}
                          onDownload={() => void handleDownload(item)}
                          onCitation={() => exportBibtex(item)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Evidence Cards (visible on smaller screens) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3.5">
                  {filtered.map((item) => (
                    <MobileEvidenceCard
                      key={item.id}
                      item={item}
                      busy={downloadingId !== null}
                      downloading={downloadingId === item.id}
                      onDownload={() => void handleDownload(item)}
                      onCitation={() => exportBibtex(item)}
                    />
                  ))}
                </div>

                {/* 5. Pagination Buffer Footer */}
                <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.06] text-xs">
                  <p className="font-mono text-slate-400">
                    Showing <span className="text-white">{filtered.length}</span> matching evidence
                    records of <span className="text-white">{page.counts.completed}</span> total in
                    archive
                  </p>

                  {hasMore && (
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => void loadData(page.items.length, true)}
                      className="inline-flex items-center gap-2 px-4 py-2 font-mono text-xs text-cyan-300 bg-[#0c1424] hover:bg-[#121e36] border border-cyan-500/30 transition shadow-sm disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          Loading more records...
                        </>
                      ) : (
                        <>
                          <span>Load next {PAGE_SIZE} analyses</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </>
                      )}
                    </button>
                  )}
                </footer>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function DesktopRegistryRow({
  item,
  busy,
  downloading,
  onDownload,
  onCitation,
}: {
  item: AnalysisSummaryItem;
  busy: boolean;
  downloading: boolean;
  onDownload: () => void;
  onCitation: () => void;
}) {
  const candidate = item.candidate_detected === true;
  const mission = missionFromFilename(item.filename);

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      {/* 1. Observation Name + Mission */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-wider uppercase border border-white/[0.1] bg-[#0c1322] text-slate-400">
            {mission}
          </span>
          <span
            className="font-medium text-white truncate max-w-[220px] group-hover:text-cyan-200 transition-colors"
            title={item.filename}
          >
            {item.filename}
          </span>
        </div>
      </td>

      {/* 2. Analysis ID */}
      <td className="py-3 px-4 font-mono text-slate-400">
        <code title={item.id} className="text-slate-300 bg-black/40 px-1.5 py-0.5 border border-white/[0.05]">
          {item.id.slice(0, 8)}
        </code>
      </td>

      {/* 3. Classification Outcome */}
      <td className="py-3 px-4">
        <ClassificationBadge
          candidate={candidate}
          classification={item.classification}
        />
      </td>

      {/* 4. Model Score */}
      <td className="py-3 px-3 text-right font-mono tabular-nums">
        {item.model_score !== null ? (
          <span
            className="text-cyan-300 font-semibold cursor-help"
            title="Maximum Random Forest class probability among 4 trained classes."
          >
            {formatModelScore(item.model_score)}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>

      {/* 5. Period */}
      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
        {formatPeriod(item.period_days)}
      </td>

      {/* 6. Depth */}
      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
        {formatDepth(item.depth)}
      </td>

      {/* 7. SNR */}
      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
        {formatSnr(item.transit_snr)}
      </td>

      {/* 8. Completed Date */}
      <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
        {formatDate(item.updated_at)}
      </td>

      {/* 9. Actions */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-2">
          <Link
            href={`/results/${item.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 transition shadow-sm"
          >
            <span>Inspect</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>

          <button
            type="button"
            disabled={busy}
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-[#0e1628] hover:bg-[#152038] border border-white/[0.08] transition shadow-sm disabled:opacity-50"
            title="Generate and download scientific PDF"
          >
            {downloading ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin text-cyan-400" aria-hidden="true" />
            ) : (
              <Download className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            )}
            <span className="hidden xl:inline">{downloading ? "Preparing" : "PDF"}</span>
          </button>

          <button
            type="button"
            onClick={onCitation}
            className="p-1 text-slate-400 hover:text-cyan-300 transition"
            title="Export BibTeX Citation"
            aria-label={`Export BibTeX citation for ${item.filename}`}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function MobileEvidenceCard({
  item,
  busy,
  downloading,
  onDownload,
  onCitation,
}: {
  item: AnalysisSummaryItem;
  busy: boolean;
  downloading: boolean;
  onDownload: () => void;
  onCitation: () => void;
}) {
  const candidate = item.candidate_detected === true;
  const mission = missionFromFilename(item.filename);

  return (
    <article className="bg-[#080d1a] border border-white/[0.08] p-4 flex flex-col justify-between space-y-4">
      <div>
        {/* Header: Mission + Filename + Classification */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider uppercase border border-white/[0.1] bg-[#0d1424] text-slate-400">
              {mission}
            </span>
            <h3 className="mt-1.5 text-sm font-semibold text-white truncate max-w-[200px]" title={item.filename}>
              {item.filename}
            </h3>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">
              ID: <span className="text-slate-400">{item.id.slice(0, 8)}</span>
            </p>
          </div>
          <ClassificationBadge candidate={candidate} classification={item.classification} />
        </div>

        {/* Metrics Grid */}
        <dl className="mt-4 grid grid-cols-3 gap-2 p-2.5 bg-black/30 border border-white/[0.04] text-xs">
          <div>
            <dt className="text-[10px] font-mono uppercase text-slate-500">Period</dt>
            <dd className="mt-0.5 font-mono text-slate-200 tabular-nums">
              {formatPeriod(item.period_days)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono uppercase text-slate-500">Depth</dt>
            <dd className="mt-0.5 font-mono text-slate-200 tabular-nums">
              {formatDepth(item.depth)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-mono uppercase text-slate-500">Score</dt>
            <dd className="mt-0.5 font-mono text-cyan-300 font-semibold tabular-nums">
              {formatModelScore(item.model_score)}
            </dd>
          </div>
        </dl>

        <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>SNR: {formatSnr(item.transit_snr)}</span>
          <span>Completed {formatDate(item.updated_at)}</span>
        </div>
      </div>

      {/* Action Strip */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <Link
          href={`/results/${item.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/60 transition"
        >
          <span>Inspect Result</span>
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCitation}
            className="p-1.5 text-slate-400 hover:text-cyan-300 border border-white/[0.08] bg-[#0c1220] transition"
            title="Export BibTeX citation"
            aria-label={`Export BibTeX citation for ${item.filename}`}
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-200 bg-[#0e1628] hover:bg-[#152038] border border-white/[0.08] transition disabled:opacity-50"
          >
            {downloading ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin text-cyan-400" aria-hidden="true" />
            ) : (
              <Download className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            )}
            <span>{downloading ? "Preparing" : "PDF"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function ClassificationBadge({
  candidate,
  classification,
}: {
  candidate: boolean;
  classification: string | null;
}) {
  const label = classification ?? (candidate ? "Planet Transit Candidate" : "Non-detection");

  if (label === "Planet Transit Candidate") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-medium whitespace-nowrap">
        <Orbit className="h-3 w-3 text-cyan-400 shrink-0" aria-hidden="true" />
        <span>Planet Transit Candidate</span>
      </span>
    );
  }

  if (label === "Eclipsing Binary") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono border border-amber-500/30 bg-amber-950/40 text-amber-300 font-medium whitespace-nowrap">
        <AlertCircle className="h-3 w-3 text-amber-400 shrink-0" aria-hidden="true" />
        <span>Eclipsing Binary</span>
      </span>
    );
  }

  if (label === "Stellar Activity / Star Spots") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono border border-purple-500/30 bg-purple-950/40 text-purple-300 font-medium whitespace-nowrap">
        <Sparkles className="h-3 w-3 text-purple-400 shrink-0" aria-hidden="true" />
        <span>Stellar Activity</span>
      </span>
    );
  }

  if (label === "Noise") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono border border-slate-700 bg-slate-900/60 text-slate-400 whitespace-nowrap">
        <MinusCircle className="h-3 w-3 text-slate-500 shrink-0" aria-hidden="true" />
        <span>Noise</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono border border-zinc-700 bg-zinc-900/60 text-zinc-400 whitespace-nowrap">
      <MinusCircle className="h-3 w-3 text-zinc-500 shrink-0" aria-hidden="true" />
      <span>Non-detection</span>
    </span>
  );
}

function ArchiveLoadingSkeleton() {
  return (
    <div className="mt-8 space-y-8" role="status" aria-live="polite">
      <span className="sr-only">Loading scientific archive records...</span>
      {/* Metric skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="h-24 bg-[#080d1a] border border-white/[0.04] animate-pulse" />
        ))}
      </div>
      {/* Toolbar skeleton */}
      <div className="h-14 bg-[#0a0f1e] border border-white/[0.04] animate-pulse" />
      {/* Table skeleton */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((idx) => (
          <div key={idx} className="h-12 bg-[#070b16] border border-white/[0.04] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ArchiveErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <section
      className="mt-12 max-w-lg mx-auto bg-[#090e1a] border border-red-500/20 p-8 text-center"
      role="alert"
    >
      <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-4" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-white">Unable to open scientific archive</h2>
      <p className="mt-2 text-xs text-slate-400 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-mono text-cyan-300 bg-[#0f172a] hover:bg-[#16223d] border border-cyan-500/30 transition shadow-sm"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Try again</span>
      </button>
    </section>
  );
}

function ArchiveEmptyState() {
  return (
    <section
      className="mt-12 max-w-2xl mx-auto bg-[#080d1a] border border-white/[0.08] p-8 md:p-12 text-center"
      aria-label="Archive empty state"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 mb-6">
        <FileText className="h-7 w-7" aria-hidden="true" />
      </div>

      <p className="font-mono text-[11px] font-medium tracking-wider uppercase text-cyan-400">
        ARCHIVE REPOSITORY
      </p>
      <h2 className="mt-2 text-xl md:text-2xl font-semibold text-white tracking-tight">
        No completed evidence records yet
      </h2>
      <p className="mt-2.5 text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
        Completed candidate-screening analyses are registered here. Scientific PDF reports are
        generated on demand from persisted measurements without rerunning the pipeline.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#030712] bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 transition shadow-sm"
        >
          <span>Analyze Observation</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <Link
          href="/demo"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono text-slate-300 bg-[#0d1424] hover:bg-[#131d33] border border-white/[0.08] transition shadow-sm"
        >
          <FlaskConical className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          <span>Explore Demo Pipeline</span>
        </Link>
      </div>

      <div className="mt-10 pt-8 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="p-3 bg-black/20 border border-white/[0.04]">
          <span className="font-mono text-[10px] text-cyan-400 font-semibold">STAGE 01</span>
          <p className="mt-1 text-xs font-medium text-white">Upload Observation</p>
          <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
            FITS or CSV light curve validation
          </p>
        </div>
        <div className="p-3 bg-black/20 border border-white/[0.04]">
          <span className="font-mono text-[10px] text-cyan-400 font-semibold">STAGE 02</span>
          <p className="mt-1 text-xs font-medium text-white">Pipeline Execution</p>
          <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
            BLS detection & Random Forest screening
          </p>
        </div>
        <div className="p-3 bg-black/20 border border-white/[0.04]">
          <span className="font-mono text-[10px] text-cyan-400 font-semibold">STAGE 03</span>
          <p className="mt-1 text-xs font-medium text-white">Archive & Export</p>
          <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
            Review dossier & generate PDF reports
          </p>
        </div>
      </div>
    </section>
  );
}
