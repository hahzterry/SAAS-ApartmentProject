"use client";

import { Button } from "@/components/ui/Button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      onClick={handleCopy}
      icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
