"use client";

import { motion } from "framer-motion";
import { CheckCircle, Brain, Binary, Eye } from "lucide-react";

export function AIInsightSection() {
  const pillars = [
    {
      title: "Automated Light Curve Analysis",
      desc: "Remove systematic stellar variability, instrumental noise, and cosmic ray outliers automatically.",
    },
    {
      title: "Transit Detection",
      desc: "Identify recurring periodic dips in stellar brightness down to parts-per-million sensitivity.",
    },
    {
      title: "Candidate Ranking",
      desc: "Score transit signals with the deployed Random Forest classifier and its trained feature set.",
    },
    {
      title: "Explainable Predictions",
      desc: "Inspect model feature importance alongside transit depth, duration, shape, and signal evidence.",
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* LEFT: TEXT */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-950/40 px-3.5 py-1.5 text-xs font-mono font-bold text-violet-300">
              <Brain className="h-3.5 w-3.5 text-violet-400" />
              <span>INTERPRETABLE ML PIPELINE</span>
            </div>

            <h2 className="mt-6 text-3xl font-extrabold text-white sm:text-5xl leading-tight">
              AI meets astrophysics.{" "}
              <span className="block bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                Discovery made simple.
              </span>
            </h2>

            <p className="mt-6 text-slate-300 text-base leading-relaxed">
              ExoVision AI bridges complex astronomical signal processing and modern machine learning to automate exoplanet validation without black-box opacity.
            </p>

            <div className="mt-8 space-y-5">
              {pillars.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-4 rounded-xl border border-white/5 bg-slate-900/40 p-3.5 backdrop-blur-sm transition-colors hover:border-cyan-500/30 hover:bg-slate-900/70"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/60 text-cyan-300">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-400 leading-normal">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: SCIENTIFIC VISUALIZATION CARDS */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-3xl border border-violet-500/30 bg-slate-950/80 p-6 shadow-[0_0_60px_rgba(139,92,246,0.15)] backdrop-blur-2xl">
              {/* Header inside visualization box */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-violet-300">
                  <Eye className="h-4 w-4 text-violet-400" />
                  <span>MODEL FEATURE IMPORTANCE</span>
                </div>
                <span className="rounded bg-violet-500/20 px-2 py-0.5 text-[10px] font-mono text-violet-300">
                  MODEL VERSION v2.4
                </span>
              </div>

              {/* Feature Importance Mock Bars */}
              <div className="mt-6 space-y-4 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Transit Depth (ppm)</span>
                    <span className="text-cyan-300">0.48 WEIGHT</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "88%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Phase Shape Symmetry</span>
                    <span className="text-violet-300">0.32 WEIGHT</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "72%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.4 }}
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Odd-Even Transit Consistency</span>
                    <span className="text-emerald-300">0.15 WEIGHT</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "45%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Stellar Noise Ratio (SNR)</span>
                    <span className="text-amber-300">0.09 WEIGHT</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "30%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Insight Badge */}
              <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-950/30 p-4 text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1">
                  <Binary className="h-4 w-4" />
                  <span>PREDICTION SYNTHESIS</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  High transit depth combined with U-shaped ingress/egress profile strongly disfavors binary star contamination. Candidate classified as terrestrial planet.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
