import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIEW_STATE,
  readViewState,
  toSearchString,
  writeViewState,
  type ViewState,
} from "@/lib/url-state";

const read = (search: string) => readViewState(new URLSearchParams(search));

describe("readViewState", () => {
  it("falls back to sane defaults for an empty URL", () => {
    expect(read("")).toEqual(DEFAULT_VIEW_STATE);
  });

  it("reads the query, sort and open article", () => {
    const state = read("q=%E0%A4%AA%E0%A5%81%E0%A4%A3%E0%A5%87&sort=oldest&article=a-slug");
    expect(state.query).toBe("पुणे");
    expect(state.sort).toBe("oldest");
    expect(state.articleSlug).toBe("a-slug");
  });

  it("splits comma-joined multi-select filters", () => {
    expect(read("district=पुणे,नाशिक").filters.districts).toEqual([
      "पुणे",
      "नाशिक",
    ]);
  });

  it("drops blank and duplicate list entries", () => {
    expect(read("tag=अ,,अ,ब").filters.tags).toEqual(["अ", "ब"]);
  });

  it("treats any sort value other than `oldest` as newest", () => {
    expect(read("sort=nonsense").sort).toBe("newest");
  });

  it("only enables the featured filter for an explicit 1", () => {
    expect(read("featured=1").filters.featuredOnly).toBe(true);
    expect(read("featured=true").filters.featuredOnly).toBe(false);
  });

  it("discards a malformed date and repairs a reversed range", () => {
    expect(read("from=nope").filters.from).toBeNull();
    expect(read("from=2026-08-31&to=2026-08-01").filters).toMatchObject({
      from: "2026-08-01",
      to: "2026-08-31",
    });
  });
});

describe("writeViewState", () => {
  it("emits nothing for the default view, keeping shared links clean", () => {
    expect(writeViewState(DEFAULT_VIEW_STATE)).toBe("");
    expect(toSearchString(DEFAULT_VIEW_STATE)).toBe("");
  });

  it("omits an all-whitespace query", () => {
    expect(writeViewState({ ...DEFAULT_VIEW_STATE, query: "   " })).toBe("");
  });

  it("prefixes a non-empty search string with `?`", () => {
    expect(toSearchString({ ...DEFAULT_VIEW_STATE, articleSlug: "x" })).toBe(
      "?article=x",
    );
  });
});

describe("round trip", () => {
  it("preserves a fully populated view", () => {
    const state: ViewState = {
      query: "पुणे मेट्रो",
      sort: "oldest",
      articleSlug: "pune-metro",
      filters: {
        districts: ["पुणे", "नाशिक"],
        categories: ["उद्योग"],
        sources: ["महासंवाद"],
        tags: ["मेट्रो"],
        featuredOnly: true,
        from: "2026-08-01",
        to: "2026-08-31",
      },
    };

    expect(read(writeViewState(state))).toEqual(state);
  });

  it("survives values containing an ampersand", () => {
    const state: ViewState = {
      ...DEFAULT_VIEW_STATE,
      query: "a&b=c",
    };
    expect(read(writeViewState(state)).query).toBe("a&b=c");
  });
});
