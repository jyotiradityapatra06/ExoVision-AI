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
  const isDarkCanvas = variant === "landing" || variant === "auth";

  if (!isDarkCanvas) {
    // Warm paper application canvas background — subtle, calm, no neon or blue glow
    return (
      <div
        className={`pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#F7F5EF] ${className}`.trim()}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #0f172a 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>
    );
  }

  // Cinematic deep landing & auth background
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07090D] ${className}`.trim()}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

