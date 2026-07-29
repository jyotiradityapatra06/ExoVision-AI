"use client";

import { useEffect, useState } from "react";
import { Upload, Activity, Search, Sparkles, Orbit, CheckCircle2, AlertCircle } from "lucide-react";

interface HealthStatus {
  status: string;
  service: string;
  phase: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/v1/health`);
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch {
        // Backend not yet running locally
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="relative min-h-screen bg-space-gradient flex flex-col justify-between px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Navigation */}
      <header className="w-full max-w-7xl mx-auto py-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Orbit className="w-6 h-6 animate-spin-slow" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            Exo<span className="text-sky-400">Vision</span>
          </span>
        </div>

        {/* API Health Status Badge */}
        <div id="api-status-badge" className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          {loading ? (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          ) : health?.status === "healthy" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span className="text-slate-300">
            API Phase 1: {health?.status === "healthy" ? "Connected" : "Offline"}
          </span>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="w-full max-w-5xl mx-auto my-auto py-12 text-center z-10 flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Phase 1.1 Foundation</span>
        </div>

        {/* Main Title */}
        <h1 id="hero-title" className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          ExoVision AI
        </h1>

        {/* Subtitle */}
        <p id="hero-subtitle" className="mt-4 text-lg sm:text-xl md:text-2xl text-slate-300 font-medium max-w-2xl text-gradient">
          AI-Powered Exoplanet Transit Detection
        </p>

        <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl">
          A production-ready foundation for future analysis of Kepler, K2,
          and TESS photometric time-series data.
        </p>

        {/* Feature Cards Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Card 1 */}
          <div
            id="feature-card-upload"
            className="glass-card p-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Light-Curve Ingestion
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Planned support for FITS and CSV photometric time series from
              NASA mission archives.
            </p>
          </div>

          {/* Card 2 */}
          <div
            id="feature-card-detect"
            className="glass-card p-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Transit Detection
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Planned signal-processing and machine-learning workflows for
              identifying subtle flux dips.
            </p>
          </div>

          {/* Card 3 */}
          <div
            id="feature-card-analyse"
            className="glass-card p-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Candidate Analysis
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Planned diagnostics for distinguishing transit candidates from
              eclipsing binaries and stellar variability.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto py-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 z-10">
        <div>
          &copy; {new Date().getFullYear()} ExoVision AI. All rights reserved.
        </div>
        <div className="flex items-center space-x-6">
          <span>Phase 1.1 Foundation</span>
          <span>Next.js 15 + FastAPI</span>
        </div>
      </footer>
    </div>
  );
}
