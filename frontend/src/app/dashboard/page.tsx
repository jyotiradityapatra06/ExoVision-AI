"use client";

import {
  Activity,
  Cpu,
  Eye,
  Orbit,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { AnalysisHistoryItem } from "@/types/api";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    api
      .analysisHistory()
      .then((data) => {
        if (isSubscribed) {
          setHistory(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setHistory([]);
          setLoading(false);
        }
      });
    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <main className="flex-grow pt-24 pb-8 px-gutter md:px-margin max-w-[1600px] mx-auto w-full flex flex-col gap-6 relative z-10">
      {/* Global Status Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary tracking-tight">
            MISSION DASHBOARD
          </h1>
          <p className="font-data-mono text-data-mono text-outline uppercase mt-1">
            Welcome, {user?.display_name || "Commander"}{" // "}SYS.OP.STATUS:{" "}
            <span className="text-secondary-fixed-dim">NOMINAL</span>{" // "}T+ 42:18:09:44
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/upload"
            className="bg-primary/10 border border-primary text-primary font-label-caps text-label-caps px-4 py-2 hover:bg-primary/20 transition-all shadow-[0_0_10px_rgba(0,218,243,0.2)] flex items-center gap-2 font-bold"
          >
            <Upload className="h-4 w-4" /> UPLOAD DATASET
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass-panel p-4 flex flex-col justify-between relative corner-bracket-tl">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-outline uppercase">Total Analyses</span>
            <Activity className="h-4 w-4 text-outline" />
          </div>
          <div className="font-headline-md text-on-surface font-data-mono tracking-wider">
            {history.length ? String(history.length) : "12,482"}
          </div>
          <div className="h-1 w-full bg-surface-container mt-2">
            <div className="h-full bg-outline-variant w-full" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel p-4 flex flex-col justify-between relative corner-bracket-tl hud-border hud-glow">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-primary uppercase">Candidates Found</span>
            <Star className="h-4 w-4 text-primary" />
          </div>
          <div className="font-headline-md text-primary font-data-mono tracking-wider">842</div>
          <div className="h-1 w-full bg-surface-container mt-2">
            <div className="h-full bg-primary w-[65%] shadow-[0_0_5px_rgba(0,218,243,0.8)]" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel p-4 flex flex-col justify-between relative corner-bracket-tl">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-outline uppercase">Avg Confidence</span>
            <Sparkles className="h-4 w-4 text-ai-accent" />
          </div>
          <div className="font-headline-md text-ai-accent font-data-mono tracking-wider shimmer-text">
            92.1%
          </div>
          <div className="h-1 w-full bg-surface-container mt-2">
            <div className="h-full bg-ai-accent w-[92%]" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel p-4 flex flex-col justify-between relative corner-bracket-tl">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-outline uppercase">Reports Gen.</span>
            <Activity className="h-4 w-4 text-outline" />
          </div>
          <div className="font-headline-md text-on-surface font-data-mono tracking-wider">156</div>
          <div className="h-1 w-full bg-surface-container mt-2">
            <div className="h-full bg-outline-variant w-[30%]" />
          </div>
        </div>
      </div>

      {/* Main Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left Col: Charts (Spans 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Primary Light Curve Chart */}
          <div className="glass-panel flex flex-col corner-bracket-tl corner-bracket-br relative overflow-hidden min-h-[400px]">
            <div className="border-b border-outline-variant/30 p-3 flex justify-between items-center bg-surface-dim/50">
              <div className="flex items-center gap-3">
                <Orbit className="h-4 w-4 text-primary" />
                <span className="font-label-caps text-label-caps text-on-surface">
                  FLUX DEVIATION ANALYSIS (KIC-8462852)
                </span>
              </div>
              <div className="flex gap-2">
                <button type="button" className="text-outline hover:text-primary text-[12px] font-data-mono border border-outline-variant/50 px-2 py-0.5">
                  1D
                </button>
                <button type="button" className="text-background bg-primary text-[12px] font-data-mono px-2 py-0.5">
                  7D
                </button>
                <button type="button" className="text-outline hover:text-primary text-[12px] font-data-mono border border-outline-variant/50 px-2 py-0.5">
                  30D
                </button>
              </div>
            </div>

            <div className="flex-grow p-4 relative flex items-center justify-center">
              <div className="absolute left-10 top-10 bottom-10 w-px bg-outline-variant/30 flex flex-col justify-between text-[10px] font-data-mono text-outline-variant pr-2 text-right">
                <span>1.02</span><span>1.00</span><span>0.98</span><span>0.96</span>
              </div>
              <div className="absolute left-10 bottom-10 right-10 h-px bg-outline-variant/30 flex justify-between text-[10px] font-data-mono text-outline-variant pt-2">
                <span>0.0</span><span>0.5</span><span>1.0</span><span>1.5</span><span>2.0</span>
              </div>
              <div className="relative w-full h-full ml-12 mb-8 flex items-center justify-center">
                <svg className="w-full h-full opacity-80 drop-shadow-[0_0_10px_rgba(0,218,243,0.8)]" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,15 L35,15 C40,15 45,35 50,35 C55,35 60,15 65,15 L100,15" fill="none" stroke="#00daf3" strokeWidth="1.8" />
                  <line stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" x1="0" x2="100" y1="35" y2="35" />
                  <line stroke="rgba(0,218,243,0.3)" strokeDasharray="2,2" strokeWidth="0.5" x1="50" x2="50" y1="0" y2="40" />
                </svg>
              </div>
              <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 bg-surface/90 border border-ai-accent p-3 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <div className="font-label-caps text-label-caps text-ai-accent mb-1 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> AI INSIGHT
                </div>
                <div className="font-data-mono text-data-mono text-on-surface">Transit Signature Detected</div>
                <div className="font-data-mono text-[12px] text-outline mt-1">Period: 3.52 Days</div>
              </div>
            </div>
          </div>

          {/* Secondary Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-3 corner-bracket-tl h-[250px] flex flex-col">
              <div className="font-label-caps text-label-caps text-outline mb-2 border-b border-outline-variant/30 pb-2">
                PHASE FOLDING
              </div>
              <div className="flex-grow flex items-center justify-center relative">
                <svg className="w-full h-32 opacity-80" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M 0 15 Q 40 15 48 35 Q 52 35 60 15 Q 80 15 100 15" fill="none" stroke="#ffb68e" strokeWidth="2" />
                </svg>
              </div>
            </div>

            <div className="glass-panel p-3 corner-bracket-tl h-[250px] flex flex-col">
              <div className="font-label-caps text-label-caps text-outline mb-2 border-b border-outline-variant/30 pb-2">
                SPECTRAL ANALYSIS
              </div>
              <div className="flex-grow flex items-center justify-center relative bg-surface-container-lowest/60 rounded p-4">
                <div className="space-y-2 w-full font-data-mono text-[12px]">
                  <div className="flex justify-between text-outline"><span>0.0094 Depth</span><span className="text-primary">Attribution 34%</span></div>
                  <div className="w-full bg-surface-variant h-1.5 rounded"><div className="bg-primary h-full w-[85%]" /></div>
                  <div className="flex justify-between text-outline mt-2"><span>Symmetry</span><span className="text-ai-accent">Attribution 26%</span></div>
                  <div className="w-full bg-surface-variant h-1.5 rounded"><div className="bg-ai-accent h-full w-[70%]" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Telemetry & Tables (Spans 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-4 corner-bracket-tl">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3 mb-4">
              <span className="font-label-caps text-label-caps text-on-surface">NEURAL PIPELINE TELEMETRY</span>
              <Cpu className="h-4 w-4 text-secondary-fixed-dim" />
            </div>

            <div className="flex justify-around items-center mb-6">
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle className="orbital-path" cx="32" cy="32" r="28" />
                    <circle className="orbital-progress" cx="32" cy="32" r="28" strokeDasharray="175" strokeDashoffset="35" />
                  </svg>
                  <span className="font-data-mono text-data-mono text-primary z-10 font-bold">80%</span>
                </div>
                <span className="font-label-caps text-[10px] text-outline text-center">CPU LOAD</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle className="orbital-path" cx="32" cy="32" r="28" />
                    <circle className="orbital-progress" cx="32" cy="32" r="28" stroke="#8B5CF6" strokeDasharray="175" strokeDashoffset="10" />
                  </svg>
                  <span className="font-data-mono text-data-mono text-ai-accent z-10 shimmer-text font-bold">94%</span>
                </div>
                <span className="font-label-caps text-[10px] text-outline text-center">MEM ALLOC</span>
              </div>
            </div>

            <div className="space-y-3 font-data-mono text-[12px]">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-1">
                <span className="text-outline">Active Models</span>
                <span className="text-on-surface">Transit_Net_v4, Spec_RNN</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-1">
                <span className="text-outline">Data Ingest Rate</span>
                <span className="text-primary font-bold">4.2 GB/s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Latency</span>
                <span className="text-secondary-fixed-dim font-bold">12ms</span>
              </div>
            </div>
          </div>

          <div className="glass-panel flex flex-col flex-grow corner-bracket-tl overflow-hidden">
            <div className="border-b border-outline-variant/30 p-3 bg-surface-dim/50">
              <span className="font-label-caps text-label-caps text-on-surface">RECENT OBSERVATIONS</span>
            </div>

            <div className="overflow-x-auto p-2">
              {loading ? (
                <div className="p-8 text-center font-data-mono text-xs text-outline">Loading telemetry...</div>
              ) : (
                <table className="w-full text-left border-collapse font-data-mono text-[12px]">
                  <thead>
                    <tr>
                      <th className="font-label-caps text-[10px] text-outline pb-2 pl-2 border-b border-outline-variant/30 uppercase">Target ID</th>
                      <th className="font-label-caps text-[10px] text-outline pb-2 border-b border-outline-variant/30 uppercase">Status</th>
                      <th className="font-label-caps text-[10px] text-outline pb-2 pr-2 border-b border-outline-variant/30 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length ? (
                      history.map((item) => (
                        <tr key={item.id} className="hover:bg-primary/5 transition-colors group cursor-crosshair">
                          <td className="py-2 pl-2 text-primary border-b border-outline-variant/10 font-bold truncate max-w-[110px]">
                            {item.filename}
                          </td>
                          <td className="py-2 border-b border-outline-variant/10">
                            <span className="text-secondary-fixed-dim uppercase font-bold">{item.status}</span>
                          </td>
                          <td className="py-2 pr-2 text-right border-b border-outline-variant/10">
                            <Link href={`/results/${item.id}`} className="text-primary hover:underline flex items-center justify-end gap-1 font-bold">
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-primary/5 transition-colors group cursor-crosshair">
                        <td className="py-2 pl-2 text-primary border-b border-outline-variant/10">KIC-8462852</td>
                        <td className="py-2 border-b border-outline-variant/10"><span className="text-secondary-fixed-dim font-bold">Analysing</span></td>
                        <td className="py-2 pr-2 text-right border-b border-outline-variant/10"><Eye className="h-3.5 w-3.5 inline text-primary" /></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
