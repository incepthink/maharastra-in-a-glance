"use client";

import Image from "next/image";
import { CheckCheck, Share2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/copy";

/**
 * A compact masthead. It stays put while scrolling because the share-mode
 * toggle has to remain reachable, but it stays short so the feed keeps the
 * screen.
 */
export function SiteHeader({
  shareMode,
  onToggleShareMode,
}: {
  shareMode: boolean;
  onToggleShareMode: () => void;
}) {
  const Icon = shareMode ? CheckCheck : Share2;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/88 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-[var(--safe-top)] sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 py-2.5">
          <Image
            src="/brand/maharashtra-seal.png"
            alt={t.emblemAlt}
            width={256}
            height={256}
            priority
            className="size-9 shrink-0 object-contain sm:size-10"
          />

          <div className="min-w-0">
            <h1 className="truncate font-display text-[1.0625rem] leading-tight text-ink sm:text-xl">
              {t.siteName}
            </h1>
            <p className="truncate text-[0.6875rem] text-ink-mute sm:text-xs">
              {t.siteTagline}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleShareMode}
          aria-pressed={shareMode}
          // The visible label shortens on narrow screens; the accessible name
          // must not change with the viewport.
          aria-label={shareMode ? t.exitShareMode : t.enterShareMode}
          title={shareMode ? t.exitShareMode : t.enterShareMode}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3",
            "text-[0.8125rem] font-medium transition-all duration-150 active:scale-[0.97]",
            shareMode
              ? "border-saffron-line bg-saffron-tint text-saffron-deep"
              : "border-line bg-card text-ink-soft hover:border-line-strong hover:text-ink",
          )}
        >
          <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
          <span className="xs:hidden">{t.shareShort}</span>
          <span className="hidden xs:inline">{t.shareMode}</span>
        </button>
      </div>

      {/* A thin saffron rule reading as an underline for the masthead. */}
      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-saffron/0 via-saffron/45 to-saffron/0"
      />
    </header>
  );
}
