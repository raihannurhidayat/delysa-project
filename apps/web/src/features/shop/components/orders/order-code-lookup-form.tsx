"use client";

import { useId, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export function OrderCodeLookupForm({
  initialCode = "",
  onSubmit,
  className,
}: {
  initialCode?: string;
  onSubmit: (code: string) => void;
  className?: string;
}) {
  const inputId = useId();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError("Masukkan kode pesanan");
      return;
    }
    setError(null);
    onSubmit(normalized);
  };

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      <label htmlFor={inputId} className="sr-only">
        Kode pesanan
      </label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            if (error) setError(null);
          }}
          placeholder="DLF-20261024-8842"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="h-10 rounded-lg border-[#E5E7EB] bg-white font-mono text-sm"
        />
        <Button
          type="submit"
          className="h-10 shrink-0 rounded-lg bg-[#FF6B35] font-semibold text-[#21140D] hover:bg-[#F25C26]"
        >
          <Search size={15} aria-hidden="true" className="mr-1.5" />
          Lacak
        </Button>
      </div>
      {error ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-1.5 text-[11px] text-[#B91C1C]"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
