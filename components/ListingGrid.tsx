import { ListingCard } from "@/components/ListingCard";
import type { Listing } from "@/lib/schema";

interface ListingGridProps {
  listings: Listing[];
  /** Maps category keys to display names. */
  categoryNames: Record<string, string>;
}

export function ListingGrid({ listings, categoryNames }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="border border-dashed border-foreground/20 px-6 py-16 text-center">
        <p className="font-mono text-sm text-muted-foreground">
          [ no tools match your filters ]
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard
          key={listing.slug}
          listing={listing}
          categoryNames={categoryNames}
        />
      ))}
    </div>
  );
}
