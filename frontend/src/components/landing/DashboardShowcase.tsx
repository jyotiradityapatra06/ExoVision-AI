"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart as LineChartIcon,
  Layers,
  FileCheck2,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileText,
} from "lucide-react";

export function DashboardShowcase() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Candidate Overview", icon: Layers },
    { id: "lightcurve", label: "Light Curve Analysis", icon: LineChartIcon },
    { id: "phasefolded", label: "Phase Folded Transit", icon: Sliders },
    { id: "confidence", label: "AI Confidence Score", icon: Sparkles },
    { id: "report", label: "Scientific Report", icon: FileCheck2 },
  ];

  return (
    <section className="relative py-24 bg-slate-950/60 border-y border-cyan-500/10">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-cyan-400"
          >
            INTERACTIVE SAAS DASHBOARD PREVIEW
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl"
          >
            Scientific precision in a unified suite
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-400 text-base"
          >
            Explore how ExoVision AI displays candidate metrics, phase curves, confidence scores, and automated reports.
          </motion.p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-mono font-bold transition-all duration-300 ${
                  isActive
                    ? "border border-cyan-400/50 bg-cyan-950/60 text-cyan-300 shadow-[0_0_20px_rgba(0,218,243,0.3)]"
                    : "border border-white/5 bg-slate-900/40 text-slate-400 hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dashboard Mock Container */}
        <div className="relative rounded-3xl border border-cyan-500/30 bg-slate-950/90 p-4 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
          {/* Top Bar of Console */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                TARGET: KIC-8462852 // TIC-278824126
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-mono text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                CANDIDATE CONFIRMED
              </span>
            </div>
          </div>

          {/* Dynamic Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                  <span className="text-xs font-mono text-slate-400">PLANET RADIUS</span>
                  <p className="mt-2 text-3xl font-extrabold text-white">1.34 R<sub>⊕</sub></p>
                  <p className="mt-1 text-xs text-cyan-300">Super-Earth Class Candidate</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                  <span className="text-xs font-mono text-slate-400">ORBITAL PERIOD</span>
                  <p className="mt-2 text-3xl font-extrabold text-white">3.52 Days</p>
                  <p className="mt-1 text-xs text-violet-300">High Transit Recurrence</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                  <span className="text-xs font-mono text-slate-400">TRANSIT DEPTH</span>
                  <p className="mt-2 text-3xl font-extrabold text-white">480 ppm</p>
                  <p className="mt-1 text-xs text-emerald-300">High Signal-to-Noise Ratio</p>
                </div>
              </motion.div>
            )}

            {activeTab === "lightcurve" && (
              <motion.div
                key="lightcurve"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-mono text-cyan-300 font-bold">RAW FLUX vs TIME (DAYS)</h4>
                  <span className="text-xs font-mono text-slate-400">BLS DETECTED PERIOD: 3.524d</span>
                </div>
                {/* SVG Simulated Light Curve Graph */}
                <div className="h-48 w-full">
                  <svg className="h-full w-full overflow-visible" viewBox="0 0 500 150">
                    <path
                      d="M 0 40 L 80 38 L 100 42 L 120 40 L 140 120 L 160 120 L 180 39 L 260 41 L 280 122 L 300 122 L 320 40 L 420 38 L 440 121 L 460 121 L 480 40 L 500 39"
                      fill="none"
                      stroke="#00daf3"
                      strokeWidth="2.5"
                    />
                    <circle cx="150" cy="120" r="4" fill="#8b5cf6" />
                    <circle cx="290" cy="122" r="4" fill="#8b5cf6" />
                    <circle cx="450" cy="121" r="4" fill="#8b5cf6" />
                  </svg>
                </div>
              </motion.div>
            )}

            {activeTab === "phasefolded" && (
              <motion.div
                key="phasefolded"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-mono text-violet-300 font-bold">PHASE FOLDED TRANSIT DENSITY</h4>
                  <span className="text-xs font-mono text-emerald-400">SYMMETRIC U-SHAPE VALIDATED</span>
                </div>
                <div className="h-48 w-full flex items-center justify-center">
                  <svg className="h-full w-full" viewBox="0 0 500 150">
                    <path
                      d="M 0 30 Q 200 30, 220 110 Q 250 130, 280 110 Q 300 30, 500 30"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
              </motion.div>
            )}

            {activeTab === "confidence" && (
              <motion.div
                key="confidence"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
              >
                <div className="rounded-2xl border border-cyan-400/30 bg-cyan-950/30 p-6">
                  <span className="text-xs font-mono text-cyan-300">OVERALL CLASSIFICATION CONFIDENCE</span>
                  <p className="mt-2 text-5xl font-extrabold text-white">98.4%</p>
                  <p className="mt-2 text-xs text-slate-300">99.1% True Positive Ensemble Probability</p>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>CNN Deep Transit Net</span>
                    <span className="text-cyan-300">99.2%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Gradient Boosted Trees</span>
                    <span className="text-violet-300">97.8%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Random Forest Baseline</span>
                    <span className="text-emerald-300">98.1%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "report" && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
              >
                <div className="flex items-center gap-3 text-cyan-300 font-mono text-sm font-bold mb-3">
                  <FileText className="h-5 w-5" />
                  <span>AUTOMATED SCIENTIFIC REPORT PREVIEW</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Exportable PDF report generated containing Kepler light curve ID KIC-8462852, transit period, transit depth, stellar radius estimate, SHAP explainability matrices, and classification summary.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
