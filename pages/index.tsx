import Fuse from "fuse.js";
import { SlidersHorizontal } from "lucide-react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import {
  ATTRIBUTE_LABELS,
  type AttributeKey,
} from "@/components/AttributeBadges";
import {
  FilterBar,
  PRICING_OPTIONS,
  SORT_OPTIONS,
  type SortKey,
} from "@/components/FilterBar";
import { Footer } from "@/components/Footer";
import { ListingGrid } from "@/components/ListingGrid";
import Navbar from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import {
  getAllCategories,
  getAllListings,
  getCategoryCounts,
} from "@/lib/listings";
import {
  CATEGORY_KEYS,
  type Category,
  type CategoryKey,
  type Listing,
} from "@/lib/schema";
import { cn } from "@/lib/utils";

interface HomeProps {
  listings: Listing[];
  categories: Category[];
  categoryCounts: Record<string, number>;
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

const ATTRIBUTE_KEYS = ATTRIBUTE_LABELS.map(([key]) => key);

/** A query param's value, ignoring repeated params. */
function firstParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default function Home({
  listings,
  categories,
  categoryCounts,
}: HomeProps) {
  const router = useRouter();
  // Mobile-only disclosure for the filter controls; on md+ they are always
  // visible inline in the toolbar.
  const [filtersOpen, setFiltersOpen] = useState(false);

  // All search/filter/sort state lives in the URL (`/?q=…&category=…&
  // pricing=…&attrs=…&sort=…`) so nav links and shared URLs reproduce the
  // exact view. Unrecognised values are ignored; defaults are omitted from
  // the URL. With `output: "export"` the query string is only available
  // client-side: it is empty on first render and populates once the router
  // hydrates, so a direct load briefly shows the unfiltered directory —
  // expected for SSG.
  const query = firstParam(router.query.q);

  const rawCategory = firstParam(router.query.category);
  const category = (CATEGORY_KEYS as readonly string[]).includes(rawCategory)
    ? rawCategory
    : "";

  const rawPricing = firstParam(router.query.pricing);
  const pricing = PRICING_OPTIONS.some((option) => option.value === rawPricing)
    ? rawPricing
    : "";

  const rawSort = firstParam(router.query.sort);
  const sort: SortKey = SORT_OPTIONS.some((option) => option.value === rawSort)
    ? (rawSort as SortKey)
    : "recommended";

  const attrsParam = firstParam(router.query.attrs);
  const attributes = useMemo(() => {
    const enabled = new Set(attrsParam.split(","));
    return Object.fromEntries(
      ATTRIBUTE_KEYS.map((key) => [key, enabled.has(key)]),
    ) as Record<AttributeKey, boolean>;
  }, [attrsParam]);

  /**
   * Merge updates into the current query string via a shallow route change
   * (no data fetching, SSG-safe). `null` removes a param. `replace` avoids
   * flooding the history — used for per-keystroke search updates.
   */
  const updateQuery = (
    updates: Record<string, string | null>,
    { replace = false } = {},
  ) => {
    const nextQuery = { ...router.query };
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) delete nextQuery[key];
      else nextQuery[key] = value;
    }
    const navigate = replace ? router.replace : router.push;
    navigate({ pathname: "/", query: nextQuery }, undefined, {
      shallow: true,
      scroll: false,
    });
  };

  const setQuery = (value: string) =>
    updateQuery({ q: value || null }, { replace: true });
  const setCategory = (value: string) =>
    updateQuery({ category: value || null });
  const setPricing = (value: string) => updateQuery({ pricing: value || null });
  const setSort = (value: SortKey) =>
    updateQuery({ sort: value === "recommended" ? null : value });

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
    const enabled = ATTRIBUTE_KEYS.filter((attribute) =>
      attribute === key ? !attributes[attribute] : attributes[attribute],
    );
    updateQuery({ attrs: enabled.length > 0 ? enabled.join(",") : null });
  };

  const activeFilterCount =
    (category ? 1 : 0) +
    (pricing ? 1 : 0) +
    ATTRIBUTE_KEYS.filter((key) => attributes[key]).length;

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
        <Navbar categoryCounts={categoryCounts} />
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

          {/* Toolbar: one row of search + filters; on mobile the filters
              collapse behind the Filters button to save vertical space. */}
          <div className="sticky top-14 z-30 border-y border-foreground/20 bg-background/95 backdrop-blur-md">
            <div className="container mx-auto flex flex-wrap items-center gap-2 px-4 py-2.5 md:px-6">
              <SearchBar
                value={query}
                onChange={setQuery}
                className="min-w-0 flex-1 basis-48"
              />
              <button
                type="button"
                aria-expanded={filtersOpen}
                aria-controls="filter-panel"
                aria-label={
                  activeFilterCount > 0
                    ? `Filters (${activeFilterCount} active)`
                    : "Filters"
                }
                onClick={() => setFiltersOpen((open) => !open)}
                className={cn(
                  "relative flex h-9 w-9 shrink-0 items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden",
                  filtersOpen || activeFilterCount > 0
                    ? "border-foreground text-foreground"
                    : "border-foreground/20 text-foreground/70 hover:border-foreground hover:text-foreground",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {activeFilterCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-[#0000EE] px-1 font-mono text-[10px] font-bold text-white dark:bg-[#A1A1AA] dark:text-black"
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <FilterBar
                id="filter-panel"
                className={filtersOpen ? "flex" : "hidden"}
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
  return {
    props: { listings, categories, categoryCounts: getCategoryCounts() },
  };
};
