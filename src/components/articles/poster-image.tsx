"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Article } from "@/types/article";

/**
 * Poster artwork with a designed fallback.
 *
 * A missing or failing poster must never leave a grey box: the fallback below
 * composes the same editorial motif from the article's own metadata, so the
 * card still reads as finished.
 */

/** Deterministic hue per article, so a given article always looks the same. */
const PALETTES = [
  { ink: "#8A3F0C", wash: "#FBEEE2", line: "#E3BE99" },
  { ink: "#144A2F", wash: "#E8F3EC", line: "#A9CBB8" },
  { ink: "#6E561A", wash: "#F7F0DD", line: "#D6C288" },
  { ink: "#5E3151", wash: "#F5ECF3", line: "#C9A9C0" },
  { ink: "#1A4A5E", wash: "#E9F1F5", line: "#A3C3D2" },
  { ink: "#7A2323", wash: "#FBECEA", line: "#DBA9A4" },
] as const;

function paletteFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length];
}

/**
 * Ray geometry for the fallback artwork.
 *
 * Computed once at module scope and rounded: `Math.cos` is not required to be
 * bit-identical across implementations, so leaving full precision in the
 * markup produces a server/client hydration mismatch.
 */
const RAYS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2;
  const outer = i % 3 === 0 ? 96 : 78;
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    x1: round(100 + Math.cos(angle) * 52),
    y1: round(100 + Math.sin(angle) * 52),
    x2: round(100 + Math.cos(angle) * outer),
    y2: round(100 + Math.sin(angle) * outer),
  };
});

export type PosterImageProps = {
  article: Article;
  /** Passed straight to `next/image` — get this right or mobile over-fetches. */
  sizes: string;
  className?: string;
  priority?: boolean;
  /** `contain` is used in the lightbox so no part of the poster is cropped. */
  fit?: "cover" | "contain";
};

export function PosterImage({
  article,
  sizes,
  className,
  priority = false,
  fit = "cover",
}: PosterImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lastUrl, setLastUrl] = useState(article.posterImageUrl);

  // A data change (the dialog moving to a different article) must reset both
  // flags, otherwise a previous failure would stick to the new poster.
  if (lastUrl !== article.posterImageUrl) {
    setLastUrl(article.posterImageUrl);
    setFailed(false);
    setLoaded(false);
  }

  const showFallback = !article.posterImageUrl || failed;

  if (showFallback) {
    return <PosterFallback article={article} className={className} />;
  }

  return (
    <div className={cn("relative overflow-hidden bg-paper-2", className)}>
      {/* Holds the space and the warm tone until the poster paints. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-paper-2 transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100",
        )}
      />
      <Image
        src={article.posterImageUrl as string}
        alt={`${article.title} — पोस्टर`}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "transition-opacity duration-500 ease-editorial",
          fit === "cover" ? "object-cover object-top" : "object-contain",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

/**
 * The generated stand-in. Pure CSS/SVG so it costs nothing and never fails.
 */
export function PosterFallback({
  article,
  className,
}: {
  article: Article;
  className?: string;
}) {
  const palette = paletteFor(article.id);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ backgroundColor: palette.wash }}
      role="img"
      aria-label={`${article.title} — पोस्टर उपलब्ध नाही`}
    >
      {/* Ray motif echoing the state seal, cropped by the frame. */}
      <svg
        aria-hidden="true"
        className="absolute -right-[18%] top-1/2 h-[150%] -translate-y-1/2 opacity-70"
        viewBox="0 0 200 200"
        fill="none"
      >
        {RAYS.map((ray, i) => (
          <line
            key={i}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke={palette.line}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        ))}
        <circle
          cx={100}
          cy={100}
          r={50}
          fill="none"
          stroke={palette.line}
          strokeWidth={1.8}
        />
        <circle
          cx={100}
          cy={100}
          r={41}
          fill="none"
          stroke={palette.line}
          strokeWidth={1}
        />
      </svg>

      <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
        <div>
          <span
            className="text-[0.75rem] font-semibold"
            style={{ color: palette.ink }}
          >
            {article.category}
          </span>
          <span
            className="mt-1.5 block h-[3px] w-9 rounded-full"
            style={{ backgroundColor: palette.ink, opacity: 0.55 }}
          />
        </div>

        <p
          className="font-display text-[1.0625rem] leading-snug sm:text-lg"
          style={{ color: palette.ink }}
        >
          {article.district}
        </p>
      </div>
    </div>
  );
}
