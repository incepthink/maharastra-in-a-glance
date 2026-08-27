"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SearchX, Newspaper } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { t } from "@/lib/copy";
import { applyFilters, buildFacets, countActiveFilters, sortArticles } from "@/lib/filters";
import { createSearchIndex, searchArticles } from "@/lib/search";
import { toSearchString, readViewState, type ViewState } from "@/lib/url-state";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleDialog } from "@/components/articles/article-dialog";
import { FeaturedArticle } from "@/components/articles/featured-article";
import { ActiveFilterChips, FilterBar } from "@/components/filters/filter-bar";
import { FilterSheet } from "@/components/filters/filter-sheet";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SearchField } from "@/components/search/search-field";
import { ShareBar } from "@/components/share/share-bar";
import { SharePreview } from "@/components/share/share-preview";
import { Button } from "@/components/ui/button";
import { EmptyState, Eyebrow } from "@/components/ui/primitives";
import { ToastProvider } from "@/components/ui/toast";
import { EMPTY_FILTERS, type Article, type FilterState, type MultiFilterKey, type SortOrder } from "@/types/article";

/**
 * The application shell.
 *
 * Search, filters, sorting and the open article all live in the URL; share
 * selection lives in React state, because a selection is a working set rather
 * than a view worth linking to.
 */
export function GlanceApp({ articles }: { articles: Article[] }) {
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const view = useMemo(
    () => readViewState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  /* -- URL writes ------------------------------------------------------- */

  /** True once this session has pushed a history entry for an open article. */
  const pushedArticleEntry = useRef(false);

  const replaceView = useCallback((next: ViewState) => {
    window.history.replaceState(null, "", toSearchString(next) || location.pathname);
  }, []);

  const setQuery = useCallback(
    (query: string) => replaceView({ ...view, query, articleSlug: null }),
    [replaceView, view],
  );

  const setFilters = useCallback(
    (filters: FilterState) => replaceView({ ...view, filters }),
    [replaceView, view],
  );

  const setSort = useCallback(
    (sort: SortOrder) => replaceView({ ...view, sort }),
    [replaceView, view],
  );

  const resetView = useCallback(() => {
    replaceView({ query: "", filters: EMPTY_FILTERS, sort: view.sort, articleSlug: null });
  }, [replaceView, view.sort]);

  /**
   * Opening pushes a history entry so the browser's back gesture closes the
   * dialog — the gesture a phone user reaches for before any close button.
   */
  const openArticle = useCallback(
    (article: Article) => {
      window.history.pushState(
        null,
        "",
        toSearchString({ ...view, articleSlug: article.slug }),
      );
      pushedArticleEntry.current = true;
    },
    [view],
  );

  const closeArticle = useCallback(() => {
    if (pushedArticleEntry.current) {
      pushedArticleEntry.current = false;
      // Unwinds our own entry, keeping forward/back symmetrical.
      window.history.back();
    } else {
      // Deep link: there is no entry of ours to pop, so rewrite in place.
      replaceView({ ...view, articleSlug: null });
    }
  }, [replaceView, view]);

  /* -- Derived data ------------------------------------------------------ */

  const index = useMemo(() => createSearchIndex(articles), [articles]);
  const facets = useMemo(() => buildFacets(articles), [articles]);

  const hits = useMemo(
    () => searchArticles(index, view.query),
    [index, view.query],
  );

  const results = useMemo(() => {
    const matched = applyFilters(
      hits.map((hit) => hit.article),
      view.filters,
    );

    // A query implies relevance order; without one, the chosen date order wins.
    return view.query.trim() ? matched : sortArticles(matched, view.sort);
  }, [hits, view.filters, view.query, view.sort]);

  const counts = useMemo(
    () => buildFacetCounts(articles, facets),
    [articles, facets],
  );

  const activeFilterCount = countActiveFilters(view.filters);
  const isNarrowed = activeFilterCount > 0 || view.query.trim().length > 0;

  /**
   * The lead story only takes the stage on an untouched feed. Once someone is
   * searching or filtering, every result deserves the same weight.
   */
  const featured = !isNarrowed
    ? results.find((article) => article.featured) ?? null
    : null;
  const feed = featured
    ? results.filter((article) => article.id !== featured.id)
    : results;

  const openArticleData = useMemo(
    () => articles.find((article) => article.slug === view.articleSlug) ?? null,
    [articles, view.articleSlug],
  );

  /* -- Local UI state ---------------------------------------------------- */

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shareMode, setShareMode] = useState(false);
  const [sharePreviewOpen, setSharePreviewOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedArticles = useMemo(
    // Ordered by the article list, not by tap order, so the share message
    // always reads in a predictable sequence.
    () => articles.filter((article) => selectedSet.has(article.id)),
    [articles, selectedSet],
  );

  const toggleSelect = useCallback((article: Article) => {
    setSelectedIds((current) =>
      current.includes(article.id)
        ? current.filter((id) => id !== article.id)
        : [...current, article.id],
    );
  }, []);

  const visibleIds = useMemo(() => results.map((a) => a.id), [results]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));

  function exitShareMode() {
    setShareMode(false);
    setSharePreviewOpen(false);
    setSelectedIds([]);
  }

  /* -- Render ------------------------------------------------------------ */

  return (
    <ToastProvider>
      <SiteHeader
        shareMode={shareMode}
        onToggleShareMode={() => {
          if (shareMode) exitShareMode();
          else setShareMode(true);
        }}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <div className="space-y-3">
          <SearchField value={view.query} onChange={setQuery} />

          <FilterBar
            filters={view.filters}
            onFiltersChange={setFilters}
            sort={view.sort}
            onSortChange={setSort}
            facets={facets}
            districtCounts={counts.districts}
            activeCount={activeFilterCount}
            onOpenFilters={() => setFiltersOpen(true)}
          />

          <ActiveFilterChips
            filters={view.filters}
            onFiltersChange={setFilters}
            onClearAll={() => setFilters(EMPTY_FILTERS)}
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Eyebrow className="min-w-0 truncate">
            {view.query.trim()
              ? t.searchResults
              : activeFilterCount > 0
                ? t.filteredResults
                : t.latest}
          </Eyebrow>
          <p
            className="shrink-0 text-[0.8125rem] text-ink-mute tabular-nums"
            aria-live="polite"
          >
            {isNarrowed
              ? t.showingOf(results.length, articles.length)
              : t.totalCount(articles.length)}
          </p>
        </div>

        <div className="mt-3">
          {results.length === 0 ? (
            <EmptyState
              icon={view.query.trim() ? SearchX : Newspaper}
              title={
                articles.length === 0 ? t.noArticlesTitle : t.noResultsTitle
              }
              description={
                articles.length === 0
                  ? t.noArticlesDescription
                  : view.query.trim()
                    ? t.noResultsForQuery(view.query.trim())
                    : t.noResultsFiltered
              }
              action={
                isNarrowed ? (
                  <Button variant="primary" onClick={resetView}>
                    {t.resetEverything}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {featured && !shareMode && (
                <FeaturedArticle
                  article={featured}
                  query={view.query}
                  onOpen={openArticle}
                />
              )}

              <motion.div
                layout={!reduceMotion}
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {(featured && !shareMode ? feed : results).map(
                    (article, position) => (
                      <motion.div
                        key={article.id}
                        layout={!reduceMotion}
                        initial={
                          reduceMotion ? false : { opacity: 0, y: 12, scale: 0.99 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={
                          reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 0.98 }
                        }
                        transition={{
                          duration: 0.28,
                          ease: [0.22, 1, 0.36, 1],
                          // A short stagger for the first row only; a long one
                          // makes filtering feel sluggish.
                          delay: reduceMotion ? 0 : Math.min(position, 3) * 0.035,
                        }}
                      >
                        <ArticleCard
                          article={article}
                          query={view.query}
                          onOpen={openArticle}
                          shareMode={shareMode}
                          selected={selectedSet.has(article.id)}
                          onToggleSelect={toggleSelect}
                          priority={position === 0 && !featured}
                        />
                      </motion.div>
                    ),
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter bottomInset={shareMode} />

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={view.filters}
        onFiltersChange={setFilters}
        sort={view.sort}
        onSortChange={setSort}
        facets={facets}
        counts={counts}
        resultCount={results.length}
      />

      <ArticleDialog article={openArticleData} onClose={closeArticle} />

      <ShareBar
        open={shareMode}
        selectedCount={selectedIds.length}
        visibleCount={results.length}
        allVisibleSelected={allVisibleSelected}
        onSelectAllVisible={() =>
          setSelectedIds((current) => [...new Set([...current, ...visibleIds])])
        }
        onClearSelection={() => setSelectedIds([])}
        onExit={exitShareMode}
        onPreview={() => setSharePreviewOpen(true)}
      />

      <SharePreview
        open={sharePreviewOpen && selectedArticles.length > 0}
        onClose={() => setSharePreviewOpen(false)}
        articles={selectedArticles}
      />
    </ToastProvider>
  );
}

/* ------------------------------------------------------------------ helpers */

/** Article counts per facet value, shown next to each filter chip. */
function buildFacetCounts(
  articles: Article[],
  facets: { districts: string[]; categories: string[]; sources: string[]; tags: string[] },
): Record<MultiFilterKey, Record<string, number>> {
  const counts: Record<MultiFilterKey, Record<string, number>> = {
    districts: {},
    categories: {},
    sources: {},
    tags: {},
  };

  for (const value of facets.districts) counts.districts[value] = 0;
  for (const value of facets.categories) counts.categories[value] = 0;
  for (const value of facets.sources) counts.sources[value] = 0;
  for (const value of facets.tags) counts.tags[value] = 0;

  for (const article of articles) {
    counts.districts[article.district] += 1;
    counts.categories[article.category] += 1;
    counts.sources[article.source] += 1;
    for (const tag of article.tags) counts.tags[tag] += 1;
  }

  return counts;
}
