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
      className={`inline-flex items-center gap-1 rounded border border-stone-300/80 bg-stone-100/80 p-0.5 ${className}`.trim()}
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
            className={`inline-flex items-center gap-2 rounded px-3 py-1 font-mono text-xs font-medium transition-all ${
              active
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/80"
                : "text-stone-500 hover:text-stone-900 border border-transparent"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] ${
                  active ? "bg-stone-100 text-stone-900" : "bg-stone-200/60 text-stone-500"
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
