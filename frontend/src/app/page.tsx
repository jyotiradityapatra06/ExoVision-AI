"use client";

import Link from "next/link";
import { motion, useScroll } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import { HeroSection } from "@/components/landing/HeroSection";
import { LandingNav } from "@/components/landing/LandingNav";
import { FallingStarsBackground } from "@/components/landing/FallingStarsBackground";
import { ProgressiveScrollCard } from "@/components/landing/ProgressiveScrollCard";
import { ObservatoryScrollTracker } from "@/components/landing/ObservatoryScrollTracker";

const narrativeSteps = [
  {
    id: "observe",
    num: "01",
    title: "OBSERVE",
    subtitle: "NASA MAST / Kepler / TESS",
    headline: "Ingest Calibrated Space Telemetry",
    summary:
      "Direct integration with the Mikulski Archive for Space Telescopes (MAST) allows instantaneous retrieval of long-baseline staring photometry from Kepler, K2, and TESS missions. Alternatively, ingest bespoke local FITS tables, CSV light curves, or ASCII time-series files.",
    details: [
      { label: "Supported Archives", value: "MAST, Kepler Q1–Q17, K2 Campaigns, TESS Sectors" },
      { label: "File Formats", value: "FITS (Standard Binary Table), CSV, ASCII TXT" },
      { label: "Cadence Handling", value: "Long cadence (29.4 min) & Fast cadence (2 min)" },
    ],
    accentNote: "Calibrated aperture photometry removes instrumental systematics and stellar trends.",
    stats: [
      { label: "Space Missions", val: "Kepler · K2 · TESS" },
      { label: "Max File Limit", val: "25 MiB Local Ingestion" },
    ],
    imageSrc: "/product-mast-ingestion.jpg",
    imageCaption: "NASA MAST Ingestion Engine · Kepler Q1–Q17 & TESS Calibrated Photometry",
    streamTelemetry: {
      telemetryCode: "STREAM-01 // MAST_TELEMETRY",
      coordinates: "RA 19h 02m 43s · Dec +50° 14′ 28″",
      samplingRate: "29.4m Cadence",
      activeChannels: "Q1–Q17 Calibrated",
    },
  },
  {
    id: "analyze",
    num: "02",
    title: "ANALYZE",
    subtitle: "Stellar light curves & transit signals",
    headline: "Spectral Transit Frequency Search",
    summary:
      "Execute Box Least Squares (BLS) period searching across thousands of fine-grained trial orbital frequencies. Phase-fold photometric epochs to resolve minute periodic flux deficits down to sub-100 ppm depths.",
    details: [
      { label: "Core Algorithm", value: "Kovács et al. Box Least Squares (BLS)" },
      { label: "Signal Parameters", value: "Period (P), Transit Depth (δ), Duration (q), Epoch (t₀)" },
      { label: "Diagnostic Metric", value: "Signal-to-Pink-Noise (SNR) & Spectral Peak Power" },
    ],
    accentNote: "Periodograms isolate true periodic orbital dips from red noise and stellar flare activity.",
    stats: [
      { label: "Detection Threshold", val: "BLS SNR ≥ 7.0" },
      { label: "Precision Depth", val: "Sub-100 ppm" },
    ],
    imageSrc: "/product-periodogram.jpg",
    imageCaption: "BLS Periodogram Spectral Power Analysis · 25,000 Trial Frequencies · Peak SNR 18.42",
    streamTelemetry: {
      telemetryCode: "STREAM-02 // BLS_KOVACS",
      coordinates: "Trial Frequencies: 25,000",
      samplingRate: "Period 0.2–30 d",
      activeChannels: "Residual RMS: 42 ppm",
    },
  },
  {
    id: "interpret",
    num: "03",
    title: "INTERPRET",
    subtitle: "Candidates and scientific evidence",
    headline: "Multi-Evidence Candidate Classification",
    summary:
      "A trained Random Forest model evaluates transit morphology and astrophysical features. Every candidate is interrogated through odd-even transit depth consistency, centroid motion checks, secondary eclipse tests, and SHAP explainability attributions.",
    details: [
      { label: "Classifier", value: "Random Forest Astrophysical Candidate Screener" },
      { label: "False Positive Tests", value: "Secondary eclipse, V-shape grazers, centroid offset" },
      { label: "Interpretability", value: "SHAP feature contribution vectors & harmonic analysis" },
    ],
    accentNote: "Separates true transiting planetary candidates from eclipsing binaries and stellar pulsation.",
    stats: [
      { label: "Classifier Model", val: "100-Tree Random Forest" },
      { label: "Attribution Engine", val: "Multivariate SHAP" },
    ],
    imageSrc: "/product-ai-dossier.jpg",
    imageCaption: "AI Candidate Screener & Multivariate SHAP Explainability Dashboard · 98.4% Confidence",
    streamTelemetry: {
      telemetryCode: "STREAM-03 // AI_SCREENER",
      coordinates: "Tree Ensemble: 100 Trees",
      samplingRate: "Odd-Even Depth Check",
      activeChannels: "SHAP 14 Features",
    },
  },
  {
    id: "archive",
    num: "04",
    title: "ARCHIVE",
    subtitle: "Research results and reports",
    headline: "Deterministic Dossiers & Provenance",
    summary:
      "Every run generates an immutable, publication-ready research dossier. Review phase-folded curves, raw light-curve baselines, full parameter tables, and export reproducible PDF analysis reports with formatted BibTeX citations.",
    details: [
      { label: "Deliverables", value: "Interactive Analysis Dossier, Vector Plots, Raw CSV" },
      { label: "Publication Export", value: "PDF Research Summary & Formal BibTeX Citation" },
      { label: "Provenance", value: "Deterministic parameter ledger with reproducible seeds" },
    ],
    accentNote: "Ready for direct inclusion into astrophysical research manuscripts and collaboration.",
    stats: [
      { label: "Export Formats", val: "PDF Report + BibTeX" },
      { label: "Provenance", val: "Deterministic Ledger" },
    ],
    imageSrc: "/product-lightcurve.jpg",
    imageCaption: "Phase-Folded Keplerian Transit Dip Model & Deterministic Evidence Dossier",
    streamTelemetry: {
      telemetryCode: "STREAM-04 // PROVENANCE",
      coordinates: "SHA-256 Ledger Seed",
      samplingRate: "Vector SVG & PDF",
      activeChannels: "BibTeX Formatted",
    },
  },
];

const archives = [
  { name: "NASA MAST", code: "MAST", desc: "Mikulski Archive for Space Telescopes" },
  { name: "Kepler Mission", code: "KEPLER", desc: "Primary 4-Year Staring Photometry (Q1–Q17)" },
  { name: "K2 Mission", code: "K2", desc: "Ecliptic Plane 80-Day Campaign Photometry" },
  { name: "TESS Mission", code: "TESS", desc: "All-Sky Transiting Exoplanet Survey Satellite" },
];

export default function HomePage() {
  const { scrollYProgress } = useScroll();

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-100 font-sans selection:bg-amber-500 selection:text-black relative overflow-clip">
      {/* Scroll-Linked Top Laser Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 origin-left z-50 shadow-[0_0_12px_#f59e0b]"
        style={{ scaleX: scrollYProgress }}
      />

      <LandingNav />
      <ObservatoryScrollTracker />
      <HeroSection />

      {/* Post-Hero Space Atmosphere: Falling Stars & Meteors across the lower sections */}
      <div className="relative overflow-hidden bg-[#07090D]">
        {/* Dynamic Canvas: Stars falling from the sky & shooting star meteors */}
        <FallingStarsBackground className="opacity-95" />

        {/* Glassmorphic Space Observatory Archive Strip with Scroll Ingestion Scan */}
        <section
          id="archives-strip"
          className="scroll-mt-20 border-b border-white/[0.08] bg-[#07090D]/75 backdrop-blur-xl py-10 relative z-10"
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-80px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400 font-semibold mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-ping" />
                <span>Spacecraft Photometry Ingestion</span>
              </div>
              <h3 className="font-serif text-xl text-white font-medium">
                Standardized Ingestion Pipeline
              </h3>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {archives.map((item, idx) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-60px" }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  className="p-3.5 rounded-lg border border-white/[0.08] bg-white/[0.025] backdrop-blur-md hover:border-amber-400/50 hover:bg-white/[0.06] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] group cursor-default"
                >
                  <span className="block text-[10px] font-mono text-amber-400 tracking-wider font-semibold group-hover:text-amber-300">
                    {item.code}
                  </span>
                  <span className="block text-xs font-semibold text-zinc-200 mt-1 group-hover:text-white">
                    {item.name}
                  </span>
                  <span className="block text-[10px] text-zinc-400 mt-0.5 leading-tight">
                    {item.desc}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* The 4-Part Scientific Narrative with Progressive Scroll Loading & Telemetry Streams */}
        <section id="narrative" className="py-32 max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mb-24"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300 mb-4 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Analytical Progression</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-6xl font-normal text-white tracking-tight leading-[1.05]">
              The Journey from Starlight to{" "}
              <span className="italic font-serif bg-gradient-to-r from-zinc-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                Planetary Evidence
              </span>
            </h2>
            <p className="mt-5 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl font-sans">
              ExoVision unifies photometric calibration, Box Least Squares spectral searching,
              and machine-learning screening into one reproducible, deterministic research workbench.
            </p>
          </motion.div>

          {/* Progressive Scroll-Loaded Narrative Chapters */}
          <div className="space-y-16 relative">
            {narrativeSteps.map((step) => (
              <ProgressiveScrollCard key={step.id} {...step} />
            ))}
          </div>
        </section>

        {/* Atmospheric Glassmorphic Research Invitation: Cosmic Deep Space Gate */}
        <section
          id="gateway"
          className="scroll-mt-24 border-t border-white/[0.08] bg-gradient-to-b from-[#07090D] via-[#0B0F17]/95 to-[#07090D] py-28 relative z-10 overflow-hidden"
        >
          {/* Radiant Starlight Dual Nebular Glow */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.16)_0%,_rgba(56,189,248,0.06)_40%,_transparent_72%)] blur-2xl pointer-events-none"
          />

          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative rounded-2xl border border-white/[0.14] bg-gradient-to-b from-white/[0.05] via-[#07090D]/85 to-[#07090D]/95 backdrop-blur-2xl p-8 sm:p-14 shadow-[0_24px_64px_rgba(0,0,0,0.65),_inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col lg:flex-row lg:items-center justify-between gap-10 overflow-hidden group hover:border-amber-400/35 transition-colors duration-300"
            >
              {/* Luminous Top Golden Starlight Edge Beam */}
              <div
                aria-hidden="true"
                className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none"
              />

              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300 mb-4 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
                  <span>Mission Observational Gate</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white font-normal tracking-tight leading-[1.05]">
                  Begin Transit{" "}
                  <span className="italic font-serif bg-gradient-to-r from-zinc-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                    Analysis
                  </span>
                </h2>
                <p className="mt-4 text-sm sm:text-base text-zinc-300 leading-relaxed font-sans">
                  Query Kepler and TESS observations directly from NASA MAST, or ingest your own local
                  FITS tables, CSV, and ASCII time-series into the Box Least Squares screening pipeline.
                </p>

                {/* Telemetry Architecture Tags */}
                <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-[10px] text-zinc-400">
                  <span className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.08] text-zinc-300">
                    NASA MAST API v2
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.08] text-zinc-300">
                    BLS Kovács Periodogram
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="px-2.5 py-1 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300 font-semibold">
                    Deterministic PDF Dossier
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <Link
                  href="/upload"
                  className="group/btn relative inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-lg bg-[#F4F1EA] text-[#090D0F] text-xs font-semibold hover:bg-white transition-all shadow-[0_0_28px_rgba(255,255,255,0.22)] hover:shadow-[0_0_36px_rgba(245,158,11,0.35)] hover:-translate-y-0.5 overflow-hidden"
                >
                  {/* Starlight button sheen */}
                  <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:translate-x-[300%] transition-transform duration-700" />
                  <span className="relative z-10 font-sans tracking-wide">Launch Analysis Pipeline</span>
                  <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover/btn:translate-x-1" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg border border-white/20 bg-white/[0.04] backdrop-blur-md text-zinc-200 text-xs font-medium hover:border-amber-400/50 hover:bg-white/[0.08] hover:text-white transition-all hover:-translate-y-0.5"
                >
                  <span className="font-sans tracking-wide">Kepler-10b Demo</span>
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Scientific Footer */}
        <footer className="border-t border-white/[0.08] bg-[#07090D]/90 backdrop-blur-md py-12 text-xs text-zinc-500 relative z-10">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="font-serif text-sm font-semibold tracking-wide text-zinc-200">
                ExoVision AI
              </span>
              <span className="text-zinc-600">·</span>
              <span className="font-mono text-[10px] text-zinc-400">
                Autonomous Exoplanet Screening Engine v2.4
              </span>
            </div>
            <div className="flex items-center gap-6 font-mono text-[11px] text-zinc-400">
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Workspace
              </Link>
              <Link href="/upload" className="hover:text-white transition-colors">
                Analyze
              </Link>
              <Link href="/datasets" className="hover:text-white transition-colors">
                NASA MAST
              </Link>
              <Link href="/reports" className="hover:text-white transition-colors">
                Reports
              </Link>
            </div>
            <p className="font-mono text-[10px] text-zinc-500 text-center md:text-right max-w-sm">
              For scientific research use. Candidate detections require independent radial velocity or high-resolution imaging validation.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
