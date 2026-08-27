"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check, FileDown, FileText, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMarathiDate } from "@/lib/date";
import { summaryExcerpt } from "@/lib/search";
import { HighlightedText } from "@/components/search/highlighted-text";
import { PosterImage } from "@/components/articles/poster-image";
import { Badge } from "@/components/ui/primitives";
import { t } from "@/lib/copy";
import type { Article } from "@/types/article";

export type ArticleCardProps = {
  article: Article;
  query: string;
  onOpen: (article: Article) => void;
  /** Share mode turns the whole card into a selection target. */
  shareMode: boolean;
  selected: boolean;
  onToggleSelect: (article: Article) => void;
  /** First card in the feed gets an eager, high-priority poster. */
  priority?: boolean;
};

const CARD_SIZES =
  "(min-width: 1280px) 380px, (min-width: 768px) 45vw, calc(100vw - 2rem)";

export function ArticleCard({
  article,
  query,
  onOpen,
  shareMode,
  selected,
  onToggleSelect,
  priority = false,
}: ArticleCardProps) {
  const reduceMotion = useReducedMotion();
  const excerpt = summaryExcerpt(article.summary, query);

  const meta = (
    <CardMeta article={article} query={query} />
  );

  const heading = (
    <h3 className="font-display text-[1.1875rem] leading-[1.45] text-ink xs:text-[1.28rem]">
      <HighlightedText text={article.title} query={query} />
    </h3>
  );

  const poster = (
    <div className="relative">
      <PosterImage
        article={article}
        sizes={CARD_SIZES}
        priority={priority}
        className="aspect-[3/2] w-full sm:aspect-[16/10]"
      />

      {shareMode && <SelectionMark selected={selected} />}
    </div>
  );

  const body = (
    <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
      {article.featured && (
        <div>
          <Badge tone="saffron">
            <Star className="size-3" strokeWidth={2.5} aria-hidden="true" />
            {t.featured}
          </Badge>
        </div>
      )}
      {meta}
      {heading}
      <p className="line-clamp-3 text-[0.9375rem] leading-[1.75] text-ink-soft">
        <HighlightedText text={excerpt} query={query} />
      </p>
      <TagRow article={article} query={query} />
    </div>
  );

  /* -- Share mode: the entire card is one big checkbox -------------------- */
  if (shareMode) {
    return (
      <motion.div
        layout={!reduceMotion}
        role="checkbox"
        aria-checked={selected}
        tabIndex={0}
        aria-label={t.selectArticle(article.title)}
        onClick={() => onToggleSelect(article)}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            onToggleSelect(article);
          }
        }}
        className={cn(
          "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card text-left",
          "transition-[border-color,box-shadow,transform] duration-200 ease-editorial",
          "active:scale-[0.995]",
          selected
            ? "border-saffron shadow-lift ring-2 ring-saffron/20"
            : "border-line shadow-card hover:border-line-strong",
        )}
      >
        {poster}
        {body}
        <div
          className={cn(
            "flex items-center gap-2 border-t px-4 py-3 text-[0.8125rem] font-medium transition-colors sm:px-5",
            selected
              ? "border-saffron-line bg-saffron-tint text-saffron-deep"
              : "border-line-soft bg-paper/60 text-ink-mute",
          )}
        >
          <Check
            className={cn("size-4", selected ? "opacity-100" : "opacity-35")}
            strokeWidth={2.5}
            aria-hidden="true"
          />
          {selected ? t.selected : t.tapToSelect}
        </div>
      </motion.div>
    );
  }

  /* -- Reading mode ------------------------------------------------------- */
  return (
    <motion.article
      layout={!reduceMotion}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card",
        "transition-[border-color,box-shadow,transform] duration-250 ease-editorial",
        "hover:border-line-strong md:hover:-translate-y-0.5 md:hover:shadow-lift",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(article)}
        className="flex flex-1 flex-col text-left"
        aria-label={t.readFullSummaryOf(article.title)}
      >
        {poster}
        {body}
      </button>

      <CardActions article={article} onOpen={onOpen} />
    </motion.article>
  );
}

/* ------------------------------------------------------------------ pieces */

function CardMeta({ article, query }: { article: Article; query: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-ink-mute">
      <span className="inline-flex items-center gap-1 font-medium text-saffron-deep">
        <MapPin className="size-3" strokeWidth={2.25} aria-hidden="true" />
        <HighlightedText text={article.district} query={query} />
      </span>
      <Dot />
      <span>
        <HighlightedText text={article.category} query={query} />
      </span>
      <Dot />
      <time dateTime={article.date}>{formatMarathiDate(article.date)}</time>
      <Dot />
      <span className="truncate">
        <HighlightedText text={article.source} query={query} />
      </span>
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden="true" className="text-line-strong">
      ·
    </span>
  );
}

function TagRow({ article, query }: { article: Article; query: string }) {
  if (article.tags.length === 0) return null;

  return (
    <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
      {/* Three tags is what fits on a 360px screen without a second row. */}
      {article.tags.slice(0, 3).map((tag) => (
        <li
          key={tag}
          className="rounded-md border border-line-soft bg-paper px-2 py-0.5 text-[0.6875rem] text-ink-mute"
        >
          <HighlightedText text={tag} query={query} />
        </li>
      ))}
      {article.tags.length > 3 && (
        <li className="px-1 py-0.5 text-[0.6875rem] text-ink-faint">
          {t.moreTags(article.tags.length - 3)}
        </li>
      )}
    </ul>
  );
}

/** Shared by the PDF and DOCX segments of the action row. */
const FILE_ACTION =
  "flex min-h-12 shrink-0 items-center justify-center gap-1.5 px-4 " +
  "text-[0.875rem] font-medium text-ink-soft transition-colors " +
  "hover:bg-paper-2 hover:text-ink active:bg-paper-3";

function CardActions({
  article,
  onOpen,
}: {
  article: Article;
  onOpen: (article: Article) => void;
}) {
  return (
    <div className="flex items-stretch border-t border-line-soft">
      <button
        type="button"
        onClick={() => onOpen(article)}
        className="flex min-h-12 flex-1 items-center justify-center gap-2 px-4 text-[0.875rem] font-semibold text-saffron-deep transition-colors hover:bg-saffron-tint active:bg-saffron-tint"
      >
        {t.readFullSummary}
      </button>

      <span aria-hidden="true" className="w-px bg-line-soft" />

      {article.articlePdfUrl ? (
        <a
          href={article.articlePdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={FILE_ACTION}
          aria-label={t.openPdfOf(article.title)}
        >
          <FileText className="size-4" strokeWidth={2} aria-hidden="true" />
          {t.pdf}
        </a>
      ) : (
        <span
          className="flex min-h-12 shrink-0 items-center justify-center gap-1.5 px-4 text-[0.875rem] text-ink-faint"
          title={t.pdfUnavailable}
        >
          <FileText className="size-4" strokeWidth={2} aria-hidden="true" />
          {t.pdfUnavailableShort}
        </span>
      )}

      {/* The editable copy is an extra, not a fallback: an article without one
          keeps the PDF segment rather than showing a second dead state. */}
      {article.articleDocxUrl && (
        <>
          <span aria-hidden="true" className="w-px bg-line-soft" />
          <a
            href={article.articleDocxUrl}
            download
            className={FILE_ACTION}
            aria-label={t.openDocxOf(article.title)}
          >
            <FileDown className="size-4" strokeWidth={2} aria-hidden="true" />
            {t.docx}
          </a>
        </>
      )}
    </div>
  );
}

/** The large selection affordance shown on posters while share mode is on. */
function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="absolute right-3 top-3 flex size-11 items-center justify-center"
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full border-2 transition-all duration-200 ease-editorial",
          selected
            ? "scale-100 border-saffron bg-saffron text-white shadow-lift"
            : "border-white/85 bg-ink/25 text-transparent backdrop-blur-sm",
        )}
      >
        <Check className="size-4" strokeWidth={3} />
      </span>
    </span>
  );
}
