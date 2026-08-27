/**
 * Marathi date and number formatting.
 *
 * Deliberately hand-rolled rather than `Intl`: ICU data differs between the
 * Node build that prerenders the page and the visitor's browser, which would
 * produce hydration mismatches. These tables are deterministic everywhere.
 */

const MARATHI_MONTHS = [
  "जानेवारी",
  "फेब्रुवारी",
  "मार्च",
  "एप्रिल",
  "मे",
  "जून",
  "जुलै",
  "ऑगस्ट",
  "सप्टेंबर",
  "ऑक्टोबर",
  "नोव्हेंबर",
  "डिसेंबर",
] as const;

const MARATHI_WEEKDAYS = [
  "रविवार",
  "सोमवार",
  "मंगळवार",
  "बुधवार",
  "गुरुवार",
  "शुक्रवार",
  "शनिवार",
] as const;

const DEVANAGARI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Convert every ASCII digit in a string to its Devanagari counterpart. */
export function toDevanagariDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => DEVANAGARI_DIGITS[Number(d)]);
}

/**
 * Parse `YYYY-MM-DD` into UTC calendar parts.
 * Parsing as UTC keeps a date from drifting a day in negative-offset zones.
 */
export function parseIsoDate(
  iso: string,
): { year: number; month: number; day: number; weekday: number } | null {
  const match = ISO_DATE.exec(iso.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const utc = new Date(Date.UTC(year, month - 1, day));
  // Rejects impossible dates such as 2026-02-31, which Date rolls forward.
  if (utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) return null;

  return { year, month, day, weekday: utc.getUTCDay() };
}

/** `2026-08-12` → `१२ ऑगस्ट २०२६`. Invalid input is echoed back unchanged. */
export function formatMarathiDate(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) return iso;
  return `${toDevanagariDigits(parts.day)} ${MARATHI_MONTHS[parts.month - 1]} ${toDevanagariDigits(parts.year)}`;
}

/** `2026-08-12` → `बुधवार, १२ ऑगस्ट २०२६`. Used in the article dialog. */
export function formatMarathiDateLong(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) return iso;
  return `${MARATHI_WEEKDAYS[parts.weekday]}, ${formatMarathiDate(iso)}`;
}

/** `2026-08-12` → `१२ ऑगस्ट`. For dense card metadata rows. */
export function formatMarathiDateShort(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) return iso;
  return `${toDevanagariDigits(parts.day)} ${MARATHI_MONTHS[parts.month - 1]}`;
}

/** Sortable numeric key. Unparseable dates sort last under "newest first". */
export function isoDateOrder(iso: string): number {
  const parts = parseIsoDate(iso);
  if (!parts) return Number.NEGATIVE_INFINITY;
  return parts.year * 10000 + parts.month * 100 + parts.day;
}
