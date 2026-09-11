"use client";

import {
  ArrowRight,
  FlaskConical,
  LoaderCircle,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { IntakeStage, intakeError, startObservation } from "@/lib/analysis-intake";
import { api } from "@/lib/api";

export default function DemoPage() {
  return (
    <ProtectedRoute>
      <DemoContent />
    </ProtectedRoute>
  );
}

function DemoContent() {
  const router = useRouter();
  const [stage, setStage] = useState<IntakeStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const busy = stage !== "idle";

  async function runDemo() {
    if (busy) return;
    setError(null);
    setStage("downloading");
    try {
      const file = await api.downloadDemoDataset();
      const analysisId = await startObservation(file, setStage);
      router.push(`/results/${analysisId}`);
    } catch (caught) {
      setError(intakeError(caught));
      setStage("idle");
    }
  }

  const label =
    stage === "downloading"
      ? "Fetching bundled observation…"
      : stage === "uploading"
      ? "Uploading observation…"
      : stage === "starting"
      ? "Preparing analysis…"
      : "Execute Kepler-10b Benchmark";

  return (
    <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10 text-[#090D0F]">
      {/* Editorial Header */}
      <header className="border-b border-[#090D0F]/10 pb-8 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            <span>Verification Benchmark</span>
            <span className="text-zinc-400">/</span>
            <span>Bundled Photometry</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#090D0F] tracking-tight">
            Kepler-10b Transit Benchmark
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 font-sans max-w-2xl leading-relaxed">
            Execute the complete observational transit pipeline using real Kepler staring photometry.
            No upload or external archive credentials required.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-[#090D0F] underline underline-offset-4"
          >
            <span>Upload custom file</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-zinc-300">·</span>
          <Link
            href="/datasets"
            className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-[#090D0F] underline underline-offset-4"
          >
            <span>Search NASA MAST</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Main Benchmark Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Benchmark Summary & Run Trigger */}
        <section className="lg:col-span-8 bg-white border border-[#090D0F]/10 rounded p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-[#090D0F]/10 mb-6">
            <div className="w-12 h-12 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-900">
              <FlaskConical className="w-6 h-6 text-signal" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-signal font-semibold">
                Gold Standard Reference
              </span>
              <h2 className="font-serif text-2xl font-medium text-[#090D0F]">
                Target KOI-072.01 (Kepler-10)
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 font-sans leading-relaxed">
            Kepler-10b was the first confirmed rocky exoplanet discovered by NASA’s Kepler mission.
            This bundled dataset contains long-cadence calibrated flux measurements demonstrating
            a shallow, periodic orbital transit with period <code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded">P ≈ 0.8375 d</code> and fractional depth <code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded">δ ≈ 198 ppm</code>.
          </p>

          {/* Reference Values Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 pt-4 border-t border-[#090D0F]/05 text-xs font-mono">
            <div className="p-3 bg-[#FAF9F5] rounded border border-[#090D0F]/05">
              <span className="text-[10px] uppercase text-zinc-500 block">Expected Period</span>
              <strong className="text-xs text-zinc-800 mt-0.5 block">0.8375 d</strong>
            </div>
            <div className="p-3 bg-[#FAF9F5] rounded border border-[#090D0F]/05">
              <span className="text-[10px] uppercase text-zinc-500 block">Transit Depth</span>
              <strong className="text-xs text-zinc-800 mt-0.5 block">198 ppm</strong>
            </div>
            <div className="p-3 bg-[#FAF9F5] rounded border border-[#090D0F]/05">
              <span className="text-[10px] uppercase text-zinc-500 block">Expected SNR</span>
              <strong className="text-xs text-signal mt-0.5 block">18.42</strong>
            </div>
            <div className="p-3 bg-[#FAF9F5] rounded border border-[#090D0F]/05">
              <span className="text-[10px] uppercase text-zinc-500 block">Instrument</span>
              <strong className="text-xs text-zinc-800 mt-0.5 block">Kepler Stare</strong>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded border border-red-200 bg-red-50 text-red-800 text-xs mb-6" role="alert">
              {error}
            </div>
          )}

          {/* Execute CTA */}
          <div className="pt-4 border-t border-[#090D0F]/10 flex items-center gap-4">
            <button
              type="button"
              onClick={() => void runDemo()}
              disabled={busy}
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[#090D0F] text-[#F7F5EF] text-xs font-semibold hover:bg-[#1E293B] disabled:opacity-50 transition-colors"
            >
              {busy ? (
                <>
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin text-signal" />
                  <span>{label}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Benchmark Pipeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Column: Execution Sequence Walkthrough */}
        <aside className="lg:col-span-4 bg-white border border-[#090D0F]/10 rounded p-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
            Pipeline Architecture
          </span>
          <h3 className="font-serif text-lg font-medium text-[#090D0F] mb-4">
            Analytical Progression
          </h3>

          <ol className="space-y-4 text-xs font-sans">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded border border-[#090D0F]/15 bg-[#FAF9F5] flex items-center justify-center font-mono text-[10px] font-medium shrink-0 mt-0.5">
                01
              </span>
              <div>
                <strong className="text-zinc-800 block">Ingest FITS Photometry</strong>
                <span className="text-zinc-500 text-[11px] leading-tight block mt-0.5">
                  Load calibrated flux arrays and Barycentric Julian Date timestamps.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded border border-[#090D0F]/15 bg-[#FAF9F5] flex items-center justify-center font-mono text-[10px] font-medium shrink-0 mt-0.5">
                02
              </span>
              <div>
                <strong className="text-zinc-800 block">Box Least Squares (BLS)</strong>
                <span className="text-zinc-500 text-[11px] leading-tight block mt-0.5">
                  Scan thousands of trial orbital periods to maximize spectral peak power.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded border border-[#090D0F]/15 bg-[#FAF9F5] flex items-center justify-center font-mono text-[10px] font-medium shrink-0 mt-0.5">
                03
              </span>
              <div>
                <strong className="text-zinc-800 block">Phase-Fold & Transit Model</strong>
                <span className="text-zinc-500 text-[11px] leading-tight block mt-0.5">
                  Fold all observational epochs onto the primary candidate period.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded border border-[#090D0F]/15 bg-[#FAF9F5] flex items-center justify-center font-mono text-[10px] font-medium shrink-0 mt-0.5">
                04
              </span>
              <div>
                <strong className="text-zinc-800 block">Random Forest Screening</strong>
                <span className="text-zinc-500 text-[11px] leading-tight block mt-0.5">
                  Classify transit morphology and assess false-positive indicators.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded border border-[#090D0F]/15 bg-[#FAF9F5] flex items-center justify-center font-mono text-[10px] font-medium shrink-0 mt-0.5">
                05
              </span>
              <div>
                <strong className="text-zinc-800 block">Publication Dossier</strong>
                <span className="text-zinc-500 text-[11px] leading-tight block mt-0.5">
                  Interactive charts, parameter strips, and exportable PDF summaries.
                </span>
              </div>
            </li>
          </ol>
        </aside>
      </div>
    </main>
  );
}
