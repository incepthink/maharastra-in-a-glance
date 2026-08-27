import { formatMarathiDate } from "@/lib/date";
import type { Article } from "@/types/article";

/**
 * Builds the plain-text Marathi message shared to WhatsApp, the OS share
 * sheet, or the clipboard.
 *
 * Rules that must not be broken:
 *  - summaries are reproduced verbatim, never shortened;
 *  - no emoji or emoji-like symbols, only plain text and rule separators;
 *  - PDF links are absolute, so the message is useful outside the site.
 */

/** Horizontal rule between articles. Box-drawing, not an emoji. */
const SEPARATOR = "────────────────────";

const HEADING = "महाराष्ट्र एका नजरेत";
const SUBHEADING = "निवडक बातम्यांचा सारांश";
const PDF_LABEL = "संपूर्ण लेख (PDF):";
const PDF_MISSING = "संपूर्ण लेख (PDF): सध्या उपलब्ध नाही";
const DATE_LABEL = "दिनांक:";

export type ShareMessageOptions = {
  /**
   * Origin used to absolutise site-relative PDF paths, e.g.
   * `https://example.org`. Omit only when every URL is already absolute.
   */
  origin?: string;
  /** Append a one-line credit for the site. Defaults to true. */
  includeFooter?: boolean;
};

const FOOTER = "हा सारांश महाराष्ट्र एका नजरेत या संकेतस्थळावरून पाठवला आहे.";

/** Turn a stored PDF path into something that works in any messaging app. */
export function resolveAbsoluteUrl(
  url: string | null,
  origin?: string,
): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!origin) return trimmed;

  const base = origin.replace(/\/+$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

/** One article block, without the trailing separator. */
export function buildArticleBlock(
  article: Article,
  options: ShareMessageOptions = {},
): string {
  const pdfUrl = resolveAbsoluteUrl(article.articlePdfUrl, options.origin);

  const lines = [
    article.title.trim(),
    "",
    `${DATE_LABEL} ${formatMarathiDate(article.date)}`,
    "",
    article.summary.trim(),
    "",
    pdfUrl ? `${PDF_LABEL}\n${pdfUrl}` : PDF_MISSING,
  ];

  return lines.join("\n");
}

/**
 * The complete share message for the selected articles, in the order given.
 * Returns an empty string when nothing is selected.
 */
export function buildShareMessage(
  articles: Article[],
  options: ShareMessageOptions = {},
): string {
  if (articles.length === 0) return "";

  const { includeFooter = true } = options;

  const parts: string[] = [`${HEADING}\n${SUBHEADING}`, SEPARATOR];

  articles.forEach((article, index) => {
    parts.push(buildArticleBlock(article, options));
    // A rule after every article keeps the last block visually closed too.
    parts.push(SEPARATOR);
    if (index < articles.length - 1) parts.push("");
  });

  if (includeFooter) parts.push(FOOTER);

  return parts.join("\n");
}

/* -------------------------------------------------------------------------
   WhatsApp
   ------------------------------------------------------------------------- */

/**
 * Practical ceilings for a prefilled `wa.me` link.
 *
 * WhatsApp accepts far longer messages than this, but the text has to survive
 * a URL round-trip through the browser and the OS handler first, and that is
 * where long prefills get dropped. Two separate limits matter:
 *
 *  - the message itself, which is what WhatsApp receives; and
 *  - the percent-encoded URL, which is what the OS has to carry. Devanagari
 *    costs nine characters per glyph once encoded, so this is the limit a
 *    Marathi message hits first.
 *
 * Past either ceiling the visitor is warned rather than silently truncated,
 * and the copy action - which has no limit at all - stays available.
 */
export const WHATSAPP_TEXT_SAFE_LENGTH = 4000;
export const WHATSAPP_URL_SAFE_LENGTH = 30_000;

export type WhatsAppLink = {
  url: string;
  /** Percent-encoded length, i.e. what the OS URL handler has to carry. */
  encodedLength: number;
  /** True when the prefill is likely to be dropped or truncated in transit. */
  exceedsSafeLength: boolean;
};

export function buildWhatsAppLink(message: string): WhatsAppLink {
  const encoded = encodeURIComponent(message);
  return {
    url: `https://wa.me/?text=${encoded}`,
    encodedLength: encoded.length,
    exceedsSafeLength:
      messageLength(message) > WHATSAPP_TEXT_SAFE_LENGTH ||
      encoded.length > WHATSAPP_URL_SAFE_LENGTH,
  };
}

/** Characters in the message itself, for the preview sheet's counter. */
export function messageLength(message: string): number {
  return [...message].length;
}
