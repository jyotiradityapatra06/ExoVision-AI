"use client";

import { motion } from "framer-motion";
import { GraduationCap, Microscope, Sparkles, School } from "lucide-react";

export function ApplicationsSection() {
  const useCases = [
    {
      title: "Students",
      description: "Hands-on astrophysics learning & real space mission research projects.",
      icon: GraduationCap,
      accent: "text-cyan-300",
    },
    {
      title: "Researchers",
      description: "Light-curve transit screening and candidate assessment.",
      icon: Microscope,
      accent: "text-violet-300",
    },
    {
      title: "Astronomy Enthusiasts",
      description: "Citizen science exoplanet hunting with transparent AI model outputs.",
      icon: Sparkles,
      accent: "text-amber-300",
    },
    {
      title: "Educational Institutions",
      description: "Interactive classroom tool for teaching photometry, AI, and orbital mechanics.",
      icon: School,
      accent: "text-emerald-300",
    },
  ];

  return (
    <section className="relative py-24 bg-slate-950/40 border-y border-white/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-cyan-400"
          >
            APPLICATIONS & USE CASES
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl"
          >
            Empowering astronomers at all levels
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md transition-all duration-300 hover:border-cyan-400/40 hover:bg-slate-900/80 hover:shadow-xl"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 ${item.accent} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-white tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
