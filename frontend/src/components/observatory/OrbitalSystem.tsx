export function OrbitalSystem({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`orbital-system${compact ? " is-compact" : ""}`} aria-hidden="true">
      <span className="orbital-glow" />
      <span className="orbital-ring orbital-ring-one"><i /></span>
      <span className="orbital-ring orbital-ring-two"><i /></span>
      <span className="orbital-ring orbital-ring-three"><i /></span>
      <span className="orbital-star" />
      <svg viewBox="0 0 460 100" preserveAspectRatio="none"><path d="M0 52 C62 49 103 55 152 51 S219 46 251 52 L265 52 L272 79 L280 23 L289 68 L300 52 C351 48 393 56 460 49" /></svg>
    </div>
  );
}
