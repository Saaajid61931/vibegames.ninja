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
          ? "border-[#00ff40] bg-[#00ff40]/10 text-[#00ff40]"
          : "border-[#4a4a6a] bg-[#11111d] text-[#8b93a6] hover:border-[#ffff00] hover:text-[#ffff00]"
      }`}
      title="Copy Code"
      type="button"
      id="copy-code-btn"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}
