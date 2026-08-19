import { ArrowLeft } from "lucide-react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ListingGrid } from "@/components/ListingGrid";
import Navbar from "@/components/Navbar";
import {
  getAllCategories,
  getAllListings,
  getCategoryCounts,
} from "@/lib/listings";
import type { Category, Listing } from "@/lib/schema";

interface CategoryPageProps {
  category: Category;
  listings: Listing[];
  /** Maps category keys to display names, for the listing cards. */
  categoryNames: Record<string, string>;
  categoryCounts: Record<string, number>;
}

export default function CategoryPage({
  category,
  listings,
  categoryNames,
  categoryCounts,
}: CategoryPageProps) {
  const title = `${category.name} — Nanolist`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={category.description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={category.description} />
      </Head>
      <div className="min-h-screen bg-background font-sans">
        <Navbar categoryCounts={categoryCounts} />
        <main className="container mx-auto px-4 md:px-6 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Full directory
          </Link>

          <header className="mt-8 mb-8 border-b border-foreground/20 pb-8">
            <div className="flex items-center gap-2 text-xs font-semibold font-mono text-muted-foreground uppercase tracking-widest">
              <span className="text-[#0000EE] dark:text-[#A1A1AA] font-bold">
                &gt;
              </span>
              {category.group}
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {category.name}
            </h1>
            <p className="mt-3 max-w-[600px] text-sm sm:text-lg text-foreground/70 leading-relaxed">
              {category.description}
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {listings.length} {listings.length === 1 ? "tool" : "tools"}
            </p>
          </header>

          <ListingGrid listings={listings} categoryNames={categoryNames} />
        </main>
        <Footer />
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const categories = getAllCategories();
  return {
    paths: categories.map((category) => ({ params: { slug: category.key } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<CategoryPageProps> = async ({
  params,
}) => {
  const slug = params?.slug;
  const categories = getAllCategories();
  const category = categories.find((item) => item.key === slug);
  if (!category) {
    return { notFound: true };
  }
  const listings = getAllListings().filter(
    (listing) =>
      listing.status === "active" && listing.categories.includes(category.key),
  );
  const categoryNames = Object.fromEntries(
    categories.map((item) => [item.key, item.name]),
  );
  return {
    props: {
      category,
      listings,
      categoryNames,
      categoryCounts: getCategoryCounts(),
    },
  };
};
