"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import {
  useEscapeKey,
  useFocusTrap,
  useIsClient,
  useScrollLock,
} from "@/lib/hooks";

/**
 * The single dialog surface used by the article view, the filter drawer and
 * the share preview.
 *
 * `sheet` slides up from the bottom edge and is the right shape for thumbs;
 * `dialog` centres a proportioned editorial panel on wide screens. Callers
 * usually pass `sheet` on phones and `dialog` from `md` up.
 */
export type OverlayVariant = "sheet" | "dialog";

export type OverlayProps = {
  open: boolean;
  onClose: () => void;
  variant: OverlayVariant;
  /** Accessible name. Use `labelledBy` instead when a visible title exists. */
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  /** Clicking the backdrop closes. Off for surfaces holding unsaved input. */
  dismissOnOverlayClick?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Overlay({
  open,
  onClose,
  variant,
  label,
  labelledBy,
  describedBy,
  dismissOnOverlayClick = true,
  className,
  children,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Tracks where the press started, so a drag that ends on the backdrop after
  // starting inside the panel (text selection) does not dismiss it.
  const pressStartedOnBackdrop = useRef(false);
  const reduceMotion = useReducedMotion();
  const isClient = useIsClient();

  useScrollLock(open);
  useFocusTrap(panelRef, open);
  useEscapeKey(open, onClose);

  if (!isClient) return null;

  const isSheet = variant === "sheet";

  const panelMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : isSheet
      ? {
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%" },
          transition: { type: "spring" as const, stiffness: 420, damping: 42 },
        }
      : {
          initial: { opacity: 0, y: 14, scale: 0.985 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 8, scale: 0.99 },
          transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
        };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex",
            isSheet ? "items-end" : "items-center justify-center p-4 sm:p-6",
          )}
          onPointerDown={(event) => {
            pressStartedOnBackdrop.current = event.target === event.currentTarget;
          }}
          onClick={(event) => {
            if (
              dismissOnOverlayClick &&
              event.target === event.currentTarget &&
              pressStartedOnBackdrop.current
            ) {
              onClose();
            }
          }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.24 }}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={labelledBy ? undefined : label}
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            tabIndex={-1}
            className={cn(
              "relative flex w-full flex-col overflow-hidden bg-paper shadow-overlay outline-none",
              isSheet
                ? "max-h-[92dvh] rounded-t-3xl"
                : "max-h-[88dvh] max-w-2xl rounded-2xl border border-line",
              className,
            )}
            {...panelMotion}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * The grab handle at the top of a sheet. Decorative — the sheet is dismissed
 * with the close button, Escape, the backdrop or the browser's back gesture.
 */
export function SheetHandle() {
  return (
    <div className="flex shrink-0 justify-center pb-1 pt-2.5" aria-hidden="true">
      <span className="h-1 w-10 rounded-full bg-line-strong" />
    </div>
  );
}

/** Stable ids for wiring `aria-labelledby` / `aria-describedby`. */
export function useDialogIds(): { titleId: string; descriptionId: string } {
  const base = useId();
  return { titleId: `${base}-title`, descriptionId: `${base}-desc` };
}
