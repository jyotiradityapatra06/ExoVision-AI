"use client";

import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, Download, FileText, FlaskConical, LoaderCircle, RefreshCw, Search, Telescope } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { api, ApiError } from "@/lib/api";
import type { AnalysisHistoryPage, AnalysisSummaryItem } from "@/types/api";

const PAGE_SIZE = 24;
const emptyPage: AnalysisHistoryPage = { items: [], counts: { total: 0, completed: 0, processing: 0, failed: 0 }, total: 0, limit: PAGE_SIZE, offset: 0 };
type CandidateFilter = "all" | "candidate" | "no-candidate";

function missionFromFilename(filename: string) {
  const normalized = filename.toLowerCase();
  if (normalized.includes("tess") || normalized.includes("tic")) return "TESS";
  if (normalized.includes("k2")) return "K2";
  if (normalized.includes("kepler") || normalized.includes("kic")) return "Kepler";
  return "Independent";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function safeFilename(filename: string) {
  return filename.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9_-]+/gi, "_");
}

export default function ReportsPage() { return <ProtectedRoute><ReportsArchive /></ProtectedRoute>; }

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
      setPage((current) => ({ ...response, items: append ? [...current.items, ...response.items.filter((item) => !current.items.some((existing) => existing.id === item.id))] : response.items }));
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 0 ? "The ExoVision API could not be reached. Check the service and try again." : "The scientific archive could not be loaded safely. Please try again.");
    } finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => {
    let active = true;
    api.dashboardHistory(PAGE_SIZE, 0)
      .then((response) => { if (active) setPage(response); })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError && caught.status === 0 ? "The ExoVision API could not be reached. Check the service and try again." : "The scientific archive could not be loaded safely. Please try again.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const completed = useMemo(() => page.items.filter((item) => item.status === "completed"), [page.items]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return completed.filter((item) => {
      const matchesQuery = !query || item.filename.toLowerCase().includes(query) || item.id.toLowerCase().includes(query) || (item.classification ?? "").toLowerCase().includes(query);
      const matchesFilter = filter === "all" || (filter === "candidate" ? item.candidate_detected === true : item.candidate_detected === false);
      return matchesQuery && matchesFilter;
    });
  }, [completed, filter, search]);
  const candidateCount = completed.filter((item) => item.candidate_detected === true).length;
  const hasMore = page.items.length < page.total;

  async function handleDownload(item: AnalysisSummaryItem) {
    setDownloadingId(item.id); setDownloadError(null);
    try {
      await api.generateReport(item.id);
      const blob = await api.downloadReport(item.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `${safeFilename(item.filename)}_scientific_report.pdf`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch (caught) {
      setDownloadError(caught instanceof ApiError ? caught.message : "The scientific PDF could not be prepared.");
    } finally { setDownloadingId(null); }
  }

  function exportBibtex(item: AnalysisSummaryItem) {
    const year = new Date(item.updated_at).getFullYear();
    const bibtex = `@misc{exovision_${item.id.slice(0, 8)},\n  title={Candidate Analysis Report for ${item.filename}},\n  author={{ExoVision AI Candidate-Screening Pipeline}},\n  year={${year}},\n  howpublished={ExoVision AI analysis platform},\n  url={${window.location.origin}/results/${item.id}}\n}`;
    const url = URL.createObjectURL(new Blob([bibtex], { type: "application/x-bibtex" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${safeFilename(item.filename)}_citation.bib`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }

  return <main className="app-workspace reports-workspace">
    <header className="reports-header"><div><p className="workspace-kicker">Research outputs</p><h1>Scientific Archive</h1><p>Review completed candidate-screening runs and prepare reproducible evidence packages from persisted results.</p></div><Link href="/upload" className="dashboard-primary-action"><Telescope aria-hidden="true" /> Analyze Observation</Link></header>
    {loading ? <ReportsSkeleton /> : error ? <ReportsError message={error} retry={() => void load()} /> : page.counts.completed === 0 ? <ReportsEmpty /> : <>
      <section className="reports-metrics" aria-label="Archive summary">
        <article><p>Completed analyses</p><strong>{page.counts.completed}</strong><span>Available for report generation</span></article>
        <article><p>Candidates in view</p><strong>{candidateCount}</strong><span>Within {completed.length} loaded records</span></article>
        <article><p>Archive coverage</p><strong>{completed.length}<small> / {page.counts.completed}</small></strong><span>Completed records currently loaded</span></article>
        <article><p>Latest evidence</p><strong className="reports-date-value">{completed[0] ? formatDate(completed[0].updated_at) : "—"}</strong><span>Most recently updated record</span></article>
      </section>
      <section className="reports-archive" aria-labelledby="archive-heading">
        <header><div><p className="dashboard-section-label">Evidence registry</p><h2 id="archive-heading">Completed analyses</h2><p>PDFs are generated on demand from stored measurements; no scientific calculations are repeated.</p></div><button type="button" onClick={() => void load()} aria-label="Refresh scientific archive"><RefreshCw aria-hidden="true" /></button></header>
        <div className="reports-toolbar"><label><span className="sr-only">Search completed analyses</span><Search aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search target, analysis ID, or classification" /></label><div role="group" aria-label="Filter candidate status">{([["all", "All"], ["candidate", "Candidate"], ["no-candidate", "No candidate"]] as const).map(([value, label]) => <button type="button" key={value} className={filter === value ? "is-active" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
        {downloadError && <div className="reports-inline-error" role="alert"><AlertCircle aria-hidden="true" /><span>{downloadError}</span><button type="button" onClick={() => setDownloadError(null)}>Dismiss</button></div>}
        {filtered.length ? <div className="reports-grid">{filtered.map((item) => <ReportCard item={item} busy={downloadingId !== null} downloading={downloadingId === item.id} download={() => void handleDownload(item)} exportCitation={() => exportBibtex(item)} key={item.id} />)}</div> : <div className="reports-no-match"><Search aria-hidden="true" /><h3>No matching evidence records</h3><p>Adjust the search or candidate filter to restore completed analyses.</p><button type="button" onClick={() => { setSearch(""); setFilter("all"); }}>Clear filters</button></div>}
        <footer><p>Showing {filtered.length} matching records from {completed.length} loaded</p>{hasMore && <button type="button" disabled={loadingMore} onClick={() => void load(page.items.length, true)}>{loadingMore ? <><LoaderCircle className="animate-spin" aria-hidden="true" /> Loading</> : <>Load more analyses <ArrowRight aria-hidden="true" /></>}</button>}</footer>
      </section>
    </>}
  </main>;
}

function ReportCard({ item, busy, downloading, download, exportCitation }: { item: AnalysisSummaryItem; busy: boolean; downloading: boolean; download: () => void; exportCitation: () => void }) {
  const candidate = item.candidate_detected === true;
  return <article className="report-card"><header><span className="report-document-icon"><FileText aria-hidden="true" /></span><div><p>{missionFromFilename(item.filename)} observation</p><h3 title={item.filename}>{item.filename}</h3><code title={item.id}>EV-{item.id.slice(0, 8).toUpperCase()}</code></div><span className={`app-status ${candidate ? "app-status-info" : "app-status-complete"}`}>{candidate ? "Candidate" : "No candidate"}</span></header><dl><div><dt>Classification</dt><dd>{item.classification ?? (candidate ? "Candidate detected" : "No candidate detected")}</dd></div><div><dt>Model score</dt><dd title="Classifier output used for candidate screening; not confirmation probability.">{item.model_score === null ? "—" : `${(item.model_score * 100).toFixed(1)}%`}</dd></div><div><dt>Period</dt><dd>{item.period_days === null ? "—" : `${item.period_days.toFixed(4)} d`}</dd></div><div><dt>Transit depth</dt><dd>{item.depth === null ? "—" : `${(item.depth * 100).toFixed(4)}%`}</dd></div></dl><div className="report-card-provenance"><CheckCircle2 aria-hidden="true" /><span>Completed {formatDate(item.updated_at)}</span><span>Persisted pipeline evidence</span></div><footer><Link href={`/results/${item.id}`}>Inspect result <ArrowRight aria-hidden="true" /></Link><button type="button" onClick={exportCitation} aria-label={`Export BibTeX citation for ${item.filename}`} title="Export BibTeX citation"><BookOpen aria-hidden="true" /></button><button className="report-download" type="button" disabled={busy} onClick={download}>{downloading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}{downloading ? "Preparing PDF" : "Generate PDF"}</button></footer></article>;
}

function ReportsSkeleton() { return <div className="reports-loading" role="status" aria-live="polite"><span className="sr-only">Loading scientific archive</span><div className="reports-metrics">{[0, 1, 2, 3].map((item) => <div className="skeleton-line h-32" key={item} />)}</div><div className="reports-grid">{[0, 1, 2].map((item) => <div className="skeleton-line h-80" key={item} />)}</div></div>; }
function ReportsError({ message, retry }: { message: string; retry: () => void }) { return <section className="dashboard-state" role="alert"><AlertCircle aria-hidden="true" /><h2>Unable to open the scientific archive</h2><p>{message}</p><button type="button" onClick={retry}><RefreshCw aria-hidden="true" /> Try again</button></section>; }
function ReportsEmpty() { return <section className="observatory-empty reports-evidence-empty"><div className="evidence-document-visual" aria-hidden="true"><span><FileText /></span><i /><i /><i /></div><div className="observatory-empty-copy"><p className="dashboard-section-label">Evidence repository</p><h2>No completed evidence records yet.</h2><p>Completed analyses become archive records here. Scientific PDFs are generated on demand from persisted measurements without rerunning the pipeline.</p><div><Link href="/upload" className="dashboard-primary-action">Analyze Observation <ArrowRight aria-hidden="true" /></Link><Link href="/demo" className="dashboard-secondary-action"><FlaskConical aria-hidden="true" /> Explore Demo</Link></div></div><ol className="observatory-empty-steps" aria-label="Report workflow"><li><span><b>01</b><strong>Complete analysis</strong><small>Produce a persisted scientific result</small></span></li><li><span><b>02</b><strong>Review evidence</strong><small>Inspect candidate measurements and caveats</small></span></li><li><span><b>03</b><strong>Generate report</strong><small>Export PDF and BibTeX on demand</small></span></li></ol></section>; }
