import { Archive, ArrowLeft, ExternalLink, Github } from "lucide-react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { AttributeBadges } from "@/components/AttributeBadges";
import { Footer } from "@/components/Footer";
import { ListingIcon } from "@/components/ListingIcon";
import Navbar from "@/components/Navbar";
import { RecommendedBadge } from "@/components/RecommendedBadge";
import { getAllCategories, getAllListings } from "@/lib/listings";
import type { Category, Listing } from "@/lib/schema";

interface ListingPageProps {
  listing: Listing;
  categories: Category[];
}

const PRICING_LABELS: Record<Listing["pricing"], string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
  "open-source": "Open source",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Formats an ISO date (YYYY-MM-DD) deterministically, avoiding locale drift. */
function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const monthName = MONTHS[(month ?? 1) - 1] ?? "";
  return `${monthName} ${day}, ${year}`;
}

export default function ListingPage({ listing, categories }: ListingPageProps) {
  const title = `${listing.name} — Nanolist`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={listing.description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={listing.description} />
      </Head>
      <div className="min-h-screen bg-background font-sans">
        <Navbar />
        <main className="container mx-auto max-w-3xl px-4 md:px-6 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to directory
          </Link>

          {listing.status === "archived" && (
            <div className="mt-6 flex items-center gap-3 border border-foreground/20 bg-muted px-4 py-3">
              <Archive
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="font-mono text-sm text-muted-foreground">
                Archived — this listing is no longer actively maintained in the
                directory.
              </p>
            </div>
          )}

          {/* Header */}
          <header className="mt-8 border-b border-foreground/20 pb-8">
            <div className="flex items-start gap-4">
              <ListingIcon
                name={listing.name}
                slug={listing.slug}
                icon={listing.icon}
                className="h-16 w-16 text-3xl"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                    {listing.name}
                  </h1>
                  {listing.recommendedAt && <RecommendedBadge />}
                </div>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  by {listing.author}
                </p>
              </div>
            </div>

            <AttributeBadges attributes={listing.attributes} className="mt-5" />

            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm">
              <div className="flex gap-2">
                <dt className="uppercase tracking-wide text-muted-foreground">
                  Pricing:
                </dt>
                <dd className="font-bold text-foreground">
                  {PRICING_LABELS[listing.pricing]}
                </dd>
              </div>
              {listing.license && (
                <div className="flex gap-2">
                  <dt className="uppercase tracking-wide text-muted-foreground">
                    License:
                  </dt>
                  <dd className="font-bold text-foreground">
                    {listing.license}
                  </dd>
                </div>
              )}
            </dl>
          </header>

          {/* Description */}
          <p className="mt-8 text-base sm:text-lg leading-relaxed text-foreground/80">
            {listing.description}
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-none bg-[#0000EE] dark:bg-foreground px-8 text-sm font-semibold tracking-wide text-white dark:text-background transition-colors hover:bg-[#0000EE]/90 dark:hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Visit site
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            {listing.github && (
              <a
                href={listing.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-3 border border-foreground/20 bg-background px-8 text-sm font-semibold tracking-wide text-foreground transition-colors hover:border-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                View on GitHub
              </a>
            )}
          </div>

          {/* Categories */}
          <section className="mt-10">
            <h2 className="font-bold text-sm text-foreground mb-4 font-mono tracking-wide uppercase border-b border-foreground/20 pb-2 inline-block">
              Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.key}
                  href={`/category/${category.key}`}
                  className="border border-foreground/20 bg-background px-3 py-1.5 font-mono text-xs font-bold text-[#0000EE] dark:text-[#A1A1AA] transition-colors hover:border-foreground hover:bg-muted"
                >
                  [ {category.name} ]
                </Link>
              ))}
            </div>
          </section>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <section className="mt-8">
              <h2 className="font-bold text-sm text-foreground mb-4 font-mono tracking-wide uppercase border-b border-foreground/20 pb-2 inline-block">
                Tags
              </h2>
              <p className="font-mono text-sm text-muted-foreground">
                {listing.tags.map((tag) => `#${tag}`).join("  ")}
              </p>
            </section>
          )}

          {/* Meta footer */}
          <footer className="mt-12 border-t border-foreground/20 pt-6 font-mono text-xs text-muted-foreground">
            <p>
              Added {formatDate(listing.addedAt)}
              {listing.recommendedAt &&
                ` · Recommended ${formatDate(listing.recommendedAt)}`}
            </p>
            {listing.submittedBy && (
              <p className="mt-1">
                Suggested by{" "}
                <a
                  href={`https://github.com/${encodeURIComponent(listing.submittedBy)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  @{listing.submittedBy}
                </a>
              </p>
            )}
          </footer>
        </main>
        <Footer />
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Include archived listings so their URLs keep resolving.
  const listings = getAllListings();
  return {
    paths: listings.map((listing) => ({ params: { slug: listing.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<ListingPageProps> = async ({
  params,
}) => {
  const slug = params?.slug;
  const listing = getAllListings().find((item) => item.slug === slug);
  if (!listing) {
    return { notFound: true };
  }
  const categories = getAllCategories().filter((category) =>
    listing.categories.includes(category.key),
  );
  return { props: { listing, categories } };
};
