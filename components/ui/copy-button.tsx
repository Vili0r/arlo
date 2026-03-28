"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: number;
}

export function CopyButton({ value, className, size = 13 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {copied && (
        <div className="absolute bottom-full mb-1.5 px-2 py-1 bg-[#111] border border-white/10 rounded text-[10px] font-medium text-white shadow-2xl pointer-events-none animate-in fade-in zoom-in slide-in-from-bottom-1 duration-200">
          Copied!
        </div>
      )}
      <button
        onClick={handleCopy}
        className={cn(
          "p-1 transition-all duration-200 focus:outline-none",
          copied ? "text-emerald-400 scale-110" : "text-[#444] hover:text-white",
          className
        )}
      >
        {copied ? <Check size={size} /> : <Copy size={size} />}
      </button>
    </div>
  );
}
