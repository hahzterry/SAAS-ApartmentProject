"use client";

import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

export function DownloadButton({ text, filename = "property-script.txt" }: { text: string; filename?: string }) {
  function handleDownload() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button onClick={handleDownload} icon={<Download className="h-4 w-4" />}>
      Download .txt
    </Button>
  );
}
