"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

/* -------------------------------------------------------------------------
   Scroll lock
   ------------------------------------------------------------------------- */

/**
 * How many dialogs currently want the background frozen. Nested surfaces (an
 * article dialog with the poster lightbox above it) must not fight over it,
 * so only the first lock freezes and only the last release restores.
 */
let lockCount = 0;
let savedScrollY = 0;

function acquireScrollLock() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    // `position: fixed` rather than `overflow: hidden` — iOS Safari happily
    // scrolls the body behind an overlay otherwise.
    document.body.style.top = `${-savedScrollY}px`;
    document.body.dataset.scrollLocked = "true";
  }
  lockCount += 1;
}

function releaseScrollLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    delete document.body.dataset.scrollLocked;
    document.body.style.top = "";
    window.scrollTo({ top: savedScrollY, behavior: "auto" });
  }
}

/** Freeze background scrolling while `active` is true, restoring the position. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    acquireScrollLock();
    return releaseScrollLock;
  }, [active]);
}

/* -------------------------------------------------------------------------
   Focus management
   ------------------------------------------------------------------------- */

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) =>
      !element.hasAttribute("aria-hidden") &&
      element.offsetParent !== null &&
      // `inert` subtrees look focusable to querySelectorAll but are not.
      !element.closest("[inert]"),
  );
}

/**
 * Trap Tab inside `ref` while active, move focus in on open, and return it to
 * wherever it was when the surface closes.
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useEffect(() => {
    if (!active) return;

    const container = ref.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Let the open animation start before stealing focus, otherwise Safari
    // scrolls the not-yet-positioned dialog into view.
    const frame = requestAnimationFrame(() => {
      const [first] = focusableWithin(container);
      (first ?? container).focus({ preventScroll: true });
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !container) return;

      const items = focusableWithin(container);
      if (items.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [ref, active]);
}

/** Run `handler` when Escape is pressed, while `active`. */
export function useEscapeKey(active: boolean, handler: () => void): void {
  const saved = useRef(handler);

  // Written in an insertion effect so the ref is never touched during render,
  // while still being current before any layout effect or event fires.
  useEffect(() => {
    saved.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!active) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        saved.current();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);
}

/* -------------------------------------------------------------------------
   Environment queries
   ------------------------------------------------------------------------- */

/** `useSyncExternalStore` needs a stable subscribe; nothing ever changes here. */
const neverChanges = () => () => {};

/**
 * False while rendering on the server and during hydration, true afterwards.
 *
 * Used to gate portals and `window` reads without a state-setting effect, so
 * the markup React hydrates always matches what the server produced.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}

/**
 * Subscribe to a media query.
 *
 * Reports `false` on the server and for the hydrating render, then settles to
 * the real value — so layout that depends on it must degrade to the mobile
 * shape, which is the one this product is designed around anyway.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
