"use client";

import { Copy, MessageCircle, Share2, TriangleAlert, X } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/copy";
import { useIsClient, useMediaQuery } from "@/lib/hooks";
import {
  buildShareMessage,
  buildWhatsAppLink,
  messageLength,
} from "@/lib/share-message";
import { IconButton } from "@/components/ui/button";
import { Overlay, SheetHandle, useDialogIds } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import type { Article } from "@/types/article";

/**
 * Shows exactly what will be sent, then offers every way to send it.
 *
 * Nothing here silently alters the message: if a channel cannot carry it, the
 * limitation is explained and copying stays available.
 */
export function SharePreview({
  open,
  onClose,
  articles,
}: {
  open: boolean;
  onClose: () => void;
  articles: Article[];
}) {
  const { titleId, descriptionId } = useDialogIds();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { notify } = useToast();
  // Both reads need a browser. Gating on `useIsClient` keeps the hydrating
  // render identical to the server's, without a state-setting effect.
  const isClient = useIsClient();
  const origin = isClient ? window.location.origin : "";
  const canShare = isClient && typeof navigator.share === "function";

  const message = useMemo(
    () => buildShareMessage(articles, { origin: origin || undefined }),
    [articles, origin],
  );

  const whatsapp = useMemo(() => buildWhatsAppLink(message), [message]);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        copyViaTextarea(message);
      }
      notify(t.copied, "success");
    } catch {
      notify(t.copyFailed, "error");
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: t.siteName, text: message });
      notify(t.shareSuccess, "success");
    } catch (error) {
      // Dismissing the OS sheet is a normal outcome, not an error.
      if ((error as Error)?.name !== "AbortError") {
        notify(t.shareFailed, "error");
      }
    }
  }

  function handleWhatsApp() {
    window.open(whatsapp.url, "_blank", "noopener,noreferrer");
    notify(t.whatsappOpened, "info");
  }

  return (
    <Overlay
      open={open}
      onClose={onClose}
      variant={isDesktop ? "dialog" : "sheet"}
      labelledBy={titleId}
      describedBy={descriptionId}
      className="md:max-w-2xl"
    >
      {!isDesktop && <SheetHandle />}

      <header className="flex shrink-0 items-start gap-3 border-b border-line px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-lg text-ink">
            {t.sharePreviewTitle}
          </h2>
          <p id={descriptionId} className="mt-0.5 text-[0.8125rem] text-ink-mute">
            {t.selectedCount(articles.length)} ·{" "}
            {t.messageLength(messageLength(message))}
          </p>
        </div>

        <IconButton label={t.close} variant="quiet" onClick={onClose}>
          <X className="size-5" strokeWidth={2} aria-hidden="true" />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6">
        {whatsapp.exceedsSafeLength && (
          <div className="mb-4 flex gap-2.5 rounded-xl border border-gold/30 bg-gold-tint px-3.5 py-3">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-gold"
              strokeWidth={2}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-[0.875rem] font-semibold text-ink">
                {t.whatsappTooLongTitle}
              </p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
                {t.whatsappTooLong}
              </p>
            </div>
          </div>
        )}

        {/* The message verbatim — what you see is exactly what gets sent. */}
        <pre
          className={cn(
            "whitespace-pre-wrap break-words rounded-xl border border-line bg-card p-4",
            "font-sans text-[0.875rem] leading-[1.75] text-ink-soft",
          )}
        >
          {message}
        </pre>
      </div>

      <footer className="shrink-0 space-y-2 border-t border-line bg-card px-4 pb-[calc(var(--safe-bottom)+0.75rem)] pt-3 md:px-6 md:pb-4">
        <div className="flex gap-2">
          <ShareAction
            icon={MessageCircle}
            label={t.shareViaWhatsApp}
            accessibleLabel={t.shareViaWhatsAppLong}
            onClick={handleWhatsApp}
            variant="primary"
          />
          <ShareAction
            icon={Copy}
            label={t.copyMessage}
            accessibleLabel={t.copyMessageLong}
            onClick={handleCopy}
          />
        </div>

        {canShare ? (
          <ShareAction
            icon={Share2}
            label={t.shareViaDevice}
            onClick={handleNativeShare}
            block
          />
        ) : (
          <p className="pt-0.5 text-center text-[0.75rem] leading-relaxed text-ink-faint">
            {t.nativeShareUnavailable}
          </p>
        )}
      </footer>
    </Overlay>
  );
}

/* ------------------------------------------------------------------ pieces */

function ShareAction({
  icon: Icon,
  label,
  accessibleLabel,
  onClick,
  variant = "secondary",
  block = false,
}: {
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  label: string;
  /** Fuller phrasing for screen readers when the visible label is shortened. */
  accessibleLabel?: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  block?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={accessibleLabel}
      title={accessibleLabel ?? label}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4",
        "text-[0.9375rem] font-semibold transition-all active:scale-[0.985]",
        block ? "w-full" : "min-w-0 flex-1",
        variant === "primary"
          ? "bg-saffron text-white shadow-card hover:bg-saffron-deep"
          : "border border-line bg-card text-ink-soft hover:border-line-strong hover:text-ink",
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Clipboard fallback for browsers without the async clipboard API. */
function copyViaTextarea(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    if (!document.execCommand("copy")) throw new Error("copy command rejected");
  } finally {
    textarea.remove();
  }
}
