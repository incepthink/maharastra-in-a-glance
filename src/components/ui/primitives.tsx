import { cn } from "@/lib/cn";

/** Small uppercase eyebrow used above section headings. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block text-[0.75rem] font-semibold leading-normal text-ink-mute",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A hairline that fades at both ends, separating editorial blocks. */
export function Rule({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("rule-fade", className)} />;
}

type BadgeTone = "saffron" | "gold" | "neutral";

const BADGE_TONES: Record<BadgeTone, string> = {
  saffron: "border-saffron-line bg-saffron-tint text-saffron-deep",
  gold: "border-gold/30 bg-gold-tint text-gold",
  neutral: "border-line bg-paper-2 text-ink-soft",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-[0.1875rem] text-[0.6875rem] font-semibold leading-tight",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Shimmerless skeleton block — a calm pulse suits the paper aesthetic. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-paper-3/70", className)}
    />
  );
}

/** The card skeleton shown while the client feed hydrates. */
export function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <Skeleton className="aspect-[3/2] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-card/60 px-6 py-14 text-center">
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full border border-line bg-paper-2 text-ink-faint">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-ink-mute">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
