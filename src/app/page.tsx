import { Suspense } from "react";
import { articles } from "@/data/articles";
import { GlanceApp } from "@/components/glance-app";
import { FeedSkeleton } from "@/components/layout/feed-skeleton";

/**
 * The whole product is one route. Content is loaded here on the server and
 * handed to the client shell, which owns search, filters and the dialog.
 *
 * The Suspense boundary is required: `GlanceApp` reads `useSearchParams()`,
 * which cannot resolve during prerendering.
 */
export default function HomePage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <GlanceApp articles={articles} />
    </Suspense>
  );
}
