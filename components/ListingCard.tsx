import Link from "next/link";
import { AttributeBadges } from "@/components/AttributeBadges";
import { ListingIcon } from "@/components/ListingIcon";
import { RecommendedBadge } from "@/components/RecommendedBadge";
import type { Listing } from "@/lib/schema";

interface ListingCardProps {
  listing: Listing;
  /** Maps category keys to display names. */
  categoryNames: Record<string, string>;
}

export function ListingCard({ listing, categoryNames }: ListingCardProps) {
  return (
    <Link
      href={`/listing/${listing.slug}`}
      className="group flex h-full flex-col border border-foreground/20 bg-background p-5 transition-all hover:-translate-y-1 hover:bg-muted hover:shadow-[4px_4px_0px_0px_rgba(0,0,238,1)] dark:hover:shadow-[4px_4px_0px_0px_#A1A1AA] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ListingIcon
            name={listing.name}
            slug={listing.slug}
            icon={listing.icon}
          />
          <div className="min-w-0">
            <h3 className="truncate font-bold tracking-tight text-foreground">
              {listing.name}
            </h3>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {listing.author}
            </p>
          </div>
        </div>
        {listing.recommendedAt && <RecommendedBadge className="shrink-0" />}
      </div>

      <p className="mt-3 line-clamp-1 text-sm leading-relaxed text-foreground/70">
        {listing.description}
      </p>

      <AttributeBadges attributes={listing.attributes} className="mt-4" />

      <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-4">
        {listing.categories.map((key) => (
          <span
            key={key}
            className="font-mono text-[11px] font-bold text-[#0000EE] dark:text-[#A1A1AA]"
          >
            [ {categoryNames[key] ?? key} ]
          </span>
        ))}
      </div>
    </Link>
  );
}
