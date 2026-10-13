type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  linkText?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  linkText,
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-rose-600">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-0.5 rounded bg-rose-600"
          />
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-[#1A1A1A] sm:text-2xl">
          {title}
        </h2>
      </div>
      {linkText ? (
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          aria-label={`${linkText} (segera hadir)`}
          className="shrink-0 text-xs font-medium text-[#6B7280] hover:text-[#111111]"
        >
          {linkText}
        </a>
      ) : null}
    </div>
  );
}
