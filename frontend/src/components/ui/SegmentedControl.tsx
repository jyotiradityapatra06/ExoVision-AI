"use client";

export type SegmentItem<T extends string> = {
  id: T;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
};

type SegmentedControlProps<T extends string> = {
  items: SegmentItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
};

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  className = "",
  ariaLabel = "View options",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#0d1015] p-1 ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = item.id === value;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-sans text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${
              active
                ? "bg-white/[0.09] text-white shadow-sm border border-white/[0.06]"
                : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border border-transparent"
            }`}
          >
            {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-cyan-400" : "text-zinc-400"}`} />}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none ${
                  active ? "bg-white/10 text-zinc-200" : "bg-white/[0.04] text-zinc-500"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
