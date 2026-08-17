import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function GlassCard({ className, hoverable, ...props }: GlassCardProps) {
  return (
    <div
      className={clsx(
        "bg-white/70 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm",
        hoverable && "transition-all duration-200 hover:shadow-xl",
        className,
      )}
      {...props}
    />
  );
}
