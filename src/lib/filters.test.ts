import { describe, expect, it } from "vitest";
import {
  applyFilters,
  buildFacets,
  countActiveFilters,
  normalizeDateRange,
  removeFilter,
  sortArticles,
  toggleFilterValue,
} from "@/lib/filters";
import { EMPTY_FILTERS, type Article, type FilterState } from "@/types/article";

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
  date: "2026-08-21",
  district: "पुणे",
  category: "पायाभूत सुविधा",
  source: "महासंवाद",
  tags: ["मेट्रो", "वाहतूक"],
  featured: true,
});

const NAGPUR = article({
  id: "nagpur",
  date: "2026-08-14",
  district: "नागपूर",
  category: "उद्योग",
  source: "उद्योग संचालनालय",
  tags: ["उद्योग"],
});

const NASHIK = article({
  id: "nashik",
  date: "2026-08-09",
  district: "नाशिक",
  category: "आरोग्य",
  source: "आरोग्य विभाग",
  tags: ["आरोग्य", "वाहतूक"],
});

const ALL = [PUNE, NAGPUR, NASHIK];

const withFilters = (overrides: Partial<FilterState>): FilterState => ({
  ...EMPTY_FILTERS,
  ...overrides,
});

const ids = (list: Article[]) => list.map((a) => a.id);

describe("buildFacets", () => {
  it("collects distinct values from every article", () => {
    const facets = buildFacets(ALL);
    expect(facets.districts).toHaveLength(3);
    expect(facets.categories).toHaveLength(3);
    expect(facets.sources).toHaveLength(3);
  });

  it("de-duplicates tags shared across articles", () => {
    expect(buildFacets(ALL).tags).toEqual(
      expect.arrayContaining(["मेट्रो", "वाहतूक", "उद्योग", "आरोग्य"]),
    );
    expect(buildFacets(ALL).tags).toHaveLength(4);
  });

  it("returns empty facets for an empty list", () => {
    expect(buildFacets([])).toEqual({
      districts: [],
      categories: [],
      sources: [],
      tags: [],
    });
  });
});

describe("applyFilters", () => {
  it("returns everything when nothing is applied", () => {
    expect(applyFilters(ALL, EMPTY_FILTERS)).toHaveLength(3);
  });

  it("filters by district", () => {
    expect(ids(applyFilters(ALL, withFilters({ districts: ["पुणे"] })))).toEqual([
      "pune",
    ]);
  });

  it("ORs multiple values within one facet", () => {
    const result = applyFilters(
      ALL,
      withFilters({ districts: ["पुणे", "नाशिक"] }),
    );
    expect(ids(result)).toEqual(["pune", "nashik"]);
  });

  it("ANDs across different facets", () => {
    const result = applyFilters(
      ALL,
      withFilters({ districts: ["पुणे"], categories: ["उद्योग"] }),
    );
    expect(result).toEqual([]);
  });

  it("keeps an article matching any selected tag", () => {
    expect(ids(applyFilters(ALL, withFilters({ tags: ["वाहतूक"] })))).toEqual([
      "pune",
      "nashik",
    ]);
  });

  it("filters to featured articles", () => {
    expect(ids(applyFilters(ALL, withFilters({ featuredOnly: true })))).toEqual([
      "pune",
    ]);
  });

  it("applies an inclusive date range", () => {
    const result = applyFilters(
      ALL,
      withFilters({ from: "2026-08-09", to: "2026-08-14" }),
    );
    expect(ids(result)).toEqual(["nagpur", "nashik"]);
  });

  it("treats a lone `from` as an open-ended lower bound", () => {
    expect(ids(applyFilters(ALL, withFilters({ from: "2026-08-14" })))).toEqual([
      "pune",
      "nagpur",
    ]);
  });

  it("combines a filter with sorting without mutating the input", () => {
    const before = [...ALL];
    sortArticles(applyFilters(ALL, EMPTY_FILTERS), "oldest");
    expect(ALL).toEqual(before);
  });
});

describe("sortArticles", () => {
  it("sorts newest first", () => {
    expect(ids(sortArticles(ALL, "newest"))).toEqual([
      "pune",
      "nagpur",
      "nashik",
    ]);
  });

  it("sorts oldest first", () => {
    expect(ids(sortArticles(ALL, "oldest"))).toEqual([
      "nashik",
      "nagpur",
      "pune",
    ]);
  });

  it("does not mutate its input", () => {
    const input = [...ALL];
    sortArticles(input, "oldest");
    expect(ids(input)).toEqual(["pune", "nagpur", "nashik"]);
  });
});

describe("countActiveFilters", () => {
  it("counts nothing for a cleared state", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
  });

  it("counts each selected value and each bound separately", () => {
    const filters = withFilters({
      districts: ["पुणे", "नाशिक"],
      tags: ["वाहतूक"],
      featuredOnly: true,
      from: "2026-08-01",
      to: "2026-08-31",
    });
    expect(countActiveFilters(filters)).toBe(6);
  });
});

describe("toggleFilterValue", () => {
  it("adds a value that is not selected", () => {
    expect(
      toggleFilterValue(EMPTY_FILTERS, "districts", "पुणे").districts,
    ).toEqual(["पुणे"]);
  });

  it("removes a value that is already selected", () => {
    const filters = withFilters({ districts: ["पुणे"] });
    expect(toggleFilterValue(filters, "districts", "पुणे").districts).toEqual([]);
  });

  it("leaves other facets untouched", () => {
    const filters = withFilters({ categories: ["उद्योग"] });
    expect(
      toggleFilterValue(filters, "districts", "पुणे").categories,
    ).toEqual(["उद्योग"]);
  });
});

describe("removeFilter", () => {
  it("removes one value from a multi-select facet", () => {
    const filters = withFilters({ districts: ["पुणे", "नाशिक"] });
    expect(
      removeFilter(filters, { kind: "districts", value: "पुणे" }).districts,
    ).toEqual(["नाशिक"]);
  });

  it("clears the featured switch", () => {
    const filters = withFilters({ featuredOnly: true });
    expect(removeFilter(filters, { kind: "featuredOnly" }).featuredOnly).toBe(
      false,
    );
  });

  it("clears a single date bound", () => {
    const filters = withFilters({ from: "2026-08-01", to: "2026-08-31" });
    const next = removeFilter(filters, { kind: "from" });
    expect(next.from).toBeNull();
    expect(next.to).toBe("2026-08-31");
  });
});

describe("normalizeDateRange", () => {
  it("passes a valid range through", () => {
    expect(normalizeDateRange("2026-08-01", "2026-08-31")).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
  });

  it("swaps a reversed range", () => {
    expect(normalizeDateRange("2026-08-31", "2026-08-01")).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
  });

  it("discards malformed values from the URL", () => {
    expect(normalizeDateRange("not-a-date", "2026-13-45")).toEqual({
      from: null,
      to: null,
    });
  });
});
