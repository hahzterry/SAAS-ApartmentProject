import { Loader2 } from "lucide-react";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-berry" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
