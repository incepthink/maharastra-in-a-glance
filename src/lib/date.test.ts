import { describe, expect, it } from "vitest";
import {
  formatMarathiDate,
  formatMarathiDateLong,
  formatMarathiDateShort,
  isoDateOrder,
  parseIsoDate,
  toDevanagariDigits,
} from "@/lib/date";

describe("toDevanagariDigits", () => {
  it("converts every ASCII digit", () => {
    expect(toDevanagariDigits("0123456789")).toBe("०१२३४५६७८९");
  });

  it("accepts numbers", () => {
    expect(toDevanagariDigits(42)).toBe("४२");
  });

  it("leaves non-digits alone", () => {
    expect(toDevanagariDigits("+3 आणखी")).toBe("+३ आणखी");
  });
});

describe("parseIsoDate", () => {
  it("reads a well-formed date", () => {
    expect(parseIsoDate("2026-08-21")).toEqual({
      year: 2026,
      month: 8,
      day: 21,
      weekday: 5,
    });
  });

  it("rejects a date that does not exist", () => {
    expect(parseIsoDate("2026-02-31")).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(parseIsoDate("21/08/2026")).toBeNull();
    expect(parseIsoDate("")).toBeNull();
  });
});

describe("formatMarathiDate", () => {
  it("renders day, month and year in Devanagari", () => {
    expect(formatMarathiDate("2026-08-21")).toBe("२१ ऑगस्ट २०२६");
  });

  it("handles the first and last month", () => {
    expect(formatMarathiDate("2026-01-01")).toBe("१ जानेवारी २०२६");
    expect(formatMarathiDate("2026-12-31")).toBe("३१ डिसेंबर २०२६");
  });

  it("is independent of the host time zone", () => {
    // A UTC-based parse keeps the calendar day stable everywhere; a local
    // `new Date(iso)` would roll back a day west of Greenwich.
    expect(formatMarathiDate("2026-01-01")).toBe("१ जानेवारी २०२६");
  });

  it("echoes unparseable input rather than throwing", () => {
    expect(formatMarathiDate("तारीख नाही")).toBe("तारीख नाही");
  });
});

describe("formatMarathiDateLong", () => {
  it("prefixes the weekday", () => {
    expect(formatMarathiDateLong("2026-08-21")).toBe("शुक्रवार, २१ ऑगस्ट २०२६");
  });
});

describe("formatMarathiDateShort", () => {
  it("drops the year", () => {
    expect(formatMarathiDateShort("2026-08-21")).toBe("२१ ऑगस्ट");
  });
});

describe("isoDateOrder", () => {
  it("orders chronologically", () => {
    expect(isoDateOrder("2026-08-21")).toBeGreaterThan(isoDateOrder("2026-08-09"));
    expect(isoDateOrder("2027-01-01")).toBeGreaterThan(isoDateOrder("2026-12-31"));
  });

  it("sorts unparseable dates last under newest-first", () => {
    expect(isoDateOrder("junk")).toBe(Number.NEGATIVE_INFINITY);
  });
});
