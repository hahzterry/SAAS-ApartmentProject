import { clsx } from "clsx";
import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, ...props }, ref) => (
    <div>
      <textarea
        ref={ref}
        className={clsx(
          "w-full rounded-xl border bg-white/70 backdrop-blur-md px-4 py-3 text-slate-900",
          "placeholder:text-slate-400 shadow-sm transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-berry/50",
          error ? "border-red-400" : "border-white/20",
          className,
        )}
        {...props}
      />
      {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
    </div>
  ),
);
TextArea.displayName = "TextArea";
