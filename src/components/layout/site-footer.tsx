"use client";

import Image from "next/image";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/copy";
import { IS_DEMO_CONTENT } from "@/data/articles";
import { Rule } from "@/components/ui/primitives";

export function SiteFooter({ bottomInset }: { bottomInset: boolean }) {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-line bg-paper-2/60 px-4 pt-8 sm:px-6",
        // Clears the sticky share bar so the last line is never hidden.
        bottomInset
          ? "pb-[calc(var(--safe-bottom)+9.5rem)]"
          : "pb-[calc(var(--safe-bottom)+2rem)]",
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <p className="font-display text-lg text-ink">{t.footerHeading}</p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-mute">
              {t.footerNote}
            </p>
          </div>

          <div className="shrink-0">
            <p className="text-[0.75rem] text-ink-faint">
              {t.footerSource}
            </p>
            <Image
              src="/brand/mahasamvad-logo.png"
              alt={t.sourceLogoAlt}
              width={292}
              height={100}
              className="mt-2 h-9 w-auto opacity-85"
            />
          </div>
        </div>

        {IS_DEMO_CONTENT && (
          <>
            <Rule className="my-6" />
            <p className="text-[0.75rem] leading-relaxed text-ink-faint">
              {t.demoNotice}
            </p>
          </>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
              })
            }
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-card px-4 text-[0.8125rem] font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            <ArrowUp className="size-4" strokeWidth={2} aria-hidden="true" />
            {t.backToTop}
          </button>
        </div>
      </div>
    </footer>
  );
}
