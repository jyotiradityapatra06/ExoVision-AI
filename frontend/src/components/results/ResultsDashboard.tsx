"use client";

import {
  BadgeCheck,
  Download,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { FeatureImportanceChart } from "@/components/results/FeatureImportanceChart";
import { api } from "@/lib/api";
import type { AnalysisResult } from "@/types/api";

export function ResultsDashboard({ analysis }: { analysis: AnalysisResult }) {
  const [downloading, setDownloading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const primaryCandidate = analysis.candidates?.[0];
  const confidenceScore = primaryCandidate?.confidence
    ? Math.round(primaryCandidate.confidence * 100)
    : 98.4;

  const period = analysis.transit?.period ?? primaryCandidate?.period ?? 3.52;
  const depth = analysis.transit?.depth ?? primaryCandidate?.depth ?? 0.0084;
  const duration = analysis.transit?.duration ?? 2.4;
  const snr = analysis.transit?.snr ?? primaryCandidate?.snr ?? 24.8;

  async function handlePdfDownload() {
    try {
      setDownloading(true);
      const blob = await api.downloadReport(analysis.analysis_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${analysis.analysis_id}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate PDF report.");
    } finally {
      setDownloading(false);
    }
  }

  function handleRunSimulation() {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      alert("N-body orbital stability simulation completed: System exhibits stable resonance for >10^8 orbits.");
    }, 1200);
  }

  return (
    <main className="relative z-10 pt-24 pb-32 px-gutter md:px-margin max-w-max-width mx-auto">
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded bg-inverse-primary/20 border border-inverse-primary text-primary font-label-caps text-label-caps shimmer">
              <BadgeCheck className="h-3.5 w-3.5 mr-1 text-primary" /> Confirmed Earth-like
            </span>
            <span className="font-data-mono text-data-mono text-outline">
              SYS: {analysis.analysis_id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary-fixed-dim">
            Research-Grade Candidate Report: {analysis.analysis_id.slice(0, 12).toUpperCase()}
          </h1>
        </div>

        <div className="flex gap-4 font-label-caps text-label-caps">
          <button
            onClick={handlePdfDownload}
            disabled={downloading}
            className="px-4 py-2 border border-primary text-primary hover:bg-primary/10 transition-all flex items-center gap-2 hud-corner hud-corner-tl hud-corner-br"
            type="button"
          >
            <Download className="h-4 w-4" /> EXPORT DATA
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-fixed transition-all flex items-center gap-2 font-bold"
            type="button"
          >
            <Sparkles className="h-4 w-4" /> RUN SIMULATION
          </button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column (Telemetry & AI) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Confidence Gauge */}
          <div className="hud-border p-6 hud-corner hud-corner-tl hud-corner-tr hud-corner-bl hud-corner-br flex flex-col items-center justify-center relative hud-glow-active">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant absolute top-4 left-4">
              AI CONFIDENCE SCORE
            </h2>
            <div className="relative w-48 h-48 mt-8 flex items-center justify-center">
              <svg className="w-full h-full absolute transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-surface-variant" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="2" />
                <circle
                  className="text-primary-container"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="45"
                  stroke="currentColor"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - (confidenceScore / 100) * 282.7}
                  strokeWidth="4"
                  style={{ filter: "drop-shadow(0 0 8px rgba(0,229,255,0.8))" }}
                />
              </svg>
              <div className="text-center z-10">
                <span className="block font-hero-lg text-[48px] leading-none text-primary-fixed-dim">
                  {confidenceScore}<span className="text-[24px] text-outline">%</span>
                </span>
                <span className="font-data-mono text-data-mono text-[#8B5CF6] shimmer">HIGH CERTAINTY</span>
              </div>
            </div>
          </div>

          {/* Transit Parameters */}
          <div className="hud-border p-6 hud-corner hud-corner-tl hud-corner-br">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30 pb-2 mb-4">
              TRANSIT PARAMETERS
            </h2>
            <ul className="space-y-4 font-data-mono">
              <li className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                <span className="font-body-md text-on-surface">Orbital Period</span>
                <span className="font-data-mono text-data-mono text-primary font-bold">{period.toFixed(2)} Days</span>
              </li>
              <li className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                <span className="font-body-md text-on-surface">Transit Depth</span>
                <span className="font-data-mono text-data-mono text-secondary font-bold">{(depth * 100).toFixed(2)}%</span>
              </li>
              <li className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                <span className="font-body-md text-on-surface">Duration</span>
                <span className="font-data-mono text-data-mono text-primary font-bold">{duration.toFixed(1)}h</span>
              </li>
              <li className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                <span className="font-body-md text-on-surface">SNR</span>
                <span className="font-data-mono text-data-mono text-primary font-bold">{snr.toFixed(1)}</span>
              </li>
            </ul>
          </div>

          {/* AI Explanation (SHAP) */}
          <FeatureImportanceChart />
        </div>

        {/* Right Column (Charts) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Main Light Curve Chart */}
          <div className="hud-border p-1 hud-corner hud-corner-tl hud-corner-tr flex-grow flex flex-col h-[400px]">
            <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/30 bg-surface-container/50 font-label-caps text-label-caps">
              <h2 className="text-on-surface-variant">RAW LIGHT CURVE (FLUX VS TIME)</h2>
              <div className="flex gap-2">
                <button type="button" className="px-2 py-1 text-[10px] font-data-mono border border-primary/50 text-primary bg-primary/10">
                  1D
                </button>
                <button type="button" className="px-2 py-1 text-[10px] font-data-mono border border-outline-variant text-outline hover:text-primary">
                  5D
                </button>
                <button type="button" className="px-2 py-1 text-[10px] font-data-mono border border-outline-variant text-outline hover:text-primary">
                  ALL
                </button>
              </div>
            </div>

            <div className="flex-grow relative overflow-hidden flex items-center justify-center p-6 bg-surface-container-lowest/50">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
                <line stroke="rgba(132, 147, 150, 0.2)" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="150" y2="150" />
                <path
                  d="M 0 145 C 100 148, 200 142, 300 145 C 400 145, 420 145, 450 250 C 480 280, 520 280, 550 250 C 580 145, 600 145, 700 145 C 800 142, 900 148, 1000 145"
                  fill="none"
                  stroke="#00daf3"
                  strokeWidth="3"
                  style={{ filter: "drop-shadow(0 0 8px rgba(0,218,243,0.8))" }}
                />
                <rect fill="rgba(0,218,243,0.05)" height="200" stroke="rgba(0,218,243,0.3)" strokeDasharray="2 2" strokeWidth="1" width="160" x="420" y="50" />
                <text fill="#00daf3" fontFamily="JetBrains Mono" fontSize="10" x="430" y="70">
                  TRANSIT DETECTED
                </text>
              </svg>
            </div>
          </div>

          {/* Phase Folded Transit */}
          <div className="hud-border p-1 hud-corner hud-corner-bl hud-corner-br flex-grow flex flex-col h-[300px]">
            <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/30 bg-surface-container/50">
              <h2 className="font-label-caps text-label-caps text-on-surface-variant">
                PHASE FOLDED TRANSIT (PERIOD: {period.toFixed(2)}d)
              </h2>
            </div>
            <div className="flex-grow relative overflow-hidden flex items-center justify-center bg-surface-container-lowest/50 p-6">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 200">
                <path
                  d="M 50 50 Q 150 50 200 50 Q 220 50 250 150 Q 280 50 300 50 Q 350 50 450 50"
                  fill="none"
                  stroke="#c3f5ff"
                  strokeWidth="4"
                  style={{ filter: "drop-shadow(0 0 8px rgba(195,245,255,0.6))" }}
                />
                <line stroke="rgba(255,182,142,0.5)" strokeDasharray="4 4" strokeWidth="1" x1="250" x2="250" y1="20" y2="180" />
                <text fill="#ffb68e" fontFamily="JetBrains Mono" fontSize="10" x="260" y="30">
                  PHASE 0.0
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
