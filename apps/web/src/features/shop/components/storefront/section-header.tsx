import { Link } from "@tanstack/react-router";

type SectionHeaderLink =
  | {
      to: "/katalog";
      search?: {
        category?: string;
        sort?: "termurah" | "termahal" | "terbaru";
      };
    }
  | { to: "/new-arrivals" | "/best-sellers" | "/categories" | "/promo" };

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  linkText?: string;
  link?: SectionHeaderLink;
  externalHref?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  linkText,
  link,
  externalHref,
}: SectionHeaderProps) {
  const linkClass =
    "shrink-0 text-xs font-semibold text-[#BE185D] underline-offset-4 hover:text-[#9D174D] hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]";

  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#BE185D]">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-0.5 rounded bg-[#BE185D]"
          />
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-[#1C1917] sm:text-2xl">
          {title}
        </h2>
      </div>
      {linkText && externalHref ? (
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {linkText}
        </a>
      ) : linkText && link ? (
        link.to === "/katalog" ? (
          <Link to="/katalog" search={link.search ?? {}} className={linkClass}>
            {linkText}
          </Link>
        ) : (
          <Link to={link.to} className={linkClass}>
            {linkText}
          </Link>
        )
      ) : null}
    </div>
  );
}
