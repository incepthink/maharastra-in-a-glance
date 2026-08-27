"use client";

import {
  Building2,
  Expand,
  ExternalLink,
  FileDown,
  FileText,
  MapPin,
  Star,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/copy";
import { formatMarathiDateLong } from "@/lib/date";
import { useMediaQuery } from "@/lib/hooks";
import { PosterImage } from "@/components/articles/poster-image";
import { PosterLightbox } from "@/components/articles/poster-lightbox";
import { Badge, Eyebrow, Rule } from "@/components/ui/primitives";
import { IconButton } from "@/components/ui/button";
import { Overlay, SheetHandle, useDialogIds } from "@/components/ui/overlay";
import type { Article } from "@/types/article";

/**
 * The full article view.
 *
 * There is not enough content per article to justify its own route, so this is
 * a dialog — but it is URL-addressable (`?article=<slug>`) and closes on the
 * browser's back gesture, which is what phone users actually reach for.
 */
export function ArticleDialog({
  article,
  onClose,
}: {
  article: Article | null;
  onClose: () => void;
}) {
  const { titleId, descriptionId } = useDialogIds();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Reset the lightbox whenever a different article takes over the dialog.
  // Both sides must be normalised to null, or the comparison never settles.
  const slug = article?.slug ?? null;
  const [lastSlug, setLastSlug] = useState<string | null>(slug);
  if (slug !== lastSlug) {
    setLastSlug(slug);
    if (lightboxOpen) setLightboxOpen(false);
  }

  return (
    <>
      <Overlay
        open={article !== null}
        onClose={onClose}
        variant={isDesktop ? "dialog" : "sheet"}
        labelledBy={titleId}
        describedBy={descriptionId}
        className="md:max-w-3xl"
      >
        {article && (
          <>
            {!isDesktop && <SheetHandle />}

            <header className="flex shrink-0 items-start gap-3 border-b border-line px-4 py-3 md:px-6 md:py-4">
              <div className="min-w-0 flex-1">
                <Eyebrow>{article.category}</Eyebrow>
                <p className="mt-0.5 truncate text-[0.8125rem] text-ink-mute">
                  {article.district}
                </p>
              </div>

              <IconButton
                label={t.closeArticle}
                variant="quiet"
                onClick={onClose}
                className="-mr-1"
              >
                <X className="size-5" strokeWidth={2} aria-hidden="true" />
              </IconButton>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <PosterBlock
                article={article}
                onExpand={() => setLightboxOpen(true)}
              />

              <div className="px-4 pb-6 pt-5 md:px-8 md:pb-8">
                {article.featured && (
                  <Badge tone="saffron" className="mb-3">
                    <Star className="size-3" strokeWidth={2.5} aria-hidden="true" />
                    {t.featured}
                  </Badge>
                )}

                <h2
                  id={titleId}
                  className="font-display text-[1.375rem] leading-[1.42] text-ink sm:text-[1.625rem] md:text-[1.875rem]"
                >
                  {article.title}
                </h2>

                <time
                  dateTime={article.date}
                  className="mt-2.5 block text-[0.8125rem] text-ink-mute"
                >
                  {formatMarathiDateLong(article.date)}
                </time>

                <Rule className="my-5" />

                <Eyebrow>{t.summaryHeading}</Eyebrow>
                <div
                  id={descriptionId}
                  className="mt-3 space-y-4 text-[1rem] leading-[1.85] text-ink-soft"
                >
                  {article.summary
                    .split(/\n\s*\n/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                </div>

                <Rule className="my-6" />

                <MetaList article={article} />

                {article.tags.length > 0 && <TagList article={article} />}
              </div>
            </div>

            <DownloadFooter article={article} />
          </>
        )}
      </Overlay>

      {article && (
        <PosterLightbox
          article={article}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ pieces */

function PosterBlock({
  article,
  onExpand,
}: {
  article: Article;
  onExpand: () => void;
}) {
  return (
    <div className="relative bg-paper-2">
      <PosterImage
        article={article}
        sizes="(min-width: 768px) 768px, 100vw"
        priority
        className="aspect-[4/3] w-full sm:aspect-[16/9]"
      />

      <button
        type="button"
        onClick={onExpand}
        aria-label={t.viewPosterFullscreen}
        title={t.viewPosterFullscreen}
        className={cn(
          "absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-1.5 rounded-full",
          "border border-white/25 bg-ink/55 px-3.5 text-[0.8125rem] font-medium text-white backdrop-blur-sm",
          "transition-colors hover:bg-ink/70 active:scale-[0.97]",
        )}
      >
        <Expand className="size-4" strokeWidth={2} aria-hidden="true" />
        <span className="hidden xs:inline">{t.viewPosterFullscreen}</span>
      </button>
    </div>
  );
}

function MetaList({ article }: { article: Article }) {
  const rows: Array<{
    icon: typeof MapPin;
    label: string;
    value: string;
  }> = [
    { icon: MapPin, label: t.district, value: article.district },
    { icon: Tag, label: t.category, value: article.category },
    { icon: Building2, label: t.source, value: article.source },
  ];

  // The byline is optional; omit the row rather than showing an empty value.
  if (article.author) {
    rows.push({ icon: UserRound, label: t.author, value: article.author });
  }

  return (
    <>
      <Eyebrow>{t.detailsHeading}</Eyebrow>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2.5">
            <Icon
              className="mt-0.5 size-4 shrink-0 text-ink-faint"
              strokeWidth={2}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className="text-[0.75rem] text-ink-faint">
                {label}
              </dt>
              <dd className="text-[0.9375rem] text-ink">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </>
  );
}

function TagList({ article }: { article: Article }) {
  return (
    <>
      <Eyebrow className="mt-6 block">{t.tags}</Eyebrow>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-lg border border-line-soft bg-paper px-2.5 py-1 text-[0.8125rem] text-ink-soft"
          >
            {tag}
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * The full-article downloads: the PDF as the primary action, and — when the
 * article ships one — the editable DOCX beside it. The DOCX sits second
 * because most readers want to read, not edit; it stacks under the PDF on
 * narrow phones so neither label has to truncate.
 */
function DownloadFooter({ article }: { article: Article }) {
  return (
    <div className="shrink-0 border-t border-line bg-card px-4 pb-[calc(var(--safe-bottom)+0.75rem)] pt-3 md:px-6 md:pb-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        {article.articlePdfUrl ? (
          <a
            href={article.articlePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex min-h-12 w-full flex-1 items-center justify-center gap-2 rounded-xl bg-saffron px-5",
              "text-[0.9375rem] font-semibold text-white shadow-card",
              "transition-colors hover:bg-saffron-deep active:scale-[0.99]",
            )}
          >
            <FileText className="size-4.5" strokeWidth={2} aria-hidden="true" />
            {t.openPdf}
            <ExternalLink
              className="size-3.5 opacity-70"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="sr-only">({t.pdfOpensNewTab})</span>
          </a>
        ) : (
          <p className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong px-5 text-[0.875rem] text-ink-mute">
            <FileText className="size-4" strokeWidth={2} aria-hidden="true" />
            {t.pdfUnavailable}
          </p>
        )}

        {article.articleDocxUrl && (
          <a
            href={article.articleDocxUrl}
            download
            className={cn(
              "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line-strong px-5",
              "text-[0.9375rem] font-semibold text-ink-soft",
              "transition-colors hover:bg-paper-2 hover:text-ink active:scale-[0.99]",
              "sm:w-auto sm:shrink-0",
            )}
          >
            <FileDown className="size-4.5" strokeWidth={2} aria-hidden="true" />
            {t.docx}
            <span className="sr-only">
              {t.openDocx} ({t.docxDownloads})
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
