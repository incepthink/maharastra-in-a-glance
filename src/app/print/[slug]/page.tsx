import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles } from "@/data/articles";
import { t } from "@/lib/copy";
import { formatMarathiDateLong } from "@/lib/date";
import "./print.css";

/**
 * The printable full article — the source the shipped PDFs are rendered from.
 *
 * `npm run gen:pdfs` drives Chromium over these routes and writes
 * `public/pdfs/<slug>.pdf`, which is what `articlePdfUrl` points at. Keeping
 * the PDF a render of a real route means the article text lives in exactly one
 * place (`src/data/articles.ts`) instead of being copied into a script.
 *
 * The route stays reachable in the browser on purpose: it is a plain, printable
 * version of the article, and it is what the regenerate step previews. It is
 * excluded from search indexing because the feed, not this sheet, is the page
 * meant to be found.
 */

/** Unknown slugs 404 rather than rendering an empty sheet. */
export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/print/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) return { title: "पान सापडले नाही" };

  return {
    title: article.title,
    description: article.summary.slice(0, 180),
    robots: { index: false, follow: false },
  };
}

export default async function PrintArticlePage({
  params,
}: PageProps<"/print/[slug]">) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();

  const paragraphs = article.body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className="print-page">
      <header className="print-masthead">
        <p className="print-masthead-title">महाराष्ट्र एका नजरेत</p>
        <p className="print-masthead-source">
          {article.source}
          <br />
          {article.author ?? "माहिती व जनसंपर्क महासंचालनालय"}
        </p>
      </header>

      <p className="print-eyebrow">{article.category}</p>

      <h1 className="print-title">{article.title}</h1>

      <p className="print-dateline">
        {formatMarathiDateLong(article.date)} · {article.district}
      </p>

      {article.posterImageUrl && (
        // A plain <img>: this sheet is rendered straight to paper size, so the
        // responsive srcset next/image builds has nothing to choose between.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="print-poster"
          src={article.posterImageUrl}
          alt=""
          aria-hidden="true"
        />
      )}

      <hr className="print-rule" />

      <div className="print-body">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <dl className="print-meta">
        <div>
          <dt>{t.district}</dt>
          <dd>{article.district}</dd>
        </div>
        <div>
          <dt>{t.category}</dt>
          <dd>{article.category}</dd>
        </div>
        <div>
          <dt>{t.source}</dt>
          <dd>{article.source}</dd>
        </div>
        {article.author && (
          <div>
            <dt>{t.author}</dt>
            <dd>{article.author}</dd>
          </div>
        )}
      </dl>

      {article.tags.length > 0 && (
        <p className="print-tags">
          {t.tags}: {article.tags.join(" · ")}
        </p>
      )}

      <footer className="print-footer">
        महासंवाद — माहिती व जनसंपर्क महासंचालनालय, महाराष्ट्र शासन.
        <br />
        हा लेख ‘महाराष्ट्र एका नजरेत’ या संकेतस्थळावरून घेतला आहे.
      </footer>
    </main>
  );
}
