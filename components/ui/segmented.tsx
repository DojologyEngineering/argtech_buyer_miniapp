"use client";

import { cn } from "@/lib/utils";

/** Two-to-four way toggle (List / Calendar, By week / By month, Details / Traceability). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  tone = "light",
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** "onGreen" is for use inside the green header. */
  tone?: "light" | "onGreen";
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "grid gap-1 rounded-xl p-1",
        tone === "onGreen" ? "bg-white/15" : "border border-line bg-white",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors [&_svg]:size-4",
              active
                ? tone === "onGreen"
                  ? "bg-white text-brand-700"
                  : "bg-brand-600 text-white"
                : tone === "onGreen"
                  ? "text-white/85"
                  : "text-muted",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
