"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Cpu, Database, LineChart, Sparkles } from "lucide-react";

interface ProductFeature {
  id: string;
  name: string;
  shortCode: string;
  icon: React.ElementType;
  title: string;
  caption: string;
  imageSrc: string;
  badges: string[];
}

const productFeatures: ProductFeature[] = [
  {
    id: "lightcurve",
    name: "Transit Detection",
    shortCode: "01 LIGHT CURVE",
    icon: LineChart,
    title: "Phase-Folded Keplerian Transit Fitting",
    caption:
      "High-precision photometric flux analysis with fitted Keplerian transit model, ingress/egress markers, and residual noise distribution.",
    imageSrc: "/product-lightcurve.jpg",
    badges: ["Period 0.8375 d", "Depth 198 ppm", "BLS SNR 18.42", "Duration 1.62 h"],
  },
  {
    id: "periodogram",
    name: "BLS Spectrum",
    shortCode: "02 BLS SOLVER",
    icon: Activity,
    title: "Box Least Squares Spectral Power Solver",
    caption:
      "Kovács et al. periodicity solver searching 25,000 fine-grained trial orbital frequencies with pink-noise whitening and harmonic isolation.",
    imageSrc: "/product-periodogram.jpg",
    badges: ["25,000 Trial Steps", "Peak SNR 18.42", "FAP 0.001%", "Threshold SNR ≥ 7.0"],
  },
  {
    id: "ai-dossier",
    name: "AI & Explainability",
    shortCode: "03 AI XAI",
    icon: Cpu,
    title: "Random Forest & Multivariate SHAP Attributions",
    caption:
      "100-tree ensemble candidate screener assessing odd-even transit consistency, secondary eclipse absence, centroid stability, and SHAP vectors.",
    imageSrc: "/product-ai-dossier.jpg",
    badges: ["98.4% Confidence", "14 SHAP Vectors", "Radius 1.42 R⊕", "Host G-Type"],
  },
  {
    id: "mast-ingestion",
    name: "MAST Archive",
    shortCode: "04 DATA INGEST",
    icon: Database,
    title: "NASA Space Telescope Photometry Ingestion",
    caption:
      "Direct integration with Mikulski Archive for Space Telescopes (MAST), ingesting Kepler, K2, and TESS calibrated aperture photometry.",
    imageSrc: "/product-mast-ingestion.jpg",
    badges: ["NASA MAST API v2", "Kepler Q1–Q17", "TESS 2-min Cadence", "FITS Parser"],
  },
];

export function ProductCapabilitiesShowcase() {
  const [activeTab, setActiveTab] = useState<string>("lightcurve");

  const currentFeature =
    productFeatures.find((f) => f.id === activeTab) || productFeatures[0];

  return (
    <div className="w-full relative flex flex-col gap-4">
      {/* Interactive Feature Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
        {productFeatures.map((feat) => {
          const isActive = feat.id === activeTab;
          const Icon = feat.icon;
          return (
            <button
              key={feat.id}
              type="button"
              onClick={() => setActiveTab(feat.id)}
              className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all duration-200 ${
                isActive
                  ? "bg-amber-400/15 border border-amber-400/50 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.2)] font-semibold"
                  : "bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15]"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 transition-colors ${
                  isActive ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              <span>{feat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Feature Image & Telemetry Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFeature.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-2xl border border-white/[0.12] bg-[#0A0E17]/90 backdrop-blur-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden group"
        >
          {/* Luminous Top Golden Starlight Edge Beam */}
          <div
            aria-hidden="true"
            className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none"
          />

          {/* Header & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-mono text-amber-300 font-semibold tracking-wider uppercase">
                {currentFeature.shortCode}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              Verified Telemetry Interface
            </span>
          </div>

          {/* High-Resolution Product Image */}
          <div className="relative rounded-xl overflow-hidden border border-white/[0.1] bg-[#07090D] shadow-inner aspect-[16/9]">
            <Image
              src={currentFeature.imageSrc}
              alt={currentFeature.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 600px"
              priority
            />
            {/* Subtle Vignette Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090D]/80 via-transparent to-black/20 pointer-events-none" />

            {/* Bottom Floating Telemetry Overlay Tag */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-zinc-300 pointer-events-none">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#07090D]/90 backdrop-blur-md border border-white/10 text-amber-300 font-semibold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>ExoVision AI Astrophysical Pipeline</span>
              </span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="mt-4">
            <h3 className="font-serif text-lg text-white font-medium tracking-tight">
              {currentFeature.title}
            </h3>
            <p className="mt-1.5 text-xs text-zinc-400 font-sans leading-relaxed">
              {currentFeature.caption}
            </p>
          </div>

          {/* Live Parameter Chips */}
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2 font-mono text-[10px]">
            {currentFeature.badges.map((badge, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.08] text-zinc-300"
              >
                {badge}
              </span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
