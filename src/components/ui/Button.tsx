import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary";
  icon?: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  icon,
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium",
        "transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" &&
          "bg-berry text-white shadow-sm hover:scale-95 hover:shadow-xl cursor-pointer",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
