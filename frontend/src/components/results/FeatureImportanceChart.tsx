"use client";

import { BrainCircuit } from "lucide-react";

export function FeatureImportanceChart({
  attributions,
}: {
  attributions?: Array<{ feature: string; importance: number; direction: string }>;
}) {
  const items = attributions ?? [];
  const maxImportance = Math.max(...items.map((i) => Math.abs(i.importance)), 0.01);

  return (
    <div className="bg-white border border-[#090D0F]/10 rounded p-6 sm:p-8" aria-labelledby="model-interpret-heading">
      <div className="flex items-center justify-between pb-4 border-b border-[#090D0F]/10 mb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold block">
            SHAP Attribution Weights
          </span>
          <h3 id="model-interpret-heading" className="font-serif text-2xl font-medium text-[#090D0F] mt-0.5">
            Model Feature Interpretation
          </h3>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Contribution vectors from the Random Forest classifier across observable parameters
          </p>
        </div>
        <BrainCircuit className="w-4 h-4 text-zinc-500 shrink-0" />
      </div>

      <p className="text-xs text-zinc-600 font-sans leading-relaxed mb-6">
        Feature attributions indicate which parameters (transit depth, orbital period, ingress duration,
        and centroid consistency) carried the highest relative weight during the classification step.
      </p>

      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="py-4 text-xs font-mono text-zinc-400">
            Feature attribution metrics were not recorded for this observation.
          </p>
        ) : (
          items.map((item) => {
            const widthPct = Math.min(100, Math.max(8, (Math.abs(item.importance) / maxImportance) * 100));
            const formattedVal = item.importance >= 0 ? `+${item.importance.toFixed(3)}` : item.importance.toFixed(3);
            const isPositive = item.importance >= 0;
            return (
              <div key={item.feature} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-medium text-zinc-800">{item.feature}</span>
                  <span className={isPositive ? "text-emerald-700 font-semibold" : "text-amber-800 font-semibold"}>
                    {formattedVal}
                  </span>
                </div>
                <div
                  className="h-2 w-full bg-[#FAF9F5] rounded border border-[#090D0F]/10 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(widthPct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.feature} attribution weight`}
                >
                  <div
                    className={`h-full rounded-sm transition-all duration-300 ${
                      isPositive ? "bg-emerald-600" : "bg-amber-600"
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
