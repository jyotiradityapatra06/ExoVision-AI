"use client";

import { motion } from "framer-motion";
import { Gauge, Orbit, ShieldCheck, Layers } from "lucide-react";

export function MissionStats() {
  const stats = [
    {
      value: "3 Formats",
      label: "Observation Inputs",
      detail: "FITS, CSV, and TXT light curves",
      icon: Gauge,
      accent: "text-cyan-300",
    },
    {
      value: "Kepler + TESS",
      label: "Supported Missions",
      detail: "Public MAST light-curve search",
      icon: Orbit,
      accent: "text-violet-300",
    },
    {
      value: "Random Forest",
      label: "Candidate Classifier",
      detail: "Feature-based screening model",
      icon: ShieldCheck,
      accent: "text-emerald-300",
    },
    {
      value: "5 Stage",
      label: "Detection Pipeline",
      detail: "Raw flux to explainable report",
      icon: Layers,
      accent: "text-amber-300",
    },
  ];

  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="relative rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-8 sm:p-12 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)]">
          {/* Subtle Grid Accent Pattern */}
          <div className="absolute inset-0 hud-grid-pattern opacity-30 rounded-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-cyan-500/15">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex flex-col items-center text-center ${idx !== 0 ? "pt-8 sm:pt-0 sm:pl-6 lg:pl-8" : ""}`}
                >
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/60 ${stat.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {stat.value}
                  </span>

                  <span className="mt-2 text-sm font-semibold text-cyan-200">
                    {stat.label}
                  </span>

                  <span className="mt-1 text-xs text-slate-400">
                    {stat.detail}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
