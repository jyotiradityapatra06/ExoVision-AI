"use client";

import {
  Activity,
  ArrowRight,
  Cpu,
  Database,
  Filter,
  Radio,
  ScanSearch,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { OrbitalHeroStage } from "@/components/OrbitalHeroStage";

const presetCandidates = [
  {
    id: "kepler8b",
    name: "Kepler-8b Transit",
    type: "CONFIRMED",
    confidence: "98.4%",
    depth: "1.4% DIP",
    stability: "NOMINAL",
    symmetry: "0.92",
    noise: "LOW (1.2σ)",
  },
  {
    id: "koi126",
    name: "KOI-126",
    type: "BINARY",
    confidence: "94.1%",
    depth: "4.2% DIP",
    stability: "VARIANCE",
    symmetry: "0.62",
    noise: "MED (2.8σ)",
  },
  {
    id: "tic84920",
    name: "TIC-84920",
    type: "NOISE",
    confidence: "91.8%",
    depth: "0.1% DIP",
    stability: "UNSTABLE",
    symmetry: "0.40",
    noise: "HIGH (5.4σ)",
  },
];

export default function HomePage() {
  const [activeCandidate, setActiveCandidate] = useState(presetCandidates[0]);

  return (
    <main className="flex-grow pt-24 pb-16 px-gutter md:px-margin max-w-max-width mx-auto w-full relative z-10 flex flex-col gap-24">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col lg:flex-row items-center gap-12 pt-12 relative">
        <div className="lg:w-1/2 flex flex-col gap-8 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 hud-glass hud-border w-fit font-data-mono text-data-mono text-primary">
            <Radio className="h-4 w-4 text-primary animate-pulse" />
            STATUS: ACTIVE SCANNING
          </div>

          <h1 className="font-hero-lg text-headline-lg-mobile md:text-hero-lg leading-tight">
            Discover Hidden Worlds From <br />
            <span className="text-primary drop-shadow-[0_0_15px_rgba(0,229,255,0.6)]">
              Stellar Signals
            </span>
          </h1>

          <p className="font-body-md text-on-surface-variant max-w-2xl text-lg">
            Transform raw light curves from Kepler, TESS and ground observatories into explainable exoplanet candidates using AI.
          </p>

          <div className="flex flex-wrap gap-4 mt-4 font-label-caps text-label-caps">
            <Link
              href="/upload"
              className="bg-primary text-on-primary px-8 py-4 rounded-DEFAULT hover:bg-primary-fixed hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all flex items-center gap-2 font-bold"
            >
              <Zap className="h-4 w-4" />
              ANALYZE LIGHT CURVE
            </Link>
            <Link
              href="/dashboard"
              className="border border-primary text-primary px-8 py-4 rounded-DEFAULT hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all flex items-center gap-2 hud-glass font-bold"
            >
              <ScanSearch className="h-4 w-4" />
              EXPLORE DASHBOARD
            </Link>
          </div>
        </div>

        <div className="lg:w-1/2 relative w-full flex items-center justify-center">
          <OrbitalHeroStage />
        </div>
      </section>

      {/* Telemetry Section */}
      <section className="flex flex-col gap-8 relative">
        <div className="flex items-center gap-4 border-b border-outline-variant/30 pb-4">
          <Activity className="h-7 w-7 text-primary" />
          <h2 className="font-headline-md text-headline-md tracking-tight">
            Real-Time Transit Classification
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Display */}
          <div className="md:col-span-8 hud-glass hud-border p-6 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-data-mono text-xs text-primary mb-1 uppercase">
                  PRIMARY CANDIDATE
                </div>
                <h3 className="font-headline-md text-2xl">{activeCandidate.name}</h3>
              </div>
              <div className="bg-primary/10 border border-primary px-3 py-1 rounded text-primary font-data-mono text-sm flex items-center gap-2 font-bold">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {activeCandidate.confidence} CONFIDENCE
              </div>
            </div>

            <div className="relative w-full h-64 bg-surface-container-lowest/50 border border-outline-variant/20 rounded overflow-hidden flex items-center justify-center p-4">
              <svg className="w-full h-full opacity-80 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0,10 L30,10 C35,10 40,35 50,35 C60,35 65,10 70,10 L100,10" fill="none" stroke="#00e5ff" strokeWidth="1.5" />
                <line stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" x1="0" x2="100" y1="35" y2="35" />
                <line stroke="rgba(0,229,255,0.2)" strokeDasharray="2,2" strokeWidth="0.5" x1="50" x2="50" y1="0" y2="40" />
              </svg>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-outline-variant/30">
              <div className="flex flex-col gap-1 font-data-mono">
                <span className="text-[10px] text-outline uppercase">TRANSIT DEPTH</span>
                <span className="text-sm text-on-surface font-bold">{activeCandidate.depth}</span>
              </div>
              <div className="flex flex-col gap-1 font-data-mono">
                <span className="text-[10px] text-outline uppercase">SIGNAL STABILITY</span>
                <span className="text-sm text-on-surface font-bold">{activeCandidate.stability}</span>
              </div>
              <div className="flex flex-col gap-1 font-data-mono">
                <span className="text-[10px] text-outline uppercase">SHAPE SYMMETRY</span>
                <span className="text-sm text-on-surface font-bold">{activeCandidate.symmetry}</span>
              </div>
              <div className="flex flex-col gap-1 font-data-mono">
                <span className="text-[10px] text-outline uppercase">NOISE LEVEL</span>
                <span className="text-sm text-secondary font-bold">{activeCandidate.noise}</span>
              </div>
            </div>
          </div>

          {/* Sidebar Candidates */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="font-label-caps text-xs text-outline mb-2 uppercase">OTHER OBSERVATIONS</div>
            {presetCandidates.map((cand) => (
              <div
                key={cand.id}
                onClick={() => setActiveCandidate(cand)}
                className={`hud-glass p-4 border-l-2 cursor-pointer transition-colors group ${
                  cand.id === activeCandidate.id
                    ? "border-primary bg-primary/10"
                    : "border-secondary/50 hover:border-secondary"
                }`}
              >
                <div className="flex justify-between items-center mb-2 font-data-mono">
                  <span className="text-sm font-bold text-on-surface">{cand.name}</span>
                  <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded font-bold">
                    {cand.type}
                  </span>
                </div>
                <div className="font-body-md text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Classification confidence {cand.confidence} with signature depth {cand.depth}.
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section className="flex flex-col gap-8 relative py-12">
        <div className="text-center mb-8">
          <h2 className="font-headline-lg-mobile md:text-headline-lg tracking-tight mb-4">
            Analysis Pipeline
          </h2>
          <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto">
            End-to-end automated detection architecture.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant/30 -z-10" />

          <div className="flex flex-col items-center gap-3 bg-surface p-4 border border-outline-variant/30 rounded-lg w-full md:w-auto relative group hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all">
              <Database className="h-5 w-5 text-outline group-hover:text-primary" />
            </div>
            <span className="font-label-caps text-[10px] text-center font-bold">RAW LIGHT CURVE</span>
          </div>

          <ArrowRight className="h-5 w-5 text-outline-variant md:rotate-0 rotate-90" />

          <div className="flex flex-col items-center gap-3 bg-surface p-4 border border-outline-variant/30 rounded-lg w-full md:w-auto relative group hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all">
              <Filter className="h-5 w-5 text-outline group-hover:text-primary" />
            </div>
            <span className="font-label-caps text-[10px] text-center font-bold">SIGNAL PROCESSING</span>
          </div>

          <ArrowRight className="h-5 w-5 text-outline-variant md:rotate-0 rotate-90" />

          <div className="flex flex-col items-center gap-3 bg-surface p-4 border border-primary/50 rounded-lg w-full md:w-auto relative group hud-glass shadow-[0_0_15px_rgba(0,218,243,0.1)]">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary shadow-[0_0_10px_rgba(0,229,255,0.5)]">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <span className="font-label-caps text-[10px] text-center text-primary font-bold">MACHINE LEARNING</span>
          </div>

          <ArrowRight className="h-5 w-5 text-outline-variant md:rotate-0 rotate-90" />

          <div className="flex flex-col items-center gap-3 bg-surface p-4 border border-outline-variant/30 rounded-lg w-full md:w-auto relative group hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all">
              <Sparkles className="h-5 w-5 text-outline group-hover:text-primary" />
            </div>
            <span className="font-label-caps text-[10px] text-center font-bold">SCIENTIFIC REPORT</span>
          </div>
        </div>
      </section>
    </main>
  );
}
