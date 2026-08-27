import { t } from "@/lib/copy";
import { ArticleCardSkeleton, Skeleton } from "@/components/ui/primitives";

/**
 * The prerendered frame.
 *
 * It mirrors the real layout's spacing so the swap to the live feed does not
 * shift anything, and it carries the masthead so the site is identifiable
 * before hydration.
 */
export function FeedSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="border-b border-line bg-paper/88">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-2.5 pt-[calc(var(--safe-top)+0.625rem)] sm:px-6">
          <Skeleton className="size-9 shrink-0 rounded-full sm:size-10" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-2.5 w-32" />
          </div>
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      <main
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6"
        aria-busy="true"
      >
        <p className="sr-only">{t.loading}</p>

        <Skeleton className="h-28 rounded-2xl" />

        <div className="mt-5 space-y-3">
          <Skeleton className="h-12 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-24 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
            <Skeleton className="h-11 flex-1 rounded-xl" />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      </main>
    </div>
  );
}
