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
    <div className="results-importance-panel" aria-labelledby="model-interpret-heading">
      <div className="results-panel-title">
        <div>
          <h3 id="model-interpret-heading">Model interpretation</h3>
          <p>Relative feature importance from the bundled Random Forest classifier</p>
        </div>
        <BrainCircuit className="h-4 w-4" />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Global feature importance metrics indicate which observable transit parameters carry the most weight in the Random Forest screening model across the training distribution. This is a model-level diagnostic, not a causal exoplanet confirmation.
      </p>

      <div className="results-feature-list">
        {items.length === 0 ? (
          <p className="py-4 text-xs font-mono text-slate-500">
            Feature attribution data was not recorded for this candidate.
          </p>
        ) : (
          items.map((item) => {
            const widthPct = Math.min(100, Math.max(8, (Math.abs(item.importance) / maxImportance) * 100));
            const formattedVal = item.importance >= 0 ? `+${item.importance.toFixed(3)}` : item.importance.toFixed(3);
            return (
              <div className="results-feature-item" key={item.feature}>
                <div className="results-feature-item-header">
                  <span className="results-feature-name">{item.feature}</span>
                  <span className="results-feature-val font-mono">{formattedVal}</span>
                </div>
                <div className="results-feature-track" role="progressbar" aria-valuenow={Math.round(widthPct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.feature} importance`}>
                  <div
                    className="results-feature-fill"
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
