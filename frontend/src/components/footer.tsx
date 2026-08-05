export function Footer() {
  return (
    <footer className="w-full px-panel-padding py-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/20 docked full-width bottom-0 z-40 mt-auto cursor-crosshair relative">
      <span className="font-label-caps text-on-surface-variant text-label-caps">
        © 2024 EXOVision AI. MISSION STATUS: NOMINAL.
      </span>
      <div className="flex gap-6">
        <a className="font-data-mono text-data-mono uppercase text-secondary hover:text-secondary-fixed-dim transition-colors" href="#">
          Coordinates
        </a>
        <a className="font-data-mono text-data-mono uppercase text-secondary hover:text-secondary-fixed-dim transition-colors" href="#">
          Server Status
        </a>
        <a className="font-data-mono text-data-mono uppercase text-secondary hover:text-secondary-fixed-dim transition-colors" href="#">
          System Health
        </a>
        <a className="font-data-mono text-data-mono uppercase text-secondary hover:text-secondary-fixed-dim transition-colors" href="#">
          Legal
        </a>
      </div>
    </footer>
  );
}
