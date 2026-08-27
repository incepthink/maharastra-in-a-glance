"use client";

import { Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/copy";

/**
 * The search input.
 *
 * The field keeps its own draft so typing is never gated on the router, and
 * commits on every keystroke — with a handful of articles the filtering cost
 * is nil, and skipping the debounce removes the race where a late commit
 * overwrites characters typed in the meantime.
 *
 * The URL stays the source of truth: an externally driven change (browser
 * back, "reset everything") is adopted during render, the pattern React
 * documents for deriving state from props.
 */
export function SearchField({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);

  if (value !== syncedValue) {
    setSyncedValue(value);
    // Only an external change can differ from the draft; our own commits
    // arrive back already equal to it.
    if (value !== draft) setDraft(value);
  }

  function update(next: string) {
    setDraft(next);
    setSyncedValue(next);
    onChange(next);
  }

  function clear() {
    update("");
    inputRef.current?.focus();
  }

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-ink-faint"
        strokeWidth={2}
        aria-hidden="true"
      />

      <input
        ref={inputRef}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        // The browser's own suggestion UI fights the Marathi keyboard.
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={draft}
        onChange={(event) => update(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && draft) {
            event.preventDefault();
            // Clear the field before the key reaches any dialog handler.
            event.stopPropagation();
            clear();
          }
          if (event.key === "Enter") {
            event.preventDefault();
            // Nothing left to submit; just drop the on-screen keyboard.
            inputRef.current?.blur();
          }
        }}
        aria-label={t.searchLabel}
        aria-describedby="search-hint"
        placeholder={t.searchPlaceholder}
        className={cn(
          "h-12 w-full rounded-xl border border-line bg-card pl-11 pr-11",
          // 16px minimum, or iOS zooms the whole page on focus.
          "text-base text-ink placeholder:text-ink-faint",
          "shadow-hairline transition-[border-color,box-shadow] duration-200",
          "focus:border-saffron-line focus:outline-none focus:ring-4 focus:ring-saffron/10",
          // Safari draws its own clear button on type=search; ours is better.
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />

      <p id="search-hint" className="sr-only">
        {t.searchHint}
      </p>

      {draft.length > 0 && (
        <button
          type="button"
          onClick={clear}
          aria-label={t.clearSearch}
          title={t.clearSearch}
          className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-mute transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <X className="size-4.5" strokeWidth={2.25} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
