"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";

interface Waypoint {
  id: string;
  code: string;
  name: string;
  depth: string;
}

const waypoints: Waypoint[] = [
  { id: "hero", code: "00", name: "OBSERVATORY CORE", depth: "0.00 AU" },
  { id: "archives-strip", code: "01", name: "MAST INGESTION", depth: "1.00 AU" },
  { id: "observe", code: "02", name: "APERTURE TELEMETRY", depth: "1.45 AU" },
  { id: "analyze", code: "03", name: "BLS PERIODOGRAM", depth: "3.20 AU" },
  { id: "interpret", code: "04", name: "AI ASTROPHYSICS", depth: "5.80 AU" },
  { id: "archive", code: "05", name: "RESEARCH DOSSIER", depth: "8.40 AU" },
  { id: "gateway", code: "06", name: "MISSION GATEWAY", depth: "10.2 AU" },
];

export function ObservatoryScrollTracker() {
  const [activeId, setActiveId] = useState("hero");
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = Math.min(100, Math.max(0, Math.round((scrollY / docHeight) * 100)));
      setScrollPercent(pct);

      // Find closest waypoint based on vertical position
      for (let i = waypoints.length - 1; i >= 0; i--) {
        const el = document.getElementById(waypoints[i].id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= window.innerHeight * 0.45) {
            setActiveId(waypoints[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToWaypoint = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const currentWaypoint = waypoints.find((w) => w.id === activeId) || waypoints[0];

  return (
    <aside
      aria-label="Observatory Scroll Telemetry"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-3 font-mono text-[10px]"
    >
      {/* Active Depth Radar Readout Pill */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="px-3 py-1.5 rounded-lg border border-white/[0.12] bg-[#07090D]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center gap-2.5 text-zinc-300"
      >
        <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
        <span className="text-amber-300 font-semibold">{currentWaypoint.depth}</span>
        <span className="text-zinc-600">·</span>
        <span className="text-zinc-400">{scrollPercent}% DEPTH</span>
      </motion.div>

      {/* Vertical Astrometric Rail */}
      <div className="relative py-3 px-2 rounded-2xl border border-white/[0.1] bg-[#07090D]/80 backdrop-blur-xl shadow-[0_12px_44px_rgba(0,0,0,0.7)] flex flex-col items-center gap-4">
        {/* Continuous Guide Line */}
        <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-px bg-white/[0.08]" />

        {waypoints.map((wp) => {
          const isActive = activeId === wp.id;
          return (
            <button
              key={wp.id}
              onClick={() => scrollToWaypoint(wp.id)}
              className="group relative flex items-center justify-center w-7 h-7 rounded-full focus:outline-none transition-transform hover:scale-110"
              title={`${wp.name} (${wp.depth})`}
            >
              {/* Waypoint Marker Ring */}
              <div
                className={`relative z-10 w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-amber-400 shadow-[0_0_12px_#f59e0b] scale-125 ring-4 ring-amber-400/20"
                    : "bg-zinc-600 hover:bg-zinc-300 group-hover:ring-2 group-hover:ring-white/20"
                }`}
              />

              {/* Tooltip on Hover or when Active */}
              <AnimatePresence>
                {(isHovered || isActive) && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute right-10 whitespace-nowrap px-2.5 py-1 rounded border backdrop-blur-md transition-colors pointer-events-none ${
                      isActive
                        ? "border-amber-400/40 bg-[#0A0F1A]/95 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.2)]"
                        : "border-white/[0.08] bg-[#07090D]/90 text-zinc-400"
                    }`}
                  >
                    <span className="text-[9px] text-zinc-500 mr-1.5">{wp.code}</span>
                    <span className="font-semibold">{wp.name}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
