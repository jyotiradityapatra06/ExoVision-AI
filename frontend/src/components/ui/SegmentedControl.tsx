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
      className={`inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#0c1017] p-1 ${className}`.trim()}
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
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
              active
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] ${
                  active ? "bg-white/15 text-white" : "bg-white/[0.05] text-slate-400"
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
