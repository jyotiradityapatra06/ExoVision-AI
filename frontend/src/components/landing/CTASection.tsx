"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Telescope, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/15 blur-[160px]" />
        <div className="absolute right-1/3 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-600/20 blur-[150px]" />
      </div>

      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 p-10 sm:p-16 text-center shadow-[0_0_80px_rgba(6,182,212,0.2)] backdrop-blur-2xl"
        >
          {/* Top HUD decoration */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/50 px-4 py-1.5 text-xs font-mono font-bold tracking-[0.2em] text-cyan-300 shadow-[0_0_15px_rgba(0,218,243,0.2)] mb-6">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>READY TO EXPLORE THE COSMOS?</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white sm:text-5xl lg:text-6xl tracking-tight leading-tight">
            Analyze your first{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(0,218,243,0.3)]">
              stellar signal
            </span>
          </h2>

          <p className="mt-6 max-w-xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Upload your photometry data or select a pre-loaded NASA Kepler target to generate explainable exoplanet candidate reports in seconds.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/upload"
              className="group inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 px-9 font-bold text-slate-950 shadow-[0_0_30px_rgba(0,218,243,0.5)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,218,243,0.8)] hover:scale-105 active:scale-95 text-base"
            >
              <span>Start Analysis</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex h-14 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-cyan-400/50 hover:bg-cyan-950/30 text-base"
            >
              View System Dashboard
            </Link>
          </div>

          {/* Bottom badge details */}
          <div className="mt-10 flex items-center justify-center gap-6 text-xs font-mono text-slate-400 border-t border-white/10 pt-6">
            <span className="flex items-center gap-1.5">
              <Telescope className="h-3.5 w-3.5 text-cyan-400" />
              NO CREDENTIALS REQUIRED FOR DEMO
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-400">INSTANT EXPORT TO PDF & CSV</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
