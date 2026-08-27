import { isoDateOrder, parseIsoDate } from "@/lib/date";
import type {
  Article,
  Facets,
  FilterState,
  MultiFilterKey,
  SortOrder,
} from "@/types/article";
import { EMPTY_FILTERS } from "@/types/article";

/**
 * Filtering and sorting for the article feed.
 *
 * Pure functions over plain data so the behaviour can be unit-tested without
 * mounting a component.
 */

/** Every distinct filterable value present in the loaded articles. */
export function buildFacets(articles: Article[]): Facets {
  const districts = new Set<string>();
  const categories = new Set<string>();
  const sources = new Set<string>();
  const tags = new Set<string>();

  for (const article of articles) {
    if (article.district) districts.add(article.district);
    if (article.category) categories.add(article.category);
    if (article.source) sources.add(article.source);
    for (const tag of article.tags) if (tag) tags.add(tag);
  }

  // Marathi collation so the filter sheet reads in a familiar order.
  const collate = (a: string, b: string) => a.localeCompare(b, "mr");

  return {
    districts: [...districts].sort(collate),
    categories: [...categories].sort(collate),
    sources: [...sources].sort(collate),
    tags: [...tags].sort(collate),
  };
}

/** How many distinct filters the visitor has applied. Drives the badge count. */
export function countActiveFilters(filters: FilterState): number {
  return (
    filters.districts.length +
    filters.categories.length +
    filters.sources.length +
    filters.tags.length +
    (filters.featuredOnly ? 1 : 0) +
    (filters.from ? 1 : 0) +
    (filters.to ? 1 : 0)
  );
}

export function hasActiveFilters(filters: FilterState): boolean {
  return countActiveFilters(filters) > 0;
}

/** A value matches a multi-select filter when the filter is empty or contains it. */
function matchesAny(selected: string[], value: string): boolean {
  return selected.length === 0 || selected.includes(value);
}

export function applyFilters(
  articles: Article[],
  filters: FilterState,
): Article[] {
  const fromOrder = filters.from ? isoDateOrder(filters.from) : null;
  const toOrder = filters.to ? isoDateOrder(filters.to) : null;

  return articles.filter((article) => {
    if (filters.featuredOnly && !article.featured) return false;
    if (!matchesAny(filters.districts, article.district)) return false;
    if (!matchesAny(filters.categories, article.category)) return false;
    if (!matchesAny(filters.sources, article.source)) return false;

    if (
      filters.tags.length > 0 &&
      // OR within tags: any selected tag is enough to keep the article.
      !article.tags.some((tag) => filters.tags.includes(tag))
    ) {
      return false;
    }

    if (fromOrder !== null || toOrder !== null) {
      const order = isoDateOrder(article.date);
      if (fromOrder !== null && order < fromOrder) return false;
      if (toOrder !== null && order > toOrder) return false;
    }

    return true;
  });
}

/** Sort a copy of the list; the input order is never mutated. */
export function sortArticles(
  articles: Article[],
  order: SortOrder,
): Article[] {
  const direction = order === "newest" ? -1 : 1;
  return [...articles].sort(
    (a, b) =>
      direction * (isoDateOrder(a.date) - isoDateOrder(b.date)) ||
      a.id.localeCompare(b.id),
  );
}

/** Toggle one value inside a multi-select filter. */
export function toggleFilterValue(
  filters: FilterState,
  key: MultiFilterKey,
  value: string,
): FilterState {
  const current = filters[key];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];

  return { ...filters, [key]: next };
}

/** Remove a single applied filter, addressed the way a chip identifies itself. */
export type FilterChipRef =
  | { kind: MultiFilterKey; value: string }
  | { kind: "featuredOnly" }
  | { kind: "from" }
  | { kind: "to" };

export function removeFilter(
  filters: FilterState,
  ref: FilterChipRef,
): FilterState {
  switch (ref.kind) {
    case "featuredOnly":
      return { ...filters, featuredOnly: false };
    case "from":
      return { ...filters, from: null };
    case "to":
      return { ...filters, to: null };
    default:
      return {
        ...filters,
        [ref.kind]: filters[ref.kind].filter((item) => item !== ref.value),
      };
  }
}

export function clearFilters(): FilterState {
  return { ...EMPTY_FILTERS };
}

/** Reject malformed or reversed date ranges coming from the URL. */
export function normalizeDateRange(
  from: string | null,
  to: string | null,
): { from: string | null; to: string | null } {
  const validFrom = from && parseIsoDate(from) ? from : null;
  const validTo = to && parseIsoDate(to) ? to : null;

  if (validFrom && validTo && isoDateOrder(validFrom) > isoDateOrder(validTo)) {
    return { from: validTo, to: validFrom };
  }

  return { from: validFrom, to: validTo };
}
