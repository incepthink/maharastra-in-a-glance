"use client";

import { CheckCheck, Send, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/copy";

/**
 * The sticky action bar shown while share mode is active.
 *
 * It owns the bottom of the screen on purpose: selection is a modal task, and
 * the count plus the primary action must stay under the thumb at all times.
 */
export function ShareBar({
  open,
  selectedCount,
  visibleCount,
  allVisibleSelected,
  onSelectAllVisible,
  onClearSelection,
  onExit,
  onPreview,
}: {
  open: boolean;
  selectedCount: number;
  visibleCount: number;
  allVisibleSelected: boolean;
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  onExit: () => void;
  onPreview: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
          animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 420, damping: 40 }
          }
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 shadow-bar backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 pb-[calc(var(--safe-bottom)+0.75rem)] pt-3 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[0.9375rem] font-semibold text-ink"
                  aria-live="polite"
                >
                  {selectedCount > 0
                    ? t.selectedCount(selectedCount)
                    : t.shareModeHint}
                </p>
              </div>

              <button
                type="button"
                onClick={onExit}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-medium text-ink-mute transition-colors hover:bg-paper-2 hover:text-ink"
              >
                <X className="size-4" strokeWidth={2} aria-hidden="true" />
                {t.exitShareMode}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={allVisibleSelected ? onClearSelection : onSelectAllVisible}
                disabled={visibleCount === 0 && selectedCount === 0}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-card px-3.5",
                  "text-[0.8125rem] font-medium text-ink-soft transition-colors",
                  "hover:border-line-strong hover:text-ink disabled:opacity-40",
                )}
              >
                <CheckCheck className="size-4" strokeWidth={2} aria-hidden="true" />
                {allVisibleSelected ? t.clearSelection : t.selectAllVisible}
              </button>

              <button
                type="button"
                onClick={onPreview}
                disabled={selectedCount === 0}
                aria-haspopup="dialog"
                className={cn(
                  "inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4",
                  "text-[0.9375rem] font-semibold text-white shadow-card transition-all",
                  "bg-saffron hover:bg-saffron-deep active:scale-[0.985]",
                  "disabled:pointer-events-none disabled:bg-line-strong disabled:text-white/80 disabled:shadow-none",
                )}
              >
                <Send className="size-4" strokeWidth={2} aria-hidden="true" />
                {t.share}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
