"use client";

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Database,
  FileArchive,
  FileUp,
  FlaskConical,
  LoaderCircle,
  RotateCcw,
  Search,
  Telescope,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PrecisionButton, SegmentedControl } from "@/components/ui";
import { formatFileSize, IntakeStage, intakeError, startObservation } from "@/lib/analysis-intake";
import { api, ApiError } from "@/lib/api";
import type { DatasetSearchResult } from "@/types/api";

type Mission = "all" | "kepler" | "tess";
type SearchState = "initial" | "loading" | "success-with-results" | "success-empty" | "error";

export default function DatasetsPage() {
  return (
    <ProtectedRoute>
      <DatasetExplorer />
    </ProtectedRoute>
  );
}

function missionBadgeStyle(mission: string) {
  const norm = mission.toLowerCase();
  if (norm.includes("tess")) return "border-sky-500/30 text-sky-400 bg-sky-950/40";
  if (norm.includes("k2")) return "border-purple-500/30 text-purple-400 bg-purple-950/40";
  if (norm.includes("kepler")) return "border-amber-500/30 text-amber-400 bg-amber-950/40";
  return "border-zinc-700 text-zinc-400 bg-zinc-800/40";
}

function DatasetExplorer() {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [mission, setMission] = useState<Mission>("all");
  const [results, setResults] = useState<DatasetSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("initial");
  const [importing, setImporting] = useState<string | null>(null);
  const [stage, setStage] = useState<IntakeStage>("idle");
  const [error, setError] = useState<string | null>(null);

  async function search(event: FormEvent) {
    event.preventDefault();
    await runSearch();
  }

  async function runSearch() {
    const normalized = target.trim();
    if (!normalized || searchState === "loading") return;
    setSearchState("loading");
    setError(null);
    setResults([]);
    try {
      const found = await api.searchDatasets(normalized, mission);
      setResults(found);
      setSearchState(found.length > 0 ? "success-with-results" : "success-empty");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 429) {
        if (typeof caught.retryAfter === "number" && caught.retryAfter > 0) {
          setError(
            `MAST search is temporarily rate limited. Please wait ${caught.retryAfter} second${caught.retryAfter === 1 ? "" : "s"} before searching again.`,
          );
        } else {
          setError("MAST search is temporarily rate limited. Wait briefly before searching again.");
        }
      } else if (caught instanceof ApiError) {
        setError(
          caught.status === 0 && caught.message.includes("timed out")
            ? "NASA archive search timed out. The archive did not respond within the allowed time. Try the search again."
            : caught.message,
        );
      } else {
        setError("The MAST archive could not be searched safely.");
      }
      setSearchState("error");
    }
  }

  async function handleObservation(item: DatasetSearchResult) {
    if (importing) return;
    setImporting(item.data_uri);
    setStage("downloading");
    setError(null);
    try {
      const file = await api.downloadDataset(item.data_uri, item.filename);
      const analysisId = await startObservation(file, setStage);
      router.push(`/results/${analysisId}`);
    } catch (caught) {
      setError(intakeError(caught));
      setImporting(null);
      setStage("idle");
    }
  }

  const importLabel =
    stage === "downloading"
      ? "Retrieving observation…"
      : stage === "uploading"
        ? "Uploading observation…"
        : "Starting analysis…";

  return (
    <main className="app-workspace max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] text-cyan-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
            NASA MAST · Public Observations
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
            NASA MAST Explorer
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-sans max-w-2xl">
            Search supported public stellar observations from the Mikulski Archive for Space Telescopes and route compatible light curves into the ExoVision analysis pipeline.
          </p>
        </div>

        {/* Ingestion Source Switcher */}
        <div className="flex items-center shrink-0">
          <SegmentedControl<string>
            value="datasets"
            onChange={(val) => {
              if (val === "upload") router.push("/upload");
              if (val === "demo") router.push("/demo");
            }}
            items={[
              { id: "upload", label: "File Upload", icon: FileUp },
              { id: "datasets", label: "NASA MAST", icon: Database },
              { id: "demo", label: "Synthetic Demo", icon: FlaskConical },
            ]}
          />
        </div>
      </header>

      {/* Archive Search Workspace */}
      <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#0d1015] p-5 sm:p-6 shadow-sm" aria-labelledby="archive-search-heading">
        <header className="pb-4 border-b border-white/[0.06] mb-5">
          <h2 id="archive-search-heading" className="text-sm font-semibold text-white tracking-tight">
            Archive Search
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Query astronomical targets or catalog identifiers across supported missions
          </p>
        </header>

        <form onSubmit={search} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Target Input */}
            <div className="md:col-span-8 lg:col-span-9">
              <label htmlFor="target-input" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                Target or object identifier
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" aria-hidden="true" />
                <input
                  id="target-input"
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. Kepler-10"
                  required
                  maxLength={120}
                  className="w-full rounded-md border border-white/[0.10] bg-[#090b0e] pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-sans"
                />
              </div>
            </div>

            {/* Search Submit Button */}
            <div className="md:col-span-4 lg:col-span-3 flex items-end">
              <PrecisionButton
                type="submit"
                variant="primary"
                size="md"
                disabled={searchState === "loading" || !target.trim()}
                loading={searchState === "loading"}
                className="w-full justify-center text-xs font-semibold h-[38px]"
              >
                <span className="flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{searchState === "loading" ? "Searching…" : "Search Archive"}</span>
                </span>
              </PrecisionButton>
            </div>
          </div>

          {/* Mission Filter Selector */}
          <div className="pt-2 border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Mission:
              </span>
              <SegmentedControl<Mission>
                value={mission}
                onChange={(val) => setMission(val)}
                items={[
                  { id: "all", label: "All Missions" },
                  { id: "kepler", label: "Kepler & K2" },
                  { id: "tess", label: "TESS" },
                ]}
              />
            </div>

            <p className="text-[11px] text-zinc-500 font-mono">
              Search by catalog ID, target name, or TIC number. Independent research tooling.
            </p>
          </div>
        </form>
      </section>

      {/* Inline Non-Fatal Error Alert */}
      {error && searchState !== "error" && (
        <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-md border border-rose-500/30 bg-rose-500/[0.08] p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset Search Results Section */}
      <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#0d1015] p-5 shadow-sm" aria-labelledby="mast-results-heading" aria-live="polite">
        <header className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
          <div>
            <h2 id="mast-results-heading" className="text-sm font-semibold text-white tracking-tight">
              Observation Products
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Public archive light curves compatible with ExoVision candidate screening
            </p>
          </div>

          {(searchState === "success-with-results" || searchState === "success-empty") && (
            <span className="rounded border border-white/[0.10] bg-[#090b0e] px-2.5 py-1 text-[11px] font-mono text-zinc-400">
              {results.length} compatible {results.length === 1 ? "observation" : "observations"}
            </span>
          )}
        </header>

        {/* State: Searching Loading */}
        {searchState === "loading" && (
          <div className="space-y-3 py-4" role="status">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              <span>Querying Mikulski Archive for Space Telescopes…</span>
            </div>
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="h-16 rounded-md border border-white/[0.06] bg-[#090b0e] animate-pulse" />
            ))}
          </div>
        )}

        {/* State: Initial Unsearched */}
        {searchState === "initial" && (
          <div className="py-12 text-center max-w-md mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.10] bg-[#11151b] text-cyan-400 mx-auto mb-4">
              <Database className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-white">Search the MAST Archive</h3>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              Enter a stellar target identifier (e.g. <span className="text-zinc-200 font-mono">Kepler-10</span>) to inspect public light-curve products from Kepler, K2, or TESS.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-500">
              <span className="rounded border border-white/[0.08] px-2 py-0.5">Kepler</span>
              <span className="rounded border border-white/[0.08] px-2 py-0.5">K2</span>
              <span className="rounded border border-white/[0.08] px-2 py-0.5">TESS</span>
            </div>
          </div>
        )}

        {/* State: Error */}
        {searchState === "error" && (
          <div className="py-10 text-center max-w-md mx-auto" role="alert">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/[0.08] text-rose-400 mx-auto mb-4">
              <TriangleAlert className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-white">Archive search unavailable</h3>
            <p className="mt-1.5 text-xs text-rose-300/90 leading-relaxed">
              {error ?? "The archive search could not be completed. The NASA MAST service may be temporarily unavailable."}
            </p>
            <div className="mt-5">
              <PrecisionButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void runSearch()}
              >
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="h-3 w-3" />
                  <span>Retry search</span>
                </span>
              </PrecisionButton>
            </div>
          </div>
        )}

        {/* State: Empty Results */}
        {searchState === "success-empty" && (
          <div className="py-10 text-center max-w-md mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.10] bg-[#11151b] text-zinc-400 mx-auto mb-4">
              <Telescope className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-white">No compatible light curves found</h3>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              No public observations matched <span className="text-white font-mono">&ldquo;{target}&rdquo;</span> under the selected mission criteria. Verify the catalog name, choose all missions, or test with the bundled synthetic demo.
            </p>
            <div className="mt-5">
              <PrecisionButton href="/demo" variant="secondary" size="sm">
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="h-3 w-3 text-purple-400" />
                  <span>Explore Synthetic Demo</span>
                </span>
              </PrecisionButton>
            </div>
          </div>
        )}

        {/* State: Results Display */}
        {searchState === "success-with-results" && (
          <>
            {/* Desktop / Tablet Observation Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    <th className="pb-3 font-medium">Target & Filename</th>
                    <th className="pb-3 font-medium">Mission</th>
                    <th className="pb-3 font-medium">Observation Period</th>
                    <th className="pb-3 font-medium">Product Format</th>
                    <th className="pb-3 font-medium text-right">Pipeline Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {results.map((item) => {
                    const isCurrent = importing === item.data_uri;
                    return (
                      <tr key={item.data_uri} className="transition-colors hover:bg-white/[0.02]">
                        <td className="py-3.5 pr-3 max-w-[280px]">
                          <span className="font-semibold text-zinc-200 block truncate" title={item.target_name}>
                            {item.target_name}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-500 truncate block mt-0.5" title={item.filename}>
                            {item.filename}
                          </span>
                        </td>

                        <td className="py-3.5 pr-3 whitespace-nowrap">
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase ${missionBadgeStyle(item.mission)}`}>
                            {item.mission}
                          </span>
                        </td>

                        <td className="py-3.5 pr-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px]">
                            <CalendarDays className="h-3.5 w-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
                            <span>{item.observation_period}</span>
                          </div>
                        </td>

                        <td className="py-3.5 pr-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
                            <FileArchive className="h-3.5 w-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
                            <span>{item.format} · {formatFileSize(item.size_bytes)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 text-right whitespace-nowrap">
                          <PrecisionButton
                            type="button"
                            variant={isCurrent ? "secondary" : "primary"}
                            size="sm"
                            disabled={importing !== null}
                            loading={isCurrent}
                            onClick={() => void handleObservation(item)}
                            className="font-medium text-xs"
                          >
                            {isCurrent ? (
                              <span>{importLabel}</span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <span>Use Observation</span>
                                <ArrowRight className="h-3 w-3" aria-hidden="true" />
                              </span>
                            )}
                          </PrecisionButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Observation Card List */}
            <div className="md:hidden divide-y divide-white/[0.06]">
              {results.map((item) => {
                const isCurrent = importing === item.data_uri;
                return (
                  <article key={item.data_uri} className="py-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`rounded border px-1.5 py-0.2 text-[9px] font-mono font-medium uppercase ${missionBadgeStyle(item.mission)}`}>
                            {item.mission}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm text-white truncate" title={item.target_name}>
                          {item.target_name}
                        </h3>
                        <p className="font-mono text-[10px] text-zinc-500 truncate mt-0.5" title={item.filename}>
                          {item.filename}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs rounded border border-white/[0.06] bg-[#090b0e] p-2.5">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block">Period</span>
                        <span className="font-mono text-zinc-300 text-[11px] truncate block">{item.observation_period}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block">Product</span>
                        <span className="font-mono text-zinc-300 text-[11px] block">{item.format} · {formatFileSize(item.size_bytes)}</span>
                      </div>
                    </div>

                    <PrecisionButton
                      type="button"
                      variant={isCurrent ? "secondary" : "primary"}
                      size="sm"
                      disabled={importing !== null}
                      loading={isCurrent}
                      onClick={() => void handleObservation(item)}
                      className="w-full justify-center font-medium text-xs"
                    >
                      {isCurrent ? (
                        <span>{importLabel}</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span>Use Observation</span>
                          <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </span>
                      )}
                    </PrecisionButton>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Footer Crosslink */}
      <p className="mt-8 text-center text-xs font-mono text-zinc-500">
        Have your own observation?{" "}
        <Link href="/upload" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">
          Upload a light curve
        </Link>
        , or{" "}
        <Link href="/demo" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">
          run the bundled demo
        </Link>
        .
      </p>
    </main>
  );
}
