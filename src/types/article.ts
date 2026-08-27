/**
 * Domain types for the article feed.
 *
 * The prototype ships with locally defined demo data (see `src/data/articles.ts`).
 * Swapping in a CMS later only needs a loader that returns `Article[]`.
 */

/** Only Marathi content is published today; the field keeps the door open. */
export type ArticleLanguage = "mr";

export type Article = {
  /** Stable internal identifier. Used for selection state. */
  id: string;
  /** URL-safe key. Drives the `?article=` deep link, so it must be unique. */
  slug: string;
  title: string;
  /** ISO calendar date, `YYYY-MM-DD`. Rendered as a Marathi date. */
  date: string;
  /** Full AI-generated summary. Shared verbatim — never truncated. */
  summary: string;
  /**
   * The complete press release, paragraphs separated by blank lines. This —
   * not `summary` — is what the printable sheet, the PDF and the DOCX carry,
   * so a downloaded article is the whole text rather than a condensation.
   */
  body: string;
  /**
   * Poster artwork. Local path or absolute URL.
   * `null` / a failing URL both fall back to a generated poster.
   */
  posterImageUrl: string | null;
  /**
   * Externally hosted full article. Absolute `https://` URLs are used as-is;
   * site-relative paths are resolved against the current origin when sharing.
   * `null` renders the "PDF unavailable" state instead of a dead button.
   */
  articlePdfUrl: string | null;
  /**
   * Editable Word version of the same full article, resolved exactly like
   * `articlePdfUrl`. `null` hides the DOCX link instead of offering a dead one.
   */
  articleDocxUrl: string | null;
  category: string;
  district: string;
  /** Publication / department credited for the original article. */
  source: string;
  author?: string;
  language: ArticleLanguage;
  tags: string[];
  featured: boolean;
};

/** Distinct filterable values derived from the loaded articles. */
export type Facets = {
  districts: string[];
  categories: string[];
  sources: string[];
  tags: string[];
};

export type SortOrder = "newest" | "oldest";

export type FilterState = {
  districts: string[];
  categories: string[];
  sources: string[];
  tags: string[];
  featuredOnly: boolean;
  /** Inclusive ISO date bounds, `YYYY-MM-DD`. */
  from: string | null;
  to: string | null;
};

/** Every filter cleared — the default feed view. */
export const EMPTY_FILTERS: FilterState = {
  districts: [],
  categories: [],
  sources: [],
  tags: [],
  featuredOnly: false,
  from: null,
  to: null,
};

/** Multi-select filter keys, used by generic add/remove helpers. */
export type MultiFilterKey = "districts" | "categories" | "sources" | "tags";
