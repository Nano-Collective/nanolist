import Fuse from "fuse.js";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { AttributeKey } from "@/components/AttributeBadges";
import { FilterBar, type SortKey } from "@/components/FilterBar";
import { Footer } from "@/components/Footer";
import { ListingGrid } from "@/components/ListingGrid";
import Navbar from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { getAllCategories, getAllListings } from "@/lib/listings";
import type { Category, CategoryKey, Listing } from "@/lib/schema";

interface HomeProps {
  listings: Listing[];
  categories: Category[];
}

const SORT_COMPARATORS: Record<SortKey, (a: Listing, b: Listing) => number> = {
  recommended: (a, b) => {
    if (a.recommendedAt && b.recommendedAt) {
      if (a.recommendedAt !== b.recommendedAt) {
        return b.recommendedAt.localeCompare(a.recommendedAt);
      }
    } else if (a.recommendedAt) {
      return -1;
    } else if (b.recommendedAt) {
      return 1;
    }
    if (a.addedAt !== b.addedAt) return b.addedAt.localeCompare(a.addedAt);
    return a.name.localeCompare(b.name);
  },
  newest: (a, b) => {
    if (a.addedAt !== b.addedAt) return b.addedAt.localeCompare(a.addedAt);
    return a.name.localeCompare(b.name);
  },
  az: (a, b) => a.name.localeCompare(b.name),
};

export default function Home({ listings, categories }: HomeProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [pricing, setPricing] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [attributes, setAttributes] = useState<Record<AttributeKey, boolean>>({
    openSource: false,
    localFirst: false,
    privacyFirst: false,
    selfHostable: false,
  });

  const fuse = useMemo(
    () =>
      new Fuse(listings, {
        keys: [
          { name: "name", weight: 10 },
          { name: "description", weight: 5 },
          { name: "tags", weight: 3 },
          { name: "author", weight: 2 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [listings],
  );

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((item) => [item.key, item.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    let result = trimmed
      ? fuse.search(trimmed).map((match) => match.item)
      : listings;

    if (category) {
      result = result.filter((listing) =>
        listing.categories.includes(category as CategoryKey),
      );
    }
    for (const [key, enabled] of Object.entries(attributes)) {
      if (enabled) {
        result = result.filter(
          (listing) => listing.attributes[key as AttributeKey],
        );
      }
    }
    if (pricing) {
      result = result.filter((listing) => listing.pricing === pricing);
    }

    return [...result].sort(SORT_COMPARATORS[sort]);
  }, [listings, fuse, query, category, attributes, pricing, sort]);

  const toggleAttribute = (key: AttributeKey) => {
    setAttributes((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  return (
    <>
      <Head>
        <title>Nanolist — AI tools that respect you</title>
        <meta
          name="description"
          content="A browsable, community-curated directory of AI tools — with a bias toward open-source, local-first, privacy-respecting software. By the Nano Collective."
        />
        <meta
          property="og:title"
          content="Nanolist — AI tools that respect you"
        />
        <meta
          property="og:description"
          content="A browsable, community-curated directory of AI tools — with a bias toward open-source, local-first, privacy-respecting software. By the Nano Collective."
        />
      </Head>
      <div className="min-h-screen bg-background font-sans">
        <Navbar />
        <main>
          {/* Hero */}
          <section className="container mx-auto px-4 md:px-6 pt-12 pb-10">
            <div className="flex items-center gap-2 text-xs font-semibold font-mono text-muted-foreground uppercase tracking-widest border-b border-foreground/20 pb-2 max-w-[280px]">
              <span className="text-[#0000EE] dark:text-[#A1A1AA] font-bold">
                &gt;
              </span>
              Community-curated directory
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-foreground max-w-[720px] leading-[1.05]">
              AI tools that{" "}
              <span
                className="font-serif font-medium text-[#0000EE] dark:text-[#A1A1AA] text-[1.1em]"
                style={{ fontFamily: '"Newsreader", Georgia, serif' }}
              >
                respect you
              </span>
            </h1>
            <p className="mt-4 max-w-[600px] text-sm sm:text-lg text-foreground/70 leading-relaxed">
              A browsable, community-curated directory of AI tools — biased
              toward open-source, local-first, privacy-respecting software. Know
              a tool that belongs here?{" "}
              <Link
                href="/submit"
                className="font-semibold text-[#0000EE] underline underline-offset-4 transition-colors hover:text-[#0000EE]/80 dark:text-[#A1A1AA] dark:hover:text-foreground"
              >
                Submit it
              </Link>
              .
            </p>
          </section>

          {/* Toolbar */}
          <div className="sticky top-14 z-30 border-y border-foreground/20 bg-background/95 backdrop-blur-md">
            <div className="container mx-auto flex flex-col gap-3 px-4 md:px-6 py-4">
              <SearchBar value={query} onChange={setQuery} />
              <FilterBar
                categories={categories}
                category={category}
                onCategoryChange={setCategory}
                attributes={attributes}
                onAttributeToggle={toggleAttribute}
                pricing={pricing}
                onPricingChange={setPricing}
                sort={sort}
                onSortChange={setSort}
              />
            </div>
          </div>

          {/* Results */}
          <section className="container mx-auto px-4 md:px-6 py-8">
            <p
              className="mb-4 font-mono text-xs uppercase tracking-wide text-muted-foreground"
              aria-live="polite"
            >
              {filtered.length} of {listings.length} tools
            </p>
            <ListingGrid listings={filtered} categoryNames={categoryNames} />
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const listings = getAllListings().filter(
    (listing) => listing.status === "active",
  );
  const categories = getAllCategories();
  return { props: { listings, categories } };
};
