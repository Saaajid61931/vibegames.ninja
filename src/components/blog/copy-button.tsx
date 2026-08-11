"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  code: string;
}

export function CopyButton({ code }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 border-2 transition-all flex items-center justify-center cursor-pointer ${
        copied
          ? "border-arcade-green bg-arcade-green/10 text-arcade-green"
          : "border-border-strong bg-surface text-text-secondary hover:border-arcade-yellow hover:text-arcade-yellow"
      }`}
      title="Copy Code"
      aria-label={copied ? "Code copied" : "Copy code"}
      type="button"
      id="copy-code-btn"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}
