import { describe, expect, it } from "vitest";
import {
  createSearchIndex,
  findHighlightRanges,
  normalizeText,
  searchArticles,
  splitByHighlights,
  summaryExcerpt,
  tokenize,
} from "@/lib/search";
import type { Article } from "@/types/article";

function article(overrides: Partial<Article> & { id: string }): Article {
  return {
    slug: overrides.id,
    title: "शीर्षक",
    date: "2026-08-01",
    summary: "सारांश",
    posterImageUrl: null,
    articlePdfUrl: null,
    category: "विषय",
    district: "जिल्हा",
    source: "स्रोत",
    language: "mr",
    tags: [],
    featured: false,
    ...overrides,
  };
}

const PUNE = article({
  id: "pune",
  title: "पुणे मेट्रोच्या विस्तारित मार्गिकेस मान्यता",
  summary: "पुणे शहरातील वाहतूक कोंडी कमी करण्यासाठी मेट्रो प्रकल्प राबवला जात आहे.",
  district: "पुणे",
  category: "पायाभूत सुविधा",
  source: "महासंवाद",
  tags: ["मेट्रो", "वाहतूक"],
});

const NAGPUR = article({
  id: "nagpur",
  title: "विदर्भात उद्योग गुंतवणुकीस चालना",
  // Mentions Pune only in the body — a much weaker signal than the title.
  summary: "नागपूर येथील प्रकल्पाची तुलना पुणे येथील प्रकल्पाशी करण्यात आली.",
  district: "नागपूर",
  category: "उद्योग",
  source: "उद्योग संचालनालय",
  tags: ["उद्योग"],
});

const NASHIK = article({
  id: "nashik",
  title: "ग्रामीण आरोग्य सेवांचा विस्तार",
  summary: "नाशिक जिल्ह्यात प्रसूती सेवा चोवीस तास उपलब्ध होणार आहे.",
  district: "नाशिक",
  category: "आरोग्य",
  source: "आरोग्य विभाग",
  tags: ["आरोग्य", "प्रसूती सेवा"],
});

const index = createSearchIndex([PUNE, NAGPUR, NASHIK]);
const ids = (query: string) =>
  searchArticles(index, query).map((hit) => hit.article.id);

describe("normalizeText", () => {
  it("lowercases and collapses separators", () => {
    expect(normalizeText("  Pune   Metro!  ")).toBe("pune metro");
  });

  it("strips zero-width joiners that break Devanagari matching", () => {
    const withZwnj = "पुणे" + String.fromCharCode(0x200c) + "मेट्रो";
    expect(normalizeText(withZwnj)).toBe("पुणेमेट्रो");
  });

  it("folds the Devanagari danda to a separator", () => {
    expect(normalizeText("काम पूर्ण झाले। पुढील टप्पा")).toBe(
      "काम पूर्ण झाले पुढील टप्पा",
    );
  });

  it("treats composed and decomposed forms as equal", () => {
    const composed = "नि".normalize("NFC");
    const decomposed = "नि".normalize("NFD");
    expect(normalizeText(composed)).toBe(normalizeText(decomposed));
  });
});

describe("tokenize", () => {
  it("splits on whitespace and punctuation", () => {
    expect(tokenize("पुणे, मेट्रो")).toEqual(["पुणे", "मेट्रो"]);
  });

  it("returns nothing for a blank query", () => {
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("searchArticles", () => {
  it("returns every article for an empty query", () => {
    expect(ids("")).toHaveLength(3);
  });

  it("ranks a district and title match above a body-only mention", () => {
    expect(ids("पुणे")).toEqual(["pune", "nagpur"]);
  });

  it("weights the title above the summary", () => {
    const [top] = searchArticles(index, "मेट्रो");
    expect(top.article.id).toBe("pune");
    expect(top.matchedFields[0]).toBe("title");
  });

  it("matches on category", () => {
    expect(ids("आरोग्य")).toEqual(["nashik"]);
  });

  it("matches on source", () => {
    expect(ids("महासंवाद")).toEqual(["pune"]);
  });

  it("matches on tags", () => {
    expect(ids("वाहतूक")).toEqual(["pune"]);
  });

  it("requires every token to match (AND, not OR)", () => {
    // "पुणे" hits two articles, "मेट्रो" only one; the intersection is one.
    expect(ids("पुणे मेट्रो")).toEqual(["pune"]);
  });

  it("returns nothing when one token matches nothing", () => {
    expect(ids("पुणे अंतराळ")).toEqual([]);
  });

  it("does not return obviously irrelevant articles", () => {
    expect(ids("क्रिकेट")).toEqual([]);
  });

  it("is case-insensitive for Latin text", () => {
    const latin = createSearchIndex([
      article({ id: "pdf", title: "Metro Project Update", tags: ["Transport"] }),
    ]);
    expect(searchArticles(latin, "metro")).toHaveLength(1);
    expect(searchArticles(latin, "TRANSPORT")).toHaveLength(1);
  });

  it("keeps a fuzzy match below an exact one", () => {
    // "आरोग" is a prefix of आरोग्य and matches exactly; a fuzzy-only hit on
    // another article must never overtake it.
    const hits = searchArticles(index, "आरोग");
    expect(hits[0].article.id).toBe("nashik");
  });

  it("ignores surrounding punctuation and extra whitespace", () => {
    expect(ids("  पुणे!  ")).toEqual(["pune", "nagpur"]);
  });
});

describe("findHighlightRanges", () => {
  it("maps matches back onto the original string", () => {
    const text = "पुणे मेट्रो";
    const [range] = findHighlightRanges(text, "मेट्रो");
    expect(text.slice(range.start, range.end)).toBe("मेट्रो");
  });

  it("finds every occurrence", () => {
    expect(findHighlightRanges("पुणे आणि पुणे", "पुणे")).toHaveLength(2);
  });

  it("merges overlapping ranges from different tokens", () => {
    expect(findHighlightRanges("मेट्रो", "मेट्रो मेट्")).toHaveLength(1);
  });

  it("returns nothing for a blank query", () => {
    expect(findHighlightRanges("पुणे", "")).toEqual([]);
  });
});

describe("splitByHighlights", () => {
  it("preserves the original text across the segments", () => {
    const text = "पुणे मेट्रोच्या मार्गिकेस मान्यता";
    const joined = splitByHighlights(text, "मेट्रो")
      .map((part) => part.text)
      .join("");
    expect(joined).toBe(text);
  });

  it("marks only the matched segment", () => {
    const parts = splitByHighlights("पुणे मेट्रो", "मेट्रो");
    expect(parts.filter((part) => part.hit).map((part) => part.text)).toEqual([
      "मेट्रो",
    ]);
  });
});

describe("summaryExcerpt", () => {
  it("returns short summaries untouched", () => {
    expect(summaryExcerpt("छोटा सारांश", "सारांश")).toBe("छोटा सारांश");
  });

  it("shifts the window to a late match", () => {
    const long = `${"क ".repeat(200)}विशेष शब्द`;
    const excerpt = summaryExcerpt(long, "विशेष");
    expect(excerpt.startsWith("…")).toBe(true);
    expect(excerpt).toContain("विशेष शब्द");
  });

  it("keeps the opening when the match is already near the start", () => {
    const long = `विशेष शब्द ${"क ".repeat(200)}`;
    expect(summaryExcerpt(long, "विशेष").startsWith("…")).toBe(false);
  });
});
