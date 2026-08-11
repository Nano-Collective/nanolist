import { cn } from "@/lib/utils";

// Deterministic tile palette: solid, high-contrast squares in the site's
// terminal-inspired accent range. Index is derived from a slug hash so a
// listing always renders the same tile — no external requests ever.
const TILE_COLORS = [
  "bg-[#0000EE] text-white",
  "bg-[#005A9C] text-white",
  "bg-emerald-700 text-white",
  "bg-amber-600 text-white",
  "bg-rose-700 text-white",
  "bg-violet-700 text-white",
  "bg-teal-700 text-white",
  "bg-zinc-700 text-white",
] as const;

function hashSlug(slug: string): number {
  // djb2 — stable across server and client renders.
  let hash = 5381;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 33 + slug.charCodeAt(i)) >>> 0;
  }
  return hash;
}

interface ListingIconProps {
  name: string;
  slug: string;
  icon: string | null;
  className?: string;
}

export function ListingIcon({ name, slug, icon, className }: ListingIconProps) {
  if (icon) {
    return (
      <img
        src={icon}
        alt=""
        aria-hidden="true"
        width={40}
        height={40}
        className={cn(
          "h-10 w-10 shrink-0 border border-foreground/20 bg-background object-contain",
          className,
        )}
      />
    );
  }

  const color = TILE_COLORS[hashSlug(slug) % TILE_COLORS.length];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 shrink-0 select-none items-center justify-center font-mono text-lg font-bold",
        color,
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
