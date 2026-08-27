"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";

/**
 * Minimal toast queue for share / clipboard feedback.
 *
 * Announcements go through a polite live region so screen readers hear the
 * same confirmation sighted users see.
 */

type ToastTone = "success" | "error" | "info";

type Toast = { id: number; message: string; tone: ToastTone };

type ToastContextValue = {
  notify: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, string> = {
  success: "border-success/25 bg-success-tint text-success",
  error: "border-danger/25 bg-danger-tint text-danger",
  info: "border-line-strong bg-card text-ink",
};

const TONE_ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
} as const;

const VISIBLE_MS = 4200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const reduceMotion = useReducedMotion();

  const notify = useCallback((message: string, tone: ToastTone = "info") => {
    const id = nextId.current++;
    // Keep at most two on screen; older ones drop off the top.
    setToasts((current) => [...current.slice(-1), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, VISIBLE_MS);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(var(--safe-bottom)+1rem)]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = TONE_ICONS[toast.tone];
            return (
              <motion.div
                key={toast.id}
                layout={!reduceMotion}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.24 }}
                className={cn(
                  "pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lift",
                  TONE_STYLES[toast.tone],
                )}
              >
                <Icon
                  className="mt-0.5 size-[1.05rem] shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <p className="text-[0.875rem] leading-snug">{toast.message}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}
