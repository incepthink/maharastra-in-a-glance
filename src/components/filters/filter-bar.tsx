"use client";

import { ArrowDownWideNarrow, ArrowUpWideNarrow, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/copy";
import { toDevanagariDigits } from "@/lib/date";
import {
  removeFilter,
  toggleFilterValue,
  type FilterChipRef,
} from "@/lib/filters";
import { Chip, RemovableChip } from "@/components/ui/chip";
import type { Facets, FilterState, SortOrder } from "@/types/article";

/**
 * The always-visible filter row: a sort toggle, the filter-sheet trigger, and
 * a horizontally scrollable rail of the most useful facet (district).
 *
 * Everything deeper lives in the sheet, so this row never wraps on a 360px
 * screen and search stays one thumb-reach away.
 */
export function FilterBar({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  facets,
  districtCounts,
  activeCount,
  onOpenFilters,
}: {
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  sort: SortOrder;
  onSortChange: (next: SortOrder) => void;
  facets: Facets;
  districtCounts: Record<string, number>;
  activeCount: number;
  onOpenFilters: () => void;
}) {
  const SortIcon = sort === "newest" ? ArrowDownWideNarrow : ArrowUpWideNarrow;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onOpenFilters}
        aria-label={t.openFilters}
        aria-haspopup="dialog"
        className={cn(
          "relative inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5",
          "text-[0.875rem] font-medium transition-all duration-150 active:scale-[0.97]",
          activeCount > 0
            ? "border-saffron-line bg-saffron-tint text-saffron-deep"
            : "border-line bg-card text-ink-soft hover:border-line-strong hover:text-ink",
        )}
      >
        <SlidersHorizontal className="size-4" strokeWidth={2} aria-hidden="true" />
        {t.filters}
        {activeCount > 0 && (
          <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-saffron px-1.5 text-[0.6875rem] font-semibold leading-5 text-white">
            {toDevanagariDigits(activeCount)}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onSortChange(sort === "newest" ? "oldest" : "newest")}
        aria-label={`${t.sortLabel}: ${sort === "newest" ? t.sortNewest : t.sortOldest}`}
        title={sort === "newest" ? t.sortNewest : t.sortOldest}
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-line bg-card px-3.5 text-[0.875rem] font-medium text-ink-soft transition-all hover:border-line-strong hover:text-ink active:scale-[0.97]"
      >
        <SortIcon className="size-4" strokeWidth={2} aria-hidden="true" />
        <span className="hidden xs:inline">
          {sort === "newest" ? t.sortNewest : t.sortOldest}
        </span>
      </button>

      {/* District rail — the facet people reach for first. */}
      <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1">
        {facets.districts.map((district) => (
          <Chip
            key={district}
            selected={filters.districts.includes(district)}
            count={districtCounts[district]}
            onClick={() =>
              onFiltersChange(toggleFilterValue(filters, "districts", district))
            }
          >
            {district}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/** The applied filters, each removable in one tap. */
export function ActiveFilterChips({
  filters,
  onFiltersChange,
  onClearAll,
}: {
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  onClearAll: () => void;
}) {
  const chips: Array<{ ref: FilterChipRef; facet: string; label: string }> = [
    ...filters.districts.map((value) => ({
      ref: { kind: "districts", value } as const,
      facet: t.district,
      label: value,
    })),
    ...filters.categories.map((value) => ({
      ref: { kind: "categories", value } as const,
      facet: t.category,
      label: value,
    })),
    ...filters.sources.map((value) => ({
      ref: { kind: "sources", value } as const,
      facet: t.source,
      label: value,
    })),
    ...filters.tags.map((value) => ({
      ref: { kind: "tags", value } as const,
      facet: t.tags,
      label: value,
    })),
  ];

  if (filters.featuredOnly) {
    chips.push({
      ref: { kind: "featuredOnly" },
      facet: "",
      label: t.featuredOnly,
    });
  }
  if (filters.from) {
    chips.push({ ref: { kind: "from" }, facet: t.dateFrom, label: filters.from });
  }
  if (filters.to) {
    chips.push({ ref: { kind: "to" }, facet: t.dateTo, label: filters.to });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <RemovableChip
          key={`${chip.ref.kind}-${chip.label}`}
          facet={chip.facet || undefined}
          label={chip.label}
          removeLabel={t.removeFilter(chip.label)}
          onRemove={() => onFiltersChange(removeFilter(filters, chip.ref))}
        />
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="inline-flex h-9 items-center rounded-full px-3 text-[0.8125rem] font-medium text-ink-mute underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
      >
        {t.clearAll}
      </button>
    </div>
  );
}
