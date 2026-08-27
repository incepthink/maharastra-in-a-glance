"use client";

import { ArrowLeft, FileDown, FileText, MapPin, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { formatMarathiDate } from "@/lib/date";
import { t } from "@/lib/copy";
import { HighlightedText } from "@/components/search/highlighted-text";
import { PosterImage } from "@/components/articles/poster-image";
import { Badge } from "@/components/ui/primitives";
import type { Article } from "@/types/article";

/** The PDF and DOCX links flanking the lead story's primary action. */
const FILE_LINK =
  "inline-flex min-h-11 items-center gap-2 rounded-xl border border-line " +
  "bg-card px-4 text-[0.9375rem] font-medium text-ink-soft transition-colors " +
  "hover:border-line-strong hover:text-ink";

/**
 * The lead story.
 *
 * On phones it is a single tall block whose poster gets real height — the one
 * place the feed spends vertical space. From `md` up it becomes a two-column
 * editorial spread.
 */
export function FeaturedArticle({
  article,
  query,
  onOpen,
}: {
  article: Article;
  query: string;
  onOpen: (article: Article) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group overflow-hidden rounded-2xl border border-line bg-card shadow-card",
        "md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(article)}
        aria-label={t.readFullSummaryOf(article.title)}
        className="relative block w-full text-left md:h-full"
      >
        <PosterImage
          article={article}
          sizes="(min-width: 1024px) 520px, (min-width: 768px) 45vw, calc(100vw - 2rem)"
          priority
          className="aspect-[4/3] w-full sm:aspect-[16/9] md:h-full md:aspect-auto md:min-h-[22rem]"
        />
      </button>

      <div className="flex flex-col justify-center gap-3 p-5 sm:p-6 md:p-8">
        <div>
          <Badge tone="saffron">
            <Star className="size-3" strokeWidth={2.5} aria-hidden="true" />
            {t.featured}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-ink-mute">
          <span className="inline-flex items-center gap-1 font-medium text-saffron-deep">
            <MapPin className="size-3" strokeWidth={2.25} aria-hidden="true" />
            <HighlightedText text={article.district} query={query} />
          </span>
          <span aria-hidden="true" className="text-line-strong">
            ·
          </span>
          <span>
            <HighlightedText text={article.category} query={query} />
          </span>
          <span aria-hidden="true" className="text-line-strong">
            ·
          </span>
          <time dateTime={article.date}>{formatMarathiDate(article.date)}</time>
        </div>

        <h2 className="font-display text-[1.5rem] leading-[1.4] text-ink sm:text-[1.75rem] md:text-[2rem]">
          <button
            type="button"
            onClick={() => onOpen(article)}
            className="text-left transition-colors hover:text-saffron-deep"
          >
            <HighlightedText text={article.title} query={query} />
          </button>
        </h2>

        <p className="line-clamp-4 text-[0.9375rem] leading-[1.8] text-ink-soft sm:text-base">
          <HighlightedText text={article.summary} query={query} />
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpen(article)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-saffron px-5 text-[0.9375rem] font-semibold text-white shadow-card transition-colors hover:bg-saffron-deep active:scale-[0.985]"
          >
            {t.readFullSummary}
            <ArrowLeft className="size-4" strokeWidth={2.25} aria-hidden="true" />
          </button>

          {article.articlePdfUrl && (
            <a
              href={article.articlePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.openPdfOf(article.title)}
              className={FILE_LINK}
            >
              <FileText className="size-4" strokeWidth={2} aria-hidden="true" />
              {t.pdf}
            </a>
          )}

          {article.articleDocxUrl && (
            <a
              href={article.articleDocxUrl}
              download
              aria-label={t.openDocxOf(article.title)}
              className={FILE_LINK}
            >
              <FileDown className="size-4" strokeWidth={2} aria-hidden="true" />
              {t.docx}
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}
