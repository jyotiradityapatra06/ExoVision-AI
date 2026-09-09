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
  // Results view requires deep optical black without distracting drifting stars so photometric charts dominate
  const isResults = variant === "results";
  const isUpload = variant === "upload";
  const isDatasets = variant === "datasets";
  const isDemo = variant === "demo";
  const isLanding = variant === "landing";
  const isAuth = variant === "auth";

  return (
    <div
      className={`observatory-background obs-variant-${variant} ${className}`.trim()}
      aria-hidden="true"
    >
      {/* Deep optical haze - suppressed on results workbench */}
      {!isResults && <span className="observatory-nebula" />}

      {/* Sparse star layers - excluded on results to keep charts pristine */}
      {!isResults && (
        <>
          <span className="star-layer star-layer-far" />
          {(isLanding || isAuth || variant === "dashboard") && (
            <span className="star-layer star-layer-mid" />
          )}
        </>
      )}

      {/* Astronomical geometry depending on route context */}
      {(isLanding || isAuth || variant === "dashboard") && (
        <span className="observatory-coordinate-arc" />
      )}

      {/* Instrument reticle markers for observation intake */}
      {isUpload && <span className="observatory-reticle-grid" />}

      {/* Catalog celestial coordinate grid for MAST datasets */}
      {isDatasets && <span className="observatory-catalog-grid" />}

      {/* Signal pathway vector illumination for Demo */}
      {isDemo && <span className="observatory-signal-grid" />}
    </div>
  );
}
