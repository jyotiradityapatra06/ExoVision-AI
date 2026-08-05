"use client";

export function FeatureImportanceChart({
  attributions,
}: {
  attributions?: Array<{ feature: string; importance: number; direction: string }>;
}) {
  const defaultAttributions = [
    { feature: "Symmetry (U-Shape)", importance: 0.42, direction: "positive" },
    { feature: "Periodicity", importance: 0.38, direction: "positive" },
    { feature: "Secondary Eclipse Absence", importance: 0.15, direction: "positive" },
  ];

  const items = attributions?.length ? attributions : defaultAttributions;

  return (
    <div className="hud-border p-6 hud-corner hud-corner-tr hud-corner-bl rounded-xl bg-surface-container/60 backdrop-blur-md">
      <h2 className="font-label-caps text-xs text-ai-accent border-b border-ai-accent/30 pb-2 mb-4 flex items-center gap-2 font-bold tracking-widest uppercase">
        <span className="h-2 w-2 rounded-full bg-ai-accent animate-pulse" />
        AI FEATURE IMPORTANCE
      </h2>
      <div className="space-y-4 font-data-mono text-xs">
        {items.map((item) => (
          <div key={item.feature}>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-on-surface font-semibold">{item.feature}</span>
              <span className="text-primary font-bold">
                {item.importance > 0 ? `+${item.importance.toFixed(2)}` : item.importance.toFixed(2)}
              </span>
            </div>
            <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#00e5ff]"
                style={{ width: `${Math.min(100, Math.max(10, item.importance * 200))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
