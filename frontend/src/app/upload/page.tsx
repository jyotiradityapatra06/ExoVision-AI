"use client";

import Link from "next/link";
import { ArrowRight, Database, FlaskConical } from "lucide-react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UploadDropzone } from "@/components/upload-dropzone";

export default function AnalyzePage() {
  return (
    <ProtectedRoute>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10 text-[#090D0F]">
        {/* Editorial Header */}
        <header className="border-b border-[#090D0F]/10 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            <span>Observational Intake</span>
            <span className="text-zinc-400">/</span>
            <span>Pipeline Ingestion</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#090D0F] tracking-tight">
            Ingest Stellar Observation
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 font-sans max-w-2xl leading-relaxed">
            Feed calibrated photometric time-series into Box Least Squares (BLS) period searching,
            orbital transit modeling, and Random Forest candidate screening.
          </p>
        </header>

        {/* Editorial 3-Pathway Layout (Distinct Scientific Pathways, Not 3 Generic Cards) */}
        <div className="space-y-16">
          {/* Pathway 1 & 3 Quick Dispatch Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#090D0F]/10 pb-12">
            {/* Pathway 1: NASA MAST Direct Access */}
            <div className="flex flex-col justify-between p-6 rounded border border-[#090D0F]/10 bg-white">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-3">
                  <span className="uppercase tracking-widest text-signal">Pathway 01</span>
                  <span>Public Space Telemetry</span>
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <Database className="w-4 h-4 text-[#090D0F]" />
                  <h2 className="font-serif text-xl font-medium text-[#090D0F]">
                    NASA MAST Catalogue
                  </h2>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Query the Mikulski Archive for Space Telescopes directly. Retrieve calibrated
                  primary Kepler staring data (Q1–Q17), K2 ecliptic fields, or 2-minute cadence TESS sectors.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">Kepler</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">K2</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">TESS</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">Direct FITS</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#090D0F]/05">
                <Link
                  href="/datasets"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#090D0F] hover:underline underline-offset-4"
                >
                  <span>Query NASA MAST Archive</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pathway 3: Bundled Benchmark Demonstration */}
            <div className="flex flex-col justify-between p-6 rounded border border-[#090D0F]/10 bg-white">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-3">
                  <span className="uppercase tracking-widest text-signal">Pathway 02</span>
                  <span>Verification Benchmark</span>
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <FlaskConical className="w-4 h-4 text-[#090D0F]" />
                  <h2 className="font-serif text-xl font-medium text-[#090D0F]">
                    Kepler-10b Transit Demo
                  </h2>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Execute an immediate zero-setup evaluation on the gold-standard Kepler-10b transit dataset.
                  Demonstrates BLS period detection, phase folding, and full Random Forest candidate scoring.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    P = 0.8375 d
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    δ = 198 ppm
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    SNR 18.4
                  </span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#090D0F]/05">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#090D0F] hover:underline underline-offset-4"
                >
                  <span>Launch Kepler-10b Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Pathway 2: Upload Photometry (In-Place Primary Interface) */}
          <section aria-labelledby="upload-section-heading">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-signal mb-1">
                  <span>Pathway 03</span>
                  <span className="text-zinc-400">·</span>
                  <span>Primary Ingestion</span>
                </div>
                <h2 id="upload-section-heading" className="font-serif text-2xl font-medium text-[#090D0F]">
                  Upload Calibrated Photometry
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Standard NASA FITS binary tables, CSV time-series, or ASCII tab-delimited photometry files.
                </p>
              </div>
            </div>

            {/* In-Place Upload Dropzone */}
            <UploadDropzone />
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
