"use client";

import { Download, Share2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { t } from "@/lib/copy";
import { useEscapeKey, useIsClient, useScrollLock } from "@/lib/hooks";
import { PosterImage } from "@/components/articles/poster-image";
import { IconButton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Article } from "@/types/article";

/** Full-screen poster viewer with save / share actions where supported. */
export function PosterLightbox({
  article,
  open,
  onClose,
}: {
  article: Article;
  open: boolean;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const isClient = useIsClient();
  const [busy, setBusy] = useState(false);

  useScrollLock(open);
  useEscapeKey(open, onClose);

  const posterUrl = article.posterImageUrl;

  async function fetchPosterFile(): Promise<File | null> {
    if (!posterUrl) return null;
    const response = await fetch(posterUrl);
    if (!response.ok) throw new Error(`poster request failed: ${response.status}`);
    const blob = await response.blob();
    const extension = posterUrl.split(".").pop()?.split("?")[0] ?? "png";
    return new File([blob], `${article.slug}.${extension}`, { type: blob.type });
  }

  async function handleDownload() {
    if (!posterUrl || busy) return;
    setBusy(true);
    try {
      const file = await fetchPosterFile();
      if (!file) return;

      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Revoking immediately can cancel the download in some browsers.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);

      notify(t.posterDownloaded, "success");
    } catch {
      notify(t.posterDownloadFailed, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (!posterUrl || busy) return;
    setBusy(true);
    try {
      const file = await fetchPosterFile();
      if (!file) return;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: article.title });
        notify(t.posterShared, "success");
      } else {
        await navigator.share({ title: article.title, text: article.title });
        notify(t.posterShared, "success");
      }
    } catch (error) {
      // A cancelled share sheet is not a failure worth reporting.
      if ((error as Error)?.name !== "AbortError") {
        notify(t.posterShareFailed, "error");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!isClient) return null;

  const canShareFiles = typeof navigator.share === "function";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${t.posterFullscreenLabel} — ${article.title}`}
          className="fixed inset-0 z-[70] flex flex-col bg-ink/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-[calc(var(--safe-top)+0.75rem)]">
            <p className="min-w-0 flex-1 truncate px-2 text-[0.8125rem] text-white/70">
              {article.title}
            </p>

            <div className="flex shrink-0 items-center gap-1">
              {posterUrl && (
                <>
                  <IconButton
                    label={t.downloadPoster}
                    onClick={handleDownload}
                    disabled={busy}
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    <Download className="size-5" strokeWidth={2} aria-hidden="true" />
                  </IconButton>

                  {canShareFiles && (
                    <IconButton
                      label={t.sharePoster}
                      onClick={handleShare}
                      disabled={busy}
                      className="bg-white/10 text-white hover:bg-white/20"
                    >
                      <Share2 className="size-5" strokeWidth={2} aria-hidden="true" />
                    </IconButton>
                  )}
                </>
              )}

              <IconButton
                label={t.close}
                onClick={onClose}
                autoFocus
                className="bg-white/10 text-white hover:bg-white/20"
              >
                <X className="size-5" strokeWidth={2} aria-hidden="true" />
              </IconButton>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="relative min-h-0 flex-1 cursor-zoom-out p-3 pb-[calc(var(--safe-bottom)+1rem)]"
          >
            <PosterImage
              article={article}
              sizes="100vw"
              fit="contain"
              className="size-full bg-transparent"
            />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
