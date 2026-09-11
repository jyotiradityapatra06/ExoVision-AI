"use client";

import {
  ArrowRight,
  Calendar,
  Database,
  FileArchive,
  LoaderCircle,
  RotateCcw,
  Search,
  Telescope,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { formatFileSize, IntakeStage, intakeError, startObservation } from "@/lib/analysis-intake";
import { api, ApiError } from "@/lib/api";
import type { DatasetSearchResult } from "@/types/api";

type Mission = "all" | "kepler" | "tess";
type SearchState = "initial" | "loading" | "success-with-results" | "success-empty" | "error";

const PRESET_TARGETS = ["Kepler-10", "Kepler-452", "TOI-700", "TIC 307210830"];

export default function DatasetsPage() {
  return (
    <ProtectedRoute>
      <DatasetExplorer />
    </ProtectedRoute>
  );
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

  async function runSearch(overrideTarget?: string) {
    const query = (overrideTarget ?? target).trim();
    if (!query || searchState === "loading") return;
    if (overrideTarget) setTarget(overrideTarget);

    setSearchState("loading");
    setError(null);
    setResults([]);
    try {
      const found = await api.searchDatasets(query, mission);
      setResults(found);
      setSearchState(found.length > 0 ? "success-with-results" : "success-empty");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 429) {
        if (typeof caught.retryAfter === "number" && caught.retryAfter > 0) {
          setError(
            `MAST search is rate-limited. Please wait ${caught.retryAfter} second${caught.retryAfter === 1 ? "" : "s"} before searching again.`,
          );
        } else {
          setError("MAST archive search is temporarily rate-limited. Wait briefly before searching again.");
        }
      } else if (caught instanceof ApiError) {
        setError(
          caught.status === 0 && caught.message.includes("timed out")
            ? "NASA archive search timed out. The Mikulski Archive did not respond in time. Try again."
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
      ? "Downloading FITS…"
      : stage === "uploading"
      ? "Validating observation…"
      : "Preparing analysis…";

  function missionBadgeClass(m: string) {
    const lower = m.toLowerCase();
    if (lower.includes("tess")) return "bg-amber-50 text-amber-900 border-amber-300";
    if (lower.includes("k2")) return "bg-purple-50 text-purple-900 border-purple-200";
    return "bg-stone-100 text-stone-900 border-stone-300";
  }

  return (
    <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10 text-[#090D0F]">
      {/* Editorial Header */}
      <header className="border-b border-[#090D0F]/10 pb-8 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            <span>Archival Catalogue</span>
            <span className="text-zinc-400">/</span>
            <span>Mikulski Archive for Space Telescopes</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#090D0F] tracking-tight">
            NASA MAST Observation Search
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 font-sans max-w-2xl leading-relaxed">
            Query calibrated space-telescope light curves from Kepler, K2, and TESS missions.
            Download high-precision FITS binary tables directly into the ExoVision screening pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-[#090D0F] underline underline-offset-4"
          >
            <span>Upload local file</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-zinc-300">·</span>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-[#090D0F] underline underline-offset-4"
          >
            <span>Run benchmark demo</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Large Professional Search Interface */}
      <section className="bg-white border border-[#090D0F]/10 rounded p-6 mb-8" aria-label="MAST Search query">
        <form onSubmit={search} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Target input */}
          <div className="md:col-span-7">
            <label htmlFor="target-input" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
              Target or Object Identifier
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="target-input"
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. Kepler-10, Kepler-452, TOI-700, TIC 307210830"
                required
                maxLength={120}
                className="w-full h-11 pl-10 pr-4 rounded border border-[#090D0F]/20 bg-white text-xs text-[#090D0F] placeholder:text-zinc-400 focus:outline-none focus:border-[#090D0F] transition-colors"
              />
            </div>
          </div>

          {/* Mission dropdown */}
          <div className="md:col-span-3">
            <label htmlFor="mission-select" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
              Mission Scope
            </label>
            <select
              id="mission-select"
              value={mission}
              onChange={(e) => setMission(e.target.value as Mission)}
              className="w-full h-11 px-3 rounded border border-[#090D0F]/20 bg-white text-xs text-[#090D0F] focus:outline-none focus:border-[#090D0F] transition-colors"
            >
              <option value="all">Kepler, K2, and TESS</option>
              <option value="kepler">Kepler & K2 only</option>
              <option value="tess">TESS Survey only</option>
            </select>
          </div>

          {/* Search button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={searchState === "loading" || !target.trim()}
              className="w-full h-11 rounded bg-[#090D0F] text-[#F7F5EF] text-xs font-semibold hover:bg-[#1E293B] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {searchState === "loading" ? (
                <>
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching…</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Query MAST</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Presets Strip */}
        <div className="mt-4 pt-3 border-t border-[#090D0F]/05 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mr-1">
            Common Targets:
          </span>
          {PRESET_TARGETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => void runSearch(preset)}
              className="px-2.5 py-1 rounded border border-[#090D0F]/10 text-zinc-700 text-[11px] font-mono hover:border-[#090D0F]/30 hover:bg-black/[0.02] transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </section>

      {/* Error Message */}
      {error && searchState !== "error" && (
        <div className="border border-red-200 bg-red-50 text-red-900 text-xs p-4 rounded mb-6" role="alert">
          {error}
        </div>
      )}

      {/* Dense Readable Observation Catalogue Table (NO CARD GRIDS!) */}
      <section aria-labelledby="catalogue-heading">
        <div className="flex items-baseline justify-between pb-3 border-b border-[#090D0F]/10 mb-4">
          <div>
            <h2 id="catalogue-heading" className="font-serif text-xl font-medium text-[#090D0F]">
              Archival Observation Products
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Available calibrated photometric light curves from the Mikulski Archive
            </p>
          </div>
          {(searchState === "success-with-results" || searchState === "success-empty") && (
            <span className="text-xs font-mono text-zinc-500">
              {results.length} product{results.length === 1 ? "" : "s"} found
            </span>
          )}
        </div>

        {/* State Rendering */}
        {searchState === "loading" ? (
          <div className="space-y-3 py-6" role="status">
            <span className="sr-only">Searching Mikulski Archive for Space Telescopes…</span>
            <div className="h-12 bg-white/70 rounded border border-[#090D0F]/10 animate-pulse" />
            <div className="h-12 bg-white/70 rounded border border-[#090D0F]/10 animate-pulse" />
            <div className="h-12 bg-white/70 rounded border border-[#090D0F]/10 animate-pulse" />
          </div>
        ) : searchState === "initial" ? (
          <div className="border border-[#090D0F]/10 bg-white rounded p-12 text-center">
            <Database className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-[#090D0F] font-medium">
              Search the Mikulski Public Archive
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 leading-relaxed">
              Enter a Kepler, K2, or TESS target name or catalog ID above to inspect available
              observation quarters, sectors, and photometry products.
            </p>
          </div>
        ) : searchState === "error" ? (
          <div className="border border-red-200 bg-red-50 rounded p-8 text-center" role="alert">
            <h3 className="font-serif text-base text-red-950 font-medium">Archive Search Unavailable</h3>
            <p className="text-xs text-red-800/80 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              {error ?? "The archive search could not be completed. Please verify the target and try again."}
            </p>
            <button
              type="button"
              onClick={() => void runSearch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-300 bg-white text-xs font-medium text-red-900 hover:bg-red-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry search</span>
            </button>
          </div>
        ) : searchState === "success-empty" ? (
          <div className="border border-[#090D0F]/10 bg-white rounded p-12 text-center">
            <Telescope className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-[#090D0F] font-medium">
              No Compatible Light Curves Found
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 leading-relaxed">
              MAST returned no matching time-series products for &ldquo;{target}&rdquo;. Verify the object identifier,
              switch the mission scope, or test with the bundled Kepler-10b demo.
            </p>
          </div>
        ) : (
          /* Dense Scientific Observation Table */
          <div className="overflow-x-auto border border-[#090D0F]/10 bg-white rounded">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[#090D0F]/10 text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-[#FAF9F5]">
                  <th className="py-3 px-4 font-medium">Mission</th>
                  <th className="py-3 px-4 font-medium">Target Identifier</th>
                  <th className="py-3 px-4 font-medium">Filename / Product</th>
                  <th className="py-3 px-4 font-medium">Observation Timeline</th>
                  <th className="py-3 px-4 font-medium font-mono text-right">Format & Size</th>
                  <th className="py-3 px-4 text-right font-medium">Pipeline Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#090D0F]/05">
                {results.map((item) => (
                  <tr key={item.data_uri} className="hover:bg-black/[0.02] transition-colors group">
                    {/* Mission Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`rounded border px-2 py-0.5 text-[9px] font-mono font-medium uppercase ${missionBadgeClass(
                          item.mission,
                        )}`}
                      >
                        {item.mission}
                      </span>
                    </td>

                    {/* Target Name Column */}
                    <td className="py-3.5 px-4 font-medium text-[#090D0F] whitespace-nowrap">
                      {item.target_name}
                    </td>

                    {/* Product Filename Column */}
                    <td className="py-3.5 px-4 text-zinc-600 font-mono text-[11px] max-w-xs truncate" title={item.filename}>
                      {item.filename}
                    </td>

                    {/* Observation Timeline Column */}
                    <td className="py-3.5 px-4 text-zinc-600 whitespace-nowrap font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1.5 text-zinc-500">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        <span>{item.observation_period}</span>
                      </span>
                    </td>

                    {/* Format & Size Column */}
                    <td className="py-3.5 px-4 font-mono text-right text-zinc-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <FileArchive className="w-3 h-3 text-zinc-400" />
                        <span>{item.format} · {formatFileSize(item.size_bytes)}</span>
                      </span>
                    </td>

                    {/* Action Column (Row Selection & Launch) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => void handleObservation(item)}
                        disabled={importing !== null}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#090D0F] text-[#F7F5EF] text-[11px] font-medium hover:bg-[#1E293B] disabled:opacity-50 transition-colors"
                      >
                        {importing === item.data_uri ? (
                          <>
                            <LoaderCircle className="w-3 h-3 animate-spin text-signal" />
                            <span>{importLabel}</span>
                          </>
                        ) : (
                          <>
                            <span>Use Observation</span>
                            <ArrowRight className="w-3 h-3 text-zinc-400" />
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
