"use client";

import { motion } from "framer-motion";
import { Activity, Cpu, Sparkles, FileText, ArrowUpRight } from "lucide-react";

export function FeatureCards() {
  const features = [
    {
      title: "Transit-like Signal Detection",
      description: "Automated period search, phase folding, and transit detection using Box Least Squares.",
      icon: Activity,
      gradient: "from-cyan-500/20 to-blue-500/10",
      accentColor: "text-cyan-300",
      borderColor: "group-hover:border-cyan-400/50",
      tag: "SIGNAL PROCESSING",
    },
    {
      title: "Machine Learning Classification",
      description: "Candidate scoring with the deployed Random Forest model and extracted astronomical features.",
      icon: Cpu,
      gradient: "from-violet-500/20 to-indigo-500/10",
      accentColor: "text-violet-300",
      borderColor: "group-hover:border-violet-400/50",
      tag: "RANDOM FOREST",
    },
    {
      title: "Explainable AI",
      description: "Interpret a model score through feature importance and measured transit evidence.",
      icon: Sparkles,
      gradient: "from-purple-500/20 to-pink-500/10",
      accentColor: "text-purple-300",
      borderColor: "group-hover:border-purple-400/50",
      tag: "INTERPRETABLE AI",
    },
    {
      title: "Scientific Reports",
      description: "Generate structured reports with transit period, depth, signal-to-noise measurements, and candidate evidence.",
      icon: FileText,
      gradient: "from-amber-500/20 to-emerald-500/10",
      accentColor: "text-amber-300",
      borderColor: "group-hover:border-amber-400/50",
      tag: "EXPORTABLE DOSSIERS",
    },
  ];

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-cyan-400"
            >
              CORE PLATFORM CAPABILITIES
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl"
            >
              Engineered for candidate screening
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-md text-slate-400 text-sm leading-relaxed"
          >
            An end-to-end scientific pipeline transforming raw photometric flux into reproducible exoplanet candidate classifications.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl transition-all duration-300 ${item.borderColor} hover:bg-slate-900/80 hover:shadow-2xl hover:-translate-y-1`}
              >
                {/* Background Subtle Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none`} />

                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-slate-950/60 ${item.accentColor} shadow-inner`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 bg-slate-800/60 border border-slate-700/50 px-2.5 py-1 rounded-md">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-cyan-200 transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-400 group-hover:text-cyan-300 transition-colors">
                  <span>EXPLORE MODULE</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
