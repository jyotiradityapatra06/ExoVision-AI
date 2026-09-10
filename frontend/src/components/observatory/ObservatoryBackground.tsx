export type AtmosphereVariant =
  | "landing"
  | "auth"
  | "dashboard"
  | "upload"
  | "datasets"
  | "demo"
  | "results"
  | "reports"
  | "default";

export function ObservatoryBackground({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: AtmosphereVariant;
}) {
  return (
    <div
      className={`observatory-background obs-variant-${variant} pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`.trim()}
      aria-hidden="true"
    >
      {/* Subtle top spotlight reminiscent of Linear/Vercel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[340px] bg-gradient-to-b from-sky-500/[0.04] via-cyan-500/[0.015] to-transparent blur-3xl pointer-events-none" />

      {/* Subtle Cartesian dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}

