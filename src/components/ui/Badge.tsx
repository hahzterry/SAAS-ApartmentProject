import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full bg-sky px-3 py-1 text-xs font-medium text-slate-900",
        className,
      )}
      {...props}
    />
  );
}
