import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>© {new Date().getFullYear()} ExoVision AI · Built for open astronomy.</p>
        <div className="flex gap-6">
          <Link className="transition hover:text-slate-300" href="/dashboard">Dashboard</Link>
          <Link className="transition hover:text-slate-300" href="/upload">Analyze</Link>
        </div>
      </div>
    </footer>
  );
}
