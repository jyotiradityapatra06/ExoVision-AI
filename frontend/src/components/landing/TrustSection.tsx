"use client";

import { motion } from "framer-motion";
import { Database, Satellite, FileSpreadsheet } from "lucide-react";

export function TrustSection() {
  const cards = [
    {
      title: "NASA Kepler",
      subtitle: "TRANSIT PHOTOMETRY",
      description: "Multi-year space telescope observations and stellar flux measurements.",
      icon: Satellite,
      accent: "cyan",
      badge: "PRIMARY ARCHIVE",
    },
    {
      title: "NASA TESS",
      subtitle: "ALL-SKY SURVEY",
      description: "High cadence light curve data for discovering planetary candidates.",
      icon: Database,
      accent: "violet",
      badge: "HIGH CADENCE",
    },
    {
      title: "Custom Light Curves",
      subtitle: "USER DATASETS",
      description: "Upload FITS, CSV and TXT photometric datasets.",
      icon: FileSpreadsheet,
      accent: "amber",
      badge: "FLEXIBLE INGEST",
    },
  ];

  return (
    <section className="relative py-20 border-y border-cyan-500/10 bg-slate-950/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-cyan-400"
          >
            DATA COMPATIBILITY & SOURCES
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-3xl font-extrabold text-white sm:text-4xl"
          >
            Built on real astronomical data
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-400 text-base"
          >
            ExoVision AI natively ingests photometric space telescope archives and raw stellar light curve feeds.
          </motion.p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="group relative rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-300 hover:border-cyan-400/40 hover:bg-slate-900/80 hover:shadow-[0_0_30px_rgba(0,218,243,0.15)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-950/40 text-cyan-300 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-[10px] font-mono font-bold tracking-wider text-cyan-300">
                    {card.badge}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold text-white tracking-tight">
                  {card.title}
                </h3>
                <p className="text-xs font-mono font-semibold text-slate-400 tracking-wider uppercase mt-1">
                  {card.subtitle}
                </p>

                <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                  {card.description}
                </p>

                {/* Bottom line indicator */}
                <div className="mt-6 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-12 bg-gradient-to-r from-cyan-400 to-violet-500 group-hover:w-full transition-all duration-500" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
