import { Fragment, useMemo } from "react";
import { splitByHighlights } from "@/lib/search";

/**
 * Renders `text` with every occurrence of the active query marked.
 *
 * The original Marathi string is only ever sliced, never rewritten, so
 * conjuncts and matras stay intact.
 */
export function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const parts = useMemo(() => splitByHighlights(text, query), [text, query]);

  if (parts.length === 1 && !parts[0].hit) return <>{text}</>;

  return (
    <>
      {parts.map((part, index) =>
        part.hit ? (
          <mark key={index} className="mark-hit">
            {part.text}
          </mark>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}
