"use client";

import { Activity, BrainCircuit, CheckCircle2, Cpu, Database, Filter, LoaderCircle, Sparkles } from "lucide-react";

export type PipelineStage = "idle" | "uploading" | "fits" | "detecting" | "classifying" | "reporting";

const stages = [
  {
    id: "uploading",
    title: "Uploading Dataset...",
    detail: "Ingesting photometric light curve file",
    icon: Database,
  },
  {
    id: "fits",
    title: "Processing FITS Header",
    detail: "Parsing metadata, cadence & flux normalization",
    icon: Filter,
  },
  {
    id: "detecting",
    title: "Detecting Transit Signal",
    detail: "Box-Least-Squares (BLS) periodogram search",
    icon: Activity,
  },
  {
    id: "classifying",
    title: "Classifying AI Model",
    detail: "Deep 1D Convolutional Neural Network prediction",
    icon: Cpu,
  },
  {
    id: "reporting",
    title: "Generating Report",
    detail: "SHAP feature attributions & AAS report compilation",
    icon: Sparkles,
  },
];

export function PipelineVisualization({ currentStage }: { currentStage: PipelineStage }) {
  const getStageStatus = (stageId: string) => {
    const order = ["idle", "uploading", "fits", "detecting", "classifying", "reporting"];
    const currentIndex = order.indexOf(currentStage);
    const targetIndex = order.indexOf(stageId);

    if (currentIndex > targetIndex || currentStage === "reporting") return "done";
    if (currentIndex === targetIndex) return "active";
    return "pending";
  };

  const getProgressPercent = () => {
    switch (currentStage) {
      case "uploading": return 20;
      case "fits": return 45;
      case "detecting": return 70;
      case "classifying": return 88;
      case "reporting": return 100;
      default: return 0;
    }
  };

  const percent = getProgressPercent();

  return (
    <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl flex flex-col relative overflow-hidden hud-border">
      {/* Panel Header */}
      <div className="border-b border-outline-variant/30 p-4 bg-surface-container/50 flex justify-between items-center">
        <span className="font-label-caps text-xs text-primary flex items-center gap-2 font-bold">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Processing Pipeline
        </span>
        <BrainCircuit className="h-4 w-4 text-outline" />
      </div>

      {/* HUD Visualizer */}
      <div className="p-6 flex flex-col items-center justify-center relative">
        {/* Circular Progress HUD */}
        <div className="relative w-44 h-44 mb-6 flex items-center justify-center">
          {/* Outer Ring */}
          <svg className="absolute inset-0 w-full h-full spin-slow opacity-30" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="none" r="48" stroke="#00daf3" strokeDasharray="4 2" strokeWidth="0.5" />
          </svg>
          {/* Middle Ring (Dashed) */}
          <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] spin-reverse-slow opacity-50" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="none" r="45" stroke="#849396" strokeDasharray="10 5 2 5" strokeWidth="1" />
          </svg>
          {/* Main Progress Ring */}
          <svg className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="none" r="40" stroke="#3b494c" strokeWidth="3" />
            <circle
              className="transition-all duration-500 ease-out"
              cx="50"
              cy="50"
              fill="none"
              r="40"
              stroke="#00daf3"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (percent / 100) * 251.2}
              strokeWidth="3"
            />
          </svg>
          {/* Inner Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center font-data-mono">
            <span className="text-3xl font-bold text-primary">{percent}%</span>
            <span className="text-[9px] text-outline tracking-widest mt-0.5">SEQ_PROG</span>
          </div>
        </div>

        {/* Pipeline Steps List */}
        <div className="w-full space-y-3 font-data-mono text-xs">
          {stages.map((stage) => {
            const status = getStageStatus(stage.id);
            return (
              <div
                key={stage.id}
                className={`flex items-center justify-between p-2.5 rounded border transition-colors ${
                  status === "done"
                    ? "text-secondary border-secondary/30 bg-secondary/10"
                    : status === "active"
                    ? "text-primary border-primary/50 bg-primary/10 shadow-[0_0_10px_rgba(0,218,243,0.15)]"
                    : "text-outline border-outline-variant/20 bg-surface-container/30"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {status === "done" && <CheckCircle2 className="h-4 w-4 text-secondary" />}
                  {status === "active" && <LoaderCircle className="h-4 w-4 animate-spin text-primary" />}
                  {status === "pending" && <span className="h-2 w-2 rounded-full bg-outline-variant block ml-1 mr-1" />}
                  <span className="font-bold">{stage.title}</span>
                </div>
                <span className="text-[10px] opacity-70 uppercase">
                  {status === "done" ? "DONE" : status === "active" ? "ACTIVE" : "WAITING"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
