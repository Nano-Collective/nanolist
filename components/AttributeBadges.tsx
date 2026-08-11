import type { Listing } from "@/lib/schema";
import { cn } from "@/lib/utils";

export const ATTRIBUTE_LABELS = [
  ["openSource", "Open source"],
  ["localFirst", "Local-first"],
  ["privacyFirst", "Privacy-first"],
  ["selfHostable", "Self-hostable"],
] as const;

export type AttributeKey = (typeof ATTRIBUTE_LABELS)[number][0];

interface AttributeBadgesProps {
  attributes: Listing["attributes"];
  className?: string;
}

export function AttributeBadges({
  attributes,
  className,
}: AttributeBadgesProps) {
  const active = ATTRIBUTE_LABELS.filter(([key]) => attributes[key]);
  if (active.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {active.map(([key, label]) => (
        <li
          key={key}
          className="border border-foreground/20 bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground/70"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
