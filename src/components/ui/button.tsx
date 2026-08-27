"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "quiet";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-saffron text-white shadow-card hover:bg-saffron-deep active:bg-saffron-deep",
  secondary:
    "bg-card text-ink border border-line hover:border-line-strong hover:bg-paper-2 active:bg-paper-3",
  ghost:
    "bg-transparent text-ink-soft hover:bg-paper-2 hover:text-ink active:bg-paper-3",
  quiet:
    "bg-paper-2 text-ink-soft border border-transparent hover:bg-paper-3 hover:text-ink",
};

/**
 * Heights are chosen so every control clears the 44px touch target on phones;
 * `sm` is only used inside rails where the parent adds its own padding.
 */
const SIZES: Record<Size, string> = {
  sm: "h-9 gap-1.5 rounded-full px-3 text-[0.8125rem]",
  md: "h-11 gap-2 rounded-xl px-4 text-[0.9375rem]",
  lg: "h-12 gap-2 rounded-xl px-5 text-base",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Stretch to the container width — the default for stacked mobile actions. */
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "secondary", size = "md", block, className, type, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(
          "inline-flex select-none items-center justify-center font-medium leading-tight",
          "transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-editorial",
          "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45",
          VARIANTS[variant],
          SIZES[size],
          block && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required: icon-only controls must still announce themselves. */
  label: string;
  variant?: Variant;
  size?: "md" | "lg";
};

/**
 * A square icon-only control. `label` becomes both the accessible name and the
 * native tooltip, so nothing here is a mystery glyph.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, variant = "ghost", size = "md", className, type, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl",
          "transition-[background-color,border-color,color,transform] duration-150 ease-editorial",
          "active:scale-95 disabled:pointer-events-none disabled:opacity-45",
          VARIANTS[variant],
          size === "lg" ? "size-12" : "size-11",
          className,
        )}
        {...props}
      />
    );
  },
);
