"use client";

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Database,
  FileArchive,
  FileUp,
  FlaskConical,
  Info,
  LoaderCircle,
  RotateCcw,
  Search,
  Sparkles,
  Telescope,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PrecisionButton, SegmentedControl } from "@/components/ui";
import { formatFileSize, IntakeStage, intakeError, startObservation } from "@/lib/analysis-intake";
import { api, ApiError } from "@/lib/api";
import type { DatasetSearchResult } from "@/types/api";

type Mission = "all" | "kepler" | "tess";
type SearchState = "initial" | "loading" | "success-with-results" | "success-empty" | "error";

interface PresetTarget {
  name: string;
  mission: Mission;
  badge: string;
  badgeStyle: string;
  highlight: string;
  description: string;
}

const PRESET_TARGETS: PresetTarget[] = [
  {
    name: "Kepler-10",
    mission: "kepler",
    badge: "Kepler",
    badgeStyle: "border-amber-500/30 text-amber-400 bg-amber-950/40",
    highlight: "First Confirmed Rocky Planet",
    description: "Kepler-10b is a landmark rocky world with high SNR transit detections.",
  },
  {
    name: "TOI-700",
    mission: "tess",
    badge: "TESS",
    badgeStyle: "border-sky-500/30 text-sky-400 bg-sky-950/40",
    highlight: "Habitable-Zone System",
    description: "Multi-planet red dwarf system hosting Earth-sized candidate TOI-700 d.",
  },
  {
    name: "TRAPPIST-1",
    mission: "all",
    badge: "K2 / TESS",
    badgeStyle: "border-purple-500/30 text-purple-400 bg-purple-950/40",
    highlight: "7 Earth-Sized Planets",
    description: "Ultra-cool red dwarf system observed across multiple campaigns.",
  },
  {
    name: "Kepler-452",
    mission: "kepler",
    badge: "Kepler",
    badgeStyle: "border-amber-500/30 text-amber-400 bg-amber-950/40",
    highlight: "Earth's Older Cousin",
    description: "Near-Earth-sized candidate orbiting in a Sun-like star's habitable zone.",
  },
  {
    name: "TOI-1338",
    mission: "tess",
    badge: "TESS",
    badgeStyle: "border-sky-500/30 text-sky-400 bg-sky-950/40",
    highlight: "Circumbinary Exoplanet",
    description: "Famous planet orbiting two stars, discovered in TESS sector data.",
  },
  {
    name: "K2-18",
    mission: "kepler",
    badge: "K2",
    badgeStyle: "border-purple-500/30 text-purple-400 bg-purple-950/40",
    highlight: "Sub-Neptune Atmosphere",
    description: "Habitable-zone candidate with verified atmospheric spectroscopic signatures.",
  },
  {
    name: "Kepler-8",
    mission: "kepler",
    badge: "Kepler",
    badgeStyle: "border-amber-500/30 text-amber-400 bg-amber-950/40",
    highlight: "Hot Jupiter Transit",
    description: "Deep, periodic transit signature ideal for pipeline verification.",
  },
  {
    name: "KIC 8462852",
    mission: "kepler",
    badge: "Kepler (KIC)",
    badgeStyle: "border-amber-500/30 text-amber-400 bg-amber-950/40",
    highlight: "Boyajian's Star",
    description: "Famous for mysterious, extreme non-periodic photometric dips.",
  },
];

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
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ filename: string; message: string } | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  async function search(event: FormEvent) {
    event.preventDefault();
    await runSearch();
  }

  async function runSearch(overrideTarget?: string, overrideMission?: Mission) {
    const queryTarget = (overrideTarget !== undefined ? overrideTarget : target).trim();
    const queryMission = overrideMission !== undefined ? overrideMission : mission;
    if (!queryTarget) return;

    if (overrideTarget !== undefined) setTarget(overrideTarget);
    if (overrideMission !== undefined) setMission(overrideMission);

    const currentRequestId = ++activeRequestIdRef.current;

    setSearchState("loading");
    setSearchError(null);
    setActionError(null);
    setResults([]);

    try {
      const found = await api.searchDatasets(queryTarget, queryMission);
      if (currentRequestId !== activeRequestIdRef.current) return;
      setResults(found);
      setSearchState(found.length > 0 ? "success-with-results" : "success-empty");
    } catch (caught) {
      if (currentRequestId !== activeRequestIdRef.current) return;
      if (caught instanceof ApiError && caught.status === 429) {
        if (typeof caught.retryAfter === "number" && caught.retryAfter > 0) {
          setSearchError(
            `MAST search is temporarily rate limited. Please wait ${caught.retryAfter} second${caught.retryAfter === 1 ? "" : "s"} before searching again.`,
          );
        } else {
          setSearchError("MAST search is temporarily rate limited. Wait briefly before searching again.");
        }
      } else if (caught instanceof ApiError) {
        setSearchError(
          caught.status === 0 && caught.message.includes("timed out")
            ? "NASA archive search timed out. The archive did not respond within the allowed time. Try the search again."
            : caught.message,
        );
      } else {
        setSearchError("The MAST archive could not be searched safely.");
      }
      setSearchState("error");
      setResults([]);
    }
  }

  async function handleObservation(item: DatasetSearchResult) {
    if (importing) return;
    setImporting(item.data_uri);
    setStage("downloading");
    setActionError(null);
    try {
      const file = await api.downloadDataset(item.data_uri, item.filename);
      const analysisId = await startObservation(file, setStage);
      router.push(`/results/${analysisId}`);
    } catch (caught) {
      setActionError({
        filename: item.filename,
        message: intakeError(caught),
      });
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
                  placeholder="e.g. Kepler-10, TOI-700, TRAPPIST-1, TIC 150428135"
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

          {/* Suggested Quick-Search Target Chips */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium mr-1">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span>Suggested:</span>
            </span>
            {PRESET_TARGETS.map((preset) => {
              const isSelected = target.trim().toLowerCase() === preset.name.toLowerCase();
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => void runSearch(preset.name, preset.mission)}
                  title={`${preset.highlight}: ${preset.description}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono transition shadow-sm ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-950/60 text-cyan-300 ring-1 ring-cyan-400/40"
                      : "border-white/[0.08] bg-[#090b0e] text-zinc-300 hover:border-cyan-500/40 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="font-medium">{preset.name}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded border ${preset.badgeStyle}`}>
                    {preset.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mission Filter Selector & Guidance Notes */}
          <div className="pt-3 border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3 text-cyan-400 shrink-0" />
                <span>Search by star name, KOI, TIC, or KIC number</span>
              </span>
              <Link
                href="/demo"
                className="text-purple-300 hover:text-purple-200 transition underline underline-offset-2 shrink-0"
              >
                Offline demo &rarr;
              </Link>
            </div>
          </div>
        </form>
      </section>

      {/* Action-specific Error Alert (e.g. download or pipeline launch failure) */}
      {actionError && (
        <div role="alert" className="mt-4 flex items-start justify-between gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/[0.08] p-3.5 text-xs text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold text-white">Observation Import Notice: </span>
              <span>Could not retrieve <span className="font-mono text-amber-300">{actionError.filename}</span>. {actionError.message}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-amber-400 hover:text-white p-0.5 transition shrink-0"
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </button>
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
          <div className="py-8 max-w-4xl mx-auto space-y-8">
            <div className="text-center max-w-lg mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 mx-auto mb-3 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <Database className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                Explore Public Astronomical Light Curves
              </h3>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                Query confirmed exoplanets, candidates, or host stars directly from the Mikulski Archive for Space Telescopes. Click any verified target below to load public observations instantly.
              </p>
            </div>

            {/* Curated Target Quick-Start Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Featured Exploration Targets</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Click card to query
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PRESET_TARGETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => void runSearch(preset.name, preset.mission)}
                    className="group relative p-3.5 rounded-lg border border-white/[0.08] bg-[#090b0e] hover:border-cyan-500/40 hover:bg-[#0c1017] transition text-left flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                          {preset.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${preset.badgeStyle}`}>
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-cyan-400/90 mb-1">
                        {preset.highlight}
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-zinc-500 group-hover:text-cyan-400 transition">
                      <span>Query MAST archive</span>
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Nomenclature & Format Guide */}
            <div className="rounded-lg border border-white/[0.06] bg-[#080a0e] p-4 sm:p-5">
              <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-cyan-400" />
                <span>Supported Astronomical Naming Conventions</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded border border-white/[0.04] bg-[#0c1015]">
                  <span className="font-mono font-semibold text-amber-400 text-[11px]">Kepler & K2</span>
                  <p className="text-zinc-300 mt-1 font-mono text-[11px]">Kepler-10, Kepler-452, K2-18</p>
                  <p className="text-zinc-500 text-[10px] mt-0.5">Or use Kepler Input Catalog: <span className="text-zinc-400 font-mono">KIC 6922244</span></p>
                </div>
                <div className="p-3 rounded border border-white/[0.04] bg-[#0c1015]">
                  <span className="font-mono font-semibold text-sky-400 text-[11px]">TESS Missions</span>
                  <p className="text-zinc-300 mt-1 font-mono text-[11px]">TOI-700, TOI-1338, TOI-849</p>
                  <p className="text-zinc-500 text-[10px] mt-0.5">Or use TESS Input Catalog: <span className="text-zinc-400 font-mono">TIC 150428135</span></p>
                </div>
                <div className="p-3 rounded border border-white/[0.04] bg-[#0c1015]">
                  <span className="font-mono font-semibold text-purple-400 text-[11px]">Host Stars & Systems</span>
                  <p className="text-zinc-300 mt-1 font-mono text-[11px]">TRAPPIST-1, WASP-121, HD 209458</p>
                  <p className="text-zinc-500 text-[10px] mt-0.5">Or test offline: <Link href="/demo" className="text-purple-300 hover:underline">5-day Synthetic Demo</Link></p>
                </div>
              </div>
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
              {searchError ?? "The archive search could not be completed. The NASA MAST service may be temporarily unavailable."}
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
          <div className="py-10 text-center max-w-lg mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.10] bg-[#11151b] text-zinc-400 mx-auto mb-4">
              <Telescope className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-white">No compatible light curves found</h3>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              No public observations matched <span className="text-white font-mono">&ldquo;{target}&rdquo;</span> under the selected mission criteria. Try selecting &ldquo;All Missions&rdquo;, or choose one of these verified targets:
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {["Kepler-10", "TOI-700", "TRAPPIST-1", "Kepler-452"].map((presetName) => {
                const item = PRESET_TARGETS.find((p) => p.name === presetName);
                if (!item) return null;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => void runSearch(item.name, item.mission)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/[0.10] bg-[#090b0e] hover:border-cyan-400 hover:text-white text-xs font-mono text-zinc-300 transition"
                  >
                    <span>{item.name}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded border ${item.badgeStyle}`}>
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
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
