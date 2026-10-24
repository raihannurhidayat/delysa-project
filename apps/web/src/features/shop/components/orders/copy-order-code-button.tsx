"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "~/components/ui/button";
import { copyText } from "~/features/shop/lib/clipboard";

export function CopyOrderCodeButton({
  code,
  className,
  label = "Salin kode pesanan",
}: {
  code: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyText(code, "Kode pesanan");
    if (!success) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`${label} ${code}`}
      onClick={() => void handleCopy()}
      className={className}
    >
      {copied ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Copy size={14} aria-hidden="true" />
      )}
    </Button>
  );
}
