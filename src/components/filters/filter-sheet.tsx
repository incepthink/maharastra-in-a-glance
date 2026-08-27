"use client";

import { RotateCcw, Star, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/copy";
import { countActiveFilters, toggleFilterValue } from "@/lib/filters";
import { useMediaQuery } from "@/lib/hooks";
import { Button, IconButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Eyebrow } from "@/components/ui/primitives";
import { Overlay, SheetHandle, useDialogIds } from "@/components/ui/overlay";
import { EMPTY_FILTERS } from "@/types/article";
import type {
  Facets,
  FilterState,
  MultiFilterKey,
  SortOrder,
} from "@/types/article";

/**
 * The advanced-filter surface: a bottom sheet on phones, a dialog on desktop.
 *
 * Changes apply live to the feed behind it — the footer button just dismisses
 * the sheet, so nothing is ever lost by closing it.
 */
export function FilterSheet({
  open,
  onClose,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  facets,
  counts,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  sort: SortOrder;
  onSortChange: (next: SortOrder) => void;
  facets: Facets;
  /** Article count per facet value, for the chip counters. */
  counts: Record<MultiFilterKey, Record<string, number>>;
  resultCount: number;
}) {
  const { titleId, descriptionId } = useDialogIds();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const activeCount = countActiveFilters(filters);

  function toggle(key: MultiFilterKey, value: string) {
    onFiltersChange(toggleFilterValue(filters, key, value));
  }

  return (
    <Overlay
      open={open}
      onClose={onClose}
      variant={isDesktop ? "dialog" : "sheet"}
      labelledBy={titleId}
      describedBy={descriptionId}
      className="md:max-w-xl"
    >
      {!isDesktop && <SheetHandle />}

      <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-lg text-ink">
            {t.filtersTitle}
          </h2>
          <p id={descriptionId} className="sr-only">
            {t.filtersDescription}
          </p>
        </div>

        {activeCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onFiltersChange(EMPTY_FILTERS)}
            className="text-saffron-deep"
          >
            <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden="true" />
            {t.clearAll}
          </Button>
        )}

        <IconButton label={t.closeFilters} variant="quiet" onClick={onClose}>
          <X className="size-5" strokeWidth={2} aria-hidden="true" />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 md:px-6">
        <Section label={t.sort}>
          <div
            role="radiogroup"
            aria-label={t.sortLabel}
            className="flex flex-wrap gap-2"
          >
            {(
              [
                ["newest", t.sortNewest],
                ["oldest", t.sortOldest],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={sort === value}
                onClick={() => onSortChange(value)}
                className={cn(
                  "inline-flex h-10 items-center rounded-full border px-4 text-[0.875rem] font-medium transition-all",
                  sort === value
                    ? "border-saffron-line bg-saffron-tint text-saffron-deep"
                    : "border-line bg-card text-ink-soft hover:border-line-strong",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section label={t.featured}>
          <button
            type="button"
            role="switch"
            aria-checked={filters.featuredOnly}
            onClick={() =>
              onFiltersChange({
                ...filters,
                featuredOnly: !filters.featuredOnly,
              })
            }
            className={cn(
              "flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-4 text-left transition-all",
              filters.featuredOnly
                ? "border-saffron-line bg-saffron-tint"
                : "border-line bg-card hover:border-line-strong",
            )}
          >
            <span className="inline-flex items-center gap-2 text-[0.9375rem] text-ink">
              <Star
                className={cn(
                  "size-4",
                  filters.featuredOnly ? "text-saffron" : "text-ink-faint",
                )}
                strokeWidth={2.25}
                aria-hidden="true"
              />
              {t.featuredOnly}
            </span>

            <span
              aria-hidden="true"
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                filters.featuredOnly ? "bg-saffron" : "bg-line-strong",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-200 ease-editorial",
                  filters.featuredOnly ? "start-[1.375rem]" : "start-0.5",
                )}
              />
            </span>
          </button>
        </Section>

        <FacetSection
          label={t.district}
          values={facets.districts}
          selected={filters.districts}
          counts={counts.districts}
          onToggle={(value) => toggle("districts", value)}
        />

        <FacetSection
          label={t.category}
          values={facets.categories}
          selected={filters.categories}
          counts={counts.categories}
          onToggle={(value) => toggle("categories", value)}
        />

        <FacetSection
          label={t.source}
          values={facets.sources}
          selected={filters.sources}
          counts={counts.sources}
          onToggle={(value) => toggle("sources", value)}
        />

        <FacetSection
          label={t.tags}
          values={facets.tags}
          selected={filters.tags}
          counts={counts.tags}
          onToggle={(value) => toggle("tags", value)}
        />

        <Section label={t.dateRange}>
          <div className="grid grid-cols-2 gap-3">
            <DateInput
              label={t.dateFrom}
              value={filters.from}
              max={filters.to ?? undefined}
              onChange={(from) => onFiltersChange({ ...filters, from })}
            />
            <DateInput
              label={t.dateTo}
              value={filters.to}
              min={filters.from ?? undefined}
              onChange={(to) => onFiltersChange({ ...filters, to })}
            />
          </div>
        </Section>
      </div>

      <footer className="shrink-0 border-t border-line bg-card px-4 pb-[calc(var(--safe-bottom)+0.75rem)] pt-3 md:px-6 md:pb-4">
        <Button variant="primary" size="lg" block onClick={onClose}>
          {t.applyFilters}
          <span className="opacity-80">· {t.resultCount(resultCount)}</span>
        </Button>
      </footer>
    </Overlay>
  );
}

/* ------------------------------------------------------------------ pieces */

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <Eyebrow className="mb-2.5 block">{label}</Eyebrow>
      {children}
    </section>
  );
}

function FacetSection({
  label,
  values,
  selected,
  counts,
  onToggle,
}: {
  label: string;
  values: string[];
  selected: string[];
  counts: Record<string, number>;
  onToggle: (value: string) => void;
}) {
  if (values.length === 0) return null;

  return (
    <Section label={label}>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Chip
            key={value}
            selected={selected.includes(value)}
            count={counts[value]}
            onClick={() => onToggle(value)}
            className="max-w-full"
          >
            {value}
          </Chip>
        ))}
      </div>
    </Section>
  );
}

function DateInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string | null;
  min?: string;
  max?: string;
  onChange: (next: string | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.75rem] text-ink-mute">{label}</span>
      <input
        type="date"
        value={value ?? ""}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value || null)}
        className={cn(
          "h-12 w-full rounded-xl border border-line bg-card px-3 text-base text-ink",
          "transition-[border-color,box-shadow] focus:border-saffron-line focus:outline-none focus:ring-4 focus:ring-saffron/10",
        )}
      />
    </label>
  );
}
