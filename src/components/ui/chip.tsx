"use client";

import { X } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { toDevanagariDigits } from "@/lib/date";

export type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  /** Renders a small count to the right of the label. */
  count?: number;
};

/** A toggleable filter pill, used in the quick-filter rail and filter sheet. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, count, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5",
        "text-[0.8125rem] font-medium leading-tight transition-all duration-150 ease-editorial",
        "active:scale-[0.97]",
        selected
          ? "border-saffron-line bg-saffron-tint text-saffron-deep shadow-hairline"
          : "border-line bg-card text-ink-soft hover:border-line-strong hover:text-ink",
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      {count !== undefined && (
        <span
          className={cn(
            "tabular-nums text-[0.6875rem]",
            selected ? "text-saffron/80" : "text-ink-faint",
          )}
        >
          {toDevanagariDigits(count)}
        </span>
      )}
    </button>
  );
});

export type RemovableChipProps = {
  label: string;
  /** Short prefix naming the facet, e.g. "जिल्हा". */
  facet?: string;
  onRemove: () => void;
  /** Accessible name for the remove control. */
  removeLabel: string;
};

/** An applied filter, shown above the feed with a one-tap remove control. */
export function RemovableChip({
  label,
  facet,
  onRemove,
  removeLabel,
}: RemovableChipProps) {
  return (
    <span className="inline-flex h-9 max-w-full shrink-0 items-center gap-1 rounded-full border border-saffron-line bg-saffron-tint pl-3 pr-1 text-[0.8125rem] text-saffron-deep">
      {facet && (
        <span className="shrink-0 text-[0.6875rem] text-saffron/70">
          {facet}
        </span>
      )}
      <span className="truncate font-medium">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className="ml-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-saffron/70 transition-colors hover:bg-saffron/12 hover:text-saffron-deep"
      >
        <X className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
      </button>
    </span>
  );
}
