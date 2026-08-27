import { normalizeDateRange } from "@/lib/filters";
import type { FilterState, SortOrder } from "@/types/article";
import { EMPTY_FILTERS } from "@/types/article";

/**
 * The URL is the single source of truth for search, filters, sorting and the
 * open article. That makes every view refreshable, linkable and navigable with
 * the browser's own back and forward buttons.
 *
 * Values are read with `useSearchParams()` and written with the native History
 * API, which Next's App Router keeps in sync without a server round-trip.
 */

export const PARAM = {
  query: "q",
  districts: "district",
  categories: "category",
  sources: "source",
  tags: "tag",
  featured: "featured",
  from: "from",
  to: "to",
  sort: "sort",
  article: "article",
} as const;

/** Multi-value params are comma-joined; commas are escaped by the URL layer. */
const LIST_SEPARATOR = ",";

function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(LIST_SEPARATOR)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

export type ViewState = {
  query: string;
  filters: FilterState;
  sort: SortOrder;
  /** Slug of the article whose dialog is open, or null. */
  articleSlug: string | null;
};

export function readViewState(params: URLSearchParams): ViewState {
  const { from, to } = normalizeDateRange(
    params.get(PARAM.from),
    params.get(PARAM.to),
  );

  return {
    query: params.get(PARAM.query) ?? "",
    sort: params.get(PARAM.sort) === "oldest" ? "oldest" : "newest",
    articleSlug: params.get(PARAM.article),
    filters: {
      districts: readList(params, PARAM.districts),
      categories: readList(params, PARAM.categories),
      sources: readList(params, PARAM.sources),
      tags: readList(params, PARAM.tags),
      featuredOnly: params.get(PARAM.featured) === "1",
      from,
      to,
    },
  };
}

/**
 * Serialise a view back to a query string.
 *
 * Defaults are omitted so the shared URL of an untouched feed stays clean.
 */
export function writeViewState(state: ViewState): string {
  const params = new URLSearchParams();

  if (state.query.trim()) params.set(PARAM.query, state.query);

  const lists: Array<[string, string[]]> = [
    [PARAM.districts, state.filters.districts],
    [PARAM.categories, state.filters.categories],
    [PARAM.sources, state.filters.sources],
    [PARAM.tags, state.filters.tags],
  ];

  for (const [key, values] of lists) {
    if (values.length > 0) params.set(key, values.join(LIST_SEPARATOR));
  }

  if (state.filters.featuredOnly) params.set(PARAM.featured, "1");
  if (state.filters.from) params.set(PARAM.from, state.filters.from);
  if (state.filters.to) params.set(PARAM.to, state.filters.to);
  if (state.sort === "oldest") params.set(PARAM.sort, "oldest");
  if (state.articleSlug) params.set(PARAM.article, state.articleSlug);

  return params.toString();
}

/** `?a=b` or `""` — ready to hand to `history.pushState`. */
export function toSearchString(state: ViewState): string {
  const query = writeViewState(state);
  return query ? `?${query}` : "";
}

export const DEFAULT_VIEW_STATE: ViewState = {
  query: "",
  filters: EMPTY_FILTERS,
  sort: "newest",
  articleSlug: null,
};
