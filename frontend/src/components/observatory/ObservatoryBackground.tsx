export function ObservatoryBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`observatory-background ${className}`.trim()} aria-hidden="true">
      <span className="observatory-nebula" />
      <span className="star-layer star-layer-far" />
      <span className="star-layer star-layer-mid" />
      <span className="observatory-coordinate-arc" />
      <span className="shooting-star" />
    </div>
  );
}
