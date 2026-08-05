import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative border-b border-cyan-900/30 pb-8 sm:pb-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <div className="eyebrow mb-3">
            <span className="status-dot" />
            {eyebrow}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl font-mono">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
            {description}
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-400/40 via-orange-400/30 to-transparent" />
    </div>
  );
}
