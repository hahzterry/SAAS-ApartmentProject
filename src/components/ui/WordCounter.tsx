import { clsx } from "clsx";

interface WordCounterProps {
  count: number;
  max: number;
}

export function WordCounter({ count, max }: WordCounterProps) {
  const overLimit = count > max;
  const nearLimit = count >= max * 0.9 && !overLimit;

  return (
    <span
      className={clsx(
        "text-sm font-medium transition-colors duration-200",
        overLimit && "text-red-500",
        nearLimit && "text-berry",
        !overLimit && !nearLimit && "text-slate-400",
      )}
    >
      {count} / {max} words
    </span>
  );
}
