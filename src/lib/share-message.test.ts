import { describe, expect, it } from "vitest";
import {
  buildArticleBlock,
  buildShareMessage,
  buildWhatsAppLink,
  messageLength,
  resolveAbsoluteUrl,
  WHATSAPP_TEXT_SAFE_LENGTH,
} from "@/lib/share-message";
import type { Article } from "@/types/article";

const ORIGIN = "https://example.org";

function article(overrides: Partial<Article> & { id: string }): Article {
  return {
    slug: overrides.id,
    title: "पुणे मेट्रोच्या मार्गिकेस मान्यता",
    date: "2026-08-21",
    summary: "पहिला परिच्छेद.\n\nदुसरा परिच्छेद.",
    posterImageUrl: null,
    articlePdfUrl: "/pdf/demo-01.pdf",
    category: "पायाभूत सुविधा",
    district: "पुणे",
    source: "महासंवाद",
    language: "mr",
    tags: [],
    featured: false,
    ...overrides,
  };
}

const A = article({ id: "a1" });
const B = article({
  id: "a2",
  title: "जलयुक्त गाव अभियान",
  date: "2026-08-18",
  summary: "जलसंधारणाची कामे सुरू.",
  articlePdfUrl: "https://cdn.example.com/full/a2.pdf",
});
const NO_PDF = article({ id: "a3", title: "PDF नसलेली बातमी", articlePdfUrl: null });

describe("resolveAbsoluteUrl", () => {
  it("leaves absolute URLs alone", () => {
    expect(resolveAbsoluteUrl("https://x.test/a.pdf", ORIGIN)).toBe(
      "https://x.test/a.pdf",
    );
  });

  it("resolves site-relative paths against the origin", () => {
    expect(resolveAbsoluteUrl("/pdf/a.pdf", ORIGIN)).toBe(
      "https://example.org/pdf/a.pdf",
    );
  });

  it("tolerates a trailing slash on the origin and a missing leading slash", () => {
    expect(resolveAbsoluteUrl("pdf/a.pdf", "https://example.org/")).toBe(
      "https://example.org/pdf/a.pdf",
    );
  });

  it("returns null for a missing or blank URL", () => {
    expect(resolveAbsoluteUrl(null, ORIGIN)).toBeNull();
    expect(resolveAbsoluteUrl("   ", ORIGIN)).toBeNull();
  });
});

describe("buildArticleBlock", () => {
  const block = buildArticleBlock(A, { origin: ORIGIN });

  it("leads with the title", () => {
    expect(block.split("\n")[0]).toBe(A.title);
  });

  it("labels the date in Marathi", () => {
    expect(block).toContain("दिनांक: २१ ऑगस्ट २०२६");
  });

  it("reproduces the summary verbatim, paragraph breaks included", () => {
    expect(block).toContain(A.summary);
  });

  it("ends with the absolute PDF URL under its label", () => {
    expect(block).toContain("संपूर्ण लेख (PDF):\nhttps://example.org/pdf/demo-01.pdf");
  });

  it("says so plainly when there is no PDF", () => {
    const withoutPdf = buildArticleBlock(NO_PDF, { origin: ORIGIN });
    expect(withoutPdf).toContain("संपूर्ण लेख (PDF): सध्या उपलब्ध नाही");
    expect(withoutPdf).not.toContain("undefined");
    expect(withoutPdf).not.toContain("null");
  });
});

describe("buildShareMessage", () => {
  it("returns an empty string when nothing is selected", () => {
    expect(buildShareMessage([])).toBe("");
  });

  it("lists articles in the given order", () => {
    const message = buildShareMessage([A, B], { origin: ORIGIN });
    expect(message.indexOf(A.title)).toBeLessThan(message.indexOf(B.title));
  });

  it("separates every article with a rule", () => {
    const message = buildShareMessage([A, B], { origin: ORIGIN });
    // One rule under the header plus one closing each of the two articles.
    expect(message.split("────────────────────").length - 1).toBe(3);
  });

  it("never shortens a long summary", () => {
    const long = article({ id: "long", summary: "अ".repeat(4000) });
    expect(buildShareMessage([long], { origin: ORIGIN })).toContain(long.summary);
  });

  it("carries every selected article's PDF link", () => {
    const message = buildShareMessage([A, B], { origin: ORIGIN });
    expect(message).toContain("https://example.org/pdf/demo-01.pdf");
    expect(message).toContain("https://cdn.example.com/full/a2.pdf");
  });

  it("can omit the footer credit", () => {
    const message = buildShareMessage([A], {
      origin: ORIGIN,
      includeFooter: false,
    });
    expect(message).not.toContain("संकेतस्थळावरून");
  });

  it("contains no emoji or pictographic characters", () => {
    const message = buildShareMessage([A, B, NO_PDF], { origin: ORIGIN });
    expect(/\p{Extended_Pictographic}/u.test(message)).toBe(false);
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with the message encoded", () => {
    const { url } = buildWhatsAppLink("नमस्कार जग");
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(url.slice("https://wa.me/?text=".length))).toBe(
      "नमस्कार जग",
    );
  });

  it("survives characters that would otherwise break the query string", () => {
    const { url } = buildWhatsAppLink("a&b=c #d\ne");
    expect(decodeURIComponent(url.split("text=")[1])).toBe("a&b=c #d\ne");
  });

  it("does not warn about a message of ordinary length", () => {
    // A couple of full articles must not trip the warning.
    expect(buildWhatsAppLink("अ".repeat(2000)).exceedsSafeLength).toBe(false);
  });

  it("flags a message too long to travel through a URL", () => {
    const long = buildWhatsAppLink("अ".repeat(WHATSAPP_TEXT_SAFE_LENGTH + 1));
    expect(long.exceedsSafeLength).toBe(true);
    // The message itself is still complete — nothing is truncated.
    expect(decodeURIComponent(long.url.split("text=")[1])).toHaveLength(
      WHATSAPP_TEXT_SAFE_LENGTH + 1,
    );
  });

  it("reports the encoded length, which Devanagari inflates ninefold", () => {
    expect(buildWhatsAppLink("अ").encodedLength).toBe(9);
  });
});

describe("messageLength", () => {
  it("counts code points, not UTF-16 units", () => {
    expect(messageLength("पुणे")).toBe(4);
  });
});
