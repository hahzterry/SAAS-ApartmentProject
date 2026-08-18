import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function GlassCard({ className, hoverable, children, ...props }: GlassCardProps) {
  return (
    <div className={clsx("group relative rounded-2xl", className)} {...props}>
      {/*
        The blurred background lives on a decorative sibling layer, not on this
        element directly. backdrop-filter turns its element into a containing
        block for position:fixed descendants (same as transform/filter) — if it
        sat on this wrapper, Google's PlaceAutocompleteElement dropdown (which
        renders as position:fixed) would get trapped inside the card instead of
        floating above the rest of the page.
      */}
      <div
        aria-hidden
        className={clsx(
          "absolute inset-0 -z-10 rounded-2xl border border-white/20 bg-white/70 backdrop-blur-md shadow-sm",
          hoverable && "transition-all duration-200 group-hover:shadow-xl",
        )}
      />
      {children}
    </div>
  );
}
