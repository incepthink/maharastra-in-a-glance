import Fuse, { type IFuseOptions } from "fuse.js";
import type { Article } from "@/types/article";

/**
 * Article search.
 *
 * Two layers, deliberately kept separate:
 *
 *  1. **Exact layer** - normalized substring matching over each field. This is
 *     what actually ranks results, and it is what gets highlighted.
 *  2. **Fuzzy layer** - Fuse.js (Bitap) per token, used *only* to rescue
 *     near-miss spellings. Its contribution is capped well below any exact
 *     match so a typo-tolerant hit can never outrank a real one.
 *
 * Multi-word queries are AND-ed: every token must match somewhere, which is
 * what stops fuzzy search from returning obviously irrelevant articles.
 */

export type SearchField =
  | "title"
  | "tags"
  | "district"
  | "category"
  | "source"
  | "author"
  | "summary";

/** Relative importance per field. Title/place/topic beat body copy. */
export const FIELD_WEIGHTS: Record<SearchField, number> = {
  title: 10,
  district: 7,
  category: 6,
  tags: 6,
  source: 3,
  author: 2,
  summary: 1.5,
};

/** Field order is fixed so scoring is deterministic across runs. */
const SEARCH_FIELDS = Object.keys(FIELD_WEIGHTS) as SearchField[];

/** A fuzzy hit is worth at most this fraction of the weakest exact hit. */
const FUZZY_PENALTY = 0.35;
/** Fuse scores above this are treated as noise and discarded. */
const FUZZY_SCORE_CEILING = 0.4;
/** Bitap needs enough characters to be meaningful; below this, exact only. */
const MIN_FUZZY_TOKEN_LENGTH = 3;

export type SearchHit = {
  article: Article;
  score: number;
  /** Fields that matched exactly, strongest first. */
  matchedFields: SearchField[];
};

/* -------------------------------------------------------------------------
   Normalization
   ------------------------------------------------------------------------- */

/**
 * Marks that carry no lexical meaning in Devanagari search but do break naive
 * matching: the zero-width joiners used in conjunct rendering, plus the bidi
 * and format characters that arrive with copy-pasted content.
 */
const INVISIBLE = /[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/;

/** Separators folded to a single space, including the Devanagari danda marks. */
const PUNCTUATION =
  /[।॥,.;:!?'"“”‘’()[\]{}<>/\\|@#$%^&*_+=~`—–-]/;

/**
 * Fold text into its comparable form: NFC-composed, lowercased, stripped of
 * invisible marks, separators collapsed to single spaces.
 *
 * NFC matters for Devanagari - the same syllable can arrive pre-composed or
 * decomposed depending on the input method, and the two must compare equal.
 */
export function normalizeText(input: string): string {
  return normalizeWithMap(input).text;
}

/**
 * Normalize while recording, for each character of the output, the index it
 * came from in the input. Highlighting needs this: matches are found in
 * normalized space but must be painted over the original Marathi text.
 */
export function normalizeWithMap(input: string): {
  text: string;
  map: number[];
} {
  const composed = input.normalize("NFC");
  const out: string[] = [];
  const map: number[] = [];
  let pendingSpace = false;

  for (let i = 0; i < composed.length; i += 1) {
    const char = composed[i];

    if (INVISIBLE.test(char)) continue;

    if (/\s/.test(char) || PUNCTUATION.test(char)) {
      // Collapse any run of separators into at most one space, and never
      // emit a leading one.
      if (out.length > 0) pendingSpace = true;
      continue;
    }

    if (pendingSpace) {
      out.push(" ");
      map.push(i);
      pendingSpace = false;
    }

    out.push(char.toLowerCase());
    map.push(i);
  }

  return { text: out.join(""), map };
}

/** Split a raw query into normalized search tokens. */
export function tokenize(query: string): string[] {
  const normalized = normalizeText(query);
  if (!normalized) return [];
  // Cap token count so a pasted paragraph cannot become a huge AND query.
  return normalized.split(" ").filter(Boolean).slice(0, 8);
}

/* -------------------------------------------------------------------------
   Index
   ------------------------------------------------------------------------- */

type IndexedDoc = {
  id: string;
  article: Article;
  /** Normalized haystack per field, ready for substring tests. */
  fields: Record<SearchField, string>;
};

export type SearchIndex = {
  docs: IndexedDoc[];
  fuse: Fuse<IndexedDoc>;
};

function fieldValues(article: Article): Record<SearchField, string> {
  return {
    title: normalizeText(article.title),
    district: normalizeText(article.district),
    category: normalizeText(article.category),
    tags: normalizeText(article.tags.join(" ")),
    source: normalizeText(article.source),
    author: normalizeText(article.author ?? ""),
    summary: normalizeText(article.summary),
  };
}

const FUSE_OPTIONS: IFuseOptions<IndexedDoc> = {
  includeScore: true,
  // Match anywhere in the field: Marathi headlines often put the key noun late.
  ignoreLocation: true,
  threshold: 0.34,
  minMatchCharLength: MIN_FUZZY_TOKEN_LENGTH,
  keys: SEARCH_FIELDS.map((field) => ({
    name: `fields.${field}`,
    weight: FIELD_WEIGHTS[field],
  })),
};

export function createSearchIndex(articles: Article[]): SearchIndex {
  const docs: IndexedDoc[] = articles.map((article) => ({
    id: article.id,
    article,
    fields: fieldValues(article),
  }));

  return { docs, fuse: new Fuse(docs, FUSE_OPTIONS) };
}

/* -------------------------------------------------------------------------
   Scoring
   ------------------------------------------------------------------------- */

/**
 * How well a single token matches one normalized field, as a 0-1 multiplier.
 * Word-start matches beat mid-word ones, which is the right bias for
 * Devanagari where suffixes attach to the stem, e.g. पुणे -> पुण्यात.
 */
function exactTokenScore(haystack: string, token: string): number {
  if (!haystack || !token) return 0;

  const at = haystack.indexOf(token);
  if (at === -1) return 0;

  if (at === 0) return haystack.length === token.length ? 1 : 0.92;
  if (haystack[at - 1] === " ") return 0.85;
  return 0.6;
}

/**
 * Rank articles against a query.
 *
 * An empty query returns every article untouched (score 0) so callers can use
 * one code path for both "browsing" and "searching".
 */
export function searchArticles(index: SearchIndex, query: string): SearchHit[] {
  const tokens = tokenize(query);

  if (tokens.length === 0) {
    return index.docs.map((doc) => ({
      article: doc.article,
      score: 0,
      matchedFields: [],
    }));
  }

  const fuzzyByToken = tokens.map((token) => fuzzyScoresFor(index, token));
  const hits: SearchHit[] = [];

  for (const doc of index.docs) {
    let total = 0;
    let matchedEveryToken = true;
    const matched = new Map<SearchField, number>();

    for (let t = 0; t < tokens.length; t += 1) {
      const token = tokens[t];
      let best = 0;

      for (const field of SEARCH_FIELDS) {
        const exact = exactTokenScore(doc.fields[field], token);
        if (exact === 0) continue;

        const weighted = exact * FIELD_WEIGHTS[field];
        if (weighted > best) best = weighted;
        if (weighted > (matched.get(field) ?? 0)) matched.set(field, weighted);
      }

      if (best === 0) {
        // Nothing matched literally - let the fuzzy layer try to rescue it.
        const fuzzy = fuzzyByToken[t].get(doc.id);
        if (fuzzy === undefined) {
          matchedEveryToken = false;
          break;
        }
        best = fuzzy;
      }

      total += best;
    }

    if (!matchedEveryToken) continue;

    hits.push({
      article: doc.article,
      score: total,
      matchedFields: [...matched.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([field]) => field),
    });
  }

  return hits.sort(
    (a, b) =>
      b.score - a.score ||
      // Stable, meaningful tie-break: newer articles first, then by id.
      b.article.date.localeCompare(a.article.date) ||
      a.article.id.localeCompare(b.article.id),
  );
}

/** Fuse scores for one token, converted to this module's scale. */
function fuzzyScoresFor(index: SearchIndex, token: string): Map<string, number> {
  const scores = new Map<string, number>();
  if (token.length < MIN_FUZZY_TOKEN_LENGTH) return scores;

  for (const result of index.fuse.search(token)) {
    const score = result.score ?? 1;
    if (score > FUZZY_SCORE_CEILING) continue;
    // Fuse: 0 is perfect, 1 is worthless. Invert it, then hold the result
    // below the weakest exact match so fuzzy never outranks a literal hit.
    const quality = 1 - score / FUZZY_SCORE_CEILING;
    scores.set(result.item.id, quality * FUZZY_PENALTY * FIELD_WEIGHTS.summary);
  }

  return scores;
}

/* -------------------------------------------------------------------------
   Highlighting
   ------------------------------------------------------------------------- */

export type HighlightRange = { start: number; end: number };

/**
 * Locate every query token inside `text`, returned as merged, sorted ranges in
 * the *original* string's coordinates so the Marathi text is never rewritten.
 */
export function findHighlightRanges(
  text: string,
  query: string,
): HighlightRange[] {
  const tokens = tokenize(query);
  if (tokens.length === 0 || !text) return [];

  const { text: haystack, map } = normalizeWithMap(text);
  if (!haystack) return [];

  const raw: HighlightRange[] = [];

  for (const token of tokens) {
    let from = 0;
    for (;;) {
      const at = haystack.indexOf(token, from);
      if (at === -1) break;
      // `map` holds the first source index of each normalized character, so
      // the range ends just past the last matched one.
      raw.push({ start: map[at], end: map[at + token.length - 1] + 1 });
      from = at + token.length;
    }
  }

  return mergeRanges(raw);
}

function mergeRanges(ranges: HighlightRange[]): HighlightRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: HighlightRange[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

/** Split text into alternating plain / highlighted segments for rendering. */
export function splitByHighlights(
  text: string,
  query: string,
): Array<{ text: string; hit: boolean }> {
  const ranges = findHighlightRanges(text, query);
  if (ranges.length === 0) return [{ text, hit: false }];

  const parts: Array<{ text: string; hit: boolean }> = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      parts.push({ text: text.slice(cursor, range.start), hit: false });
    }
    parts.push({ text: text.slice(range.start, range.end), hit: true });
    cursor = range.end;
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), hit: false });
  }

  return parts;
}

/**
 * Pick the slice of a long summary that actually contains the query, so a card
 * preview shows the matched sentence instead of the opening line.
 */
export function summaryExcerpt(
  summary: string,
  query: string,
  length = 220,
): string {
  if (summary.length <= length) return summary;

  const ranges = findHighlightRanges(summary, query);
  if (ranges.length === 0) return summary;

  const first = ranges[0];
  if (first.start < length * 0.6) return summary;

  // Back up to a word boundary so the excerpt does not start mid-word.
  const rawStart = Math.max(0, first.start - Math.floor(length * 0.3));
  const boundary = summary.lastIndexOf(" ", rawStart);
  const start = boundary === -1 ? rawStart : boundary + 1;

  return `…${summary.slice(start)}`;
}
