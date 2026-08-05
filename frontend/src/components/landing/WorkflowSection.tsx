"use client";

import { motion } from "framer-motion";
import { Upload, Filter, Radio, Brain, FileCheck } from "lucide-react";

export function WorkflowSection() {
  const steps = [
    {
      num: "01",
      title: "Upload Data",
      desc: "Ingest CSV, FITS, or NASA Kepler/TESS target pixel light curves.",
      icon: Upload,
      accent: "cyan",
    },
    {
      num: "02",
      title: "Preprocessing",
      desc: "Median filtering, detrending, and outlier flux normalization.",
      icon: Filter,
      accent: "blue",
    },
    {
      num: "03",
      title: "BLS Transit Detection",
      desc: "Box-Least-Squares periodogram search for candidate dips.",
      icon: Radio,
      accent: "violet",
    },
    {
      num: "04",
      title: "ML Classification",
      desc: "Ensemble neural model evaluates exoplanet vs false positive probability.",
      icon: Brain,
      accent: "purple",
    },
    {
      num: "05",
      title: "Explainable Report",
      desc: "SHAP feature attribution & downloadable scientific dossier.",
      icon: FileCheck,
      accent: "emerald",
    },
  ];

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-cyan-400"
          >
            END-TO-END PIPELINE ARCHITECTURE
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl"
          >
            Five steps from flux to verdict
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-400 text-base"
          >
            Automated, reproducible, and mathematically rigorous signal analysis.
          </motion.p>
        </div>

        {/* Timeline Desktop & Mobile grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-1/3 left-10 right-10 h-0.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 opacity-30 -z-0" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12 }}
                className="group relative z-10 flex flex-col items-center text-center rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40 hover:bg-slate-900/90 hover:shadow-[0_0_30px_rgba(0,218,243,0.15)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-slate-950/80 text-cyan-300 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-6 w-6" />
                </div>

                <span className="mt-4 text-xs font-mono font-bold tracking-widest text-cyan-400">
                  STEP {step.num}
                </span>

                <h3 className="mt-2 text-lg font-bold text-white tracking-tight">
                  {step.title}
                </h3>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
