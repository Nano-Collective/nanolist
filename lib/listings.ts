// Node-only helpers for reading listing/category data from disk.
// Use from getStaticProps / getStaticPaths and build scripts only.
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  CATEGORY_KEYS,
  type Category,
  categorySchema,
  type Listing,
  listingSchema,
} from "@/lib/schema";

const LISTINGS_DIR = path.join(process.cwd(), "data", "listings");
const TAXONOMY_FILE = path.join(process.cwd(), "data", "taxonomy.json");

/**
 * Reads and validates every listing in data/listings/*.json, sorted by
 * filename. Throws a single error listing every per-file failure. Asserts
 * that each slug matches its filename and that slugs and URLs are unique.
 */
export function getAllListings(): Listing[] {
  const files = fs
    .readdirSync(LISTINGS_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const listings: Listing[] = [];
  const errors: string[] = [];
  const seenSlugs = new Map<string, string>();
  const seenUrls = new Map<string, string>();

  for (const file of files) {
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(LISTINGS_DIR, file), "utf8"));
    } catch (error) {
      errors.push(
        `${file}: invalid JSON (${error instanceof Error ? error.message : String(error)})`,
      );
      continue;
    }

    const result = listingSchema.safeParse(raw);
    if (!result.success) {
      errors.push(`${file}: ${z.prettifyError(result.error)}`);
      continue;
    }

    const listing = result.data;
    const expectedSlug = file.replace(/\.json$/, "");
    if (listing.slug !== expectedSlug) {
      errors.push(
        `${file}: slug "${listing.slug}" does not match filename "${expectedSlug}"`,
      );
      continue;
    }

    const slugOwner = seenSlugs.get(listing.slug);
    if (slugOwner) {
      errors.push(
        `${file}: duplicate slug "${listing.slug}" (also in ${slugOwner})`,
      );
      continue;
    }
    const urlOwner = seenUrls.get(listing.url);
    if (urlOwner) {
      errors.push(
        `${file}: duplicate url "${listing.url}" (also in ${urlOwner})`,
      );
      continue;
    }

    seenSlugs.set(listing.slug, file);
    seenUrls.set(listing.url, file);
    listings.push(listing);
  }

  if (errors.length > 0) {
    throw new Error(`Invalid listings:\n${errors.join("\n")}`);
  }

  return listings;
}

/**
 * Reads and validates the categories in data/taxonomy.json. Asserts the
 * on-disk category keys cover CATEGORY_KEYS (the bundled copy of the same
 * file) exactly — no missing, duplicate, or unknown keys — which guards
 * against a stale build running against edited data.
 */
export function getAllCategories(): Category[] {
  const raw: unknown = JSON.parse(fs.readFileSync(TAXONOMY_FILE, "utf8"));
  const result = z
    .object({ categories: z.array(categorySchema).min(1) })
    .safeParse(raw);
  if (!result.success) {
    throw new Error(`taxonomy.json: ${z.prettifyError(result.error)}`);
  }

  const categories = result.data.categories;
  const keys = categories.map((category) => category.key);
  const keySet = new Set(keys);
  if (keySet.size !== keys.length) {
    throw new Error("taxonomy.json: duplicate category keys found");
  }
  const missing = CATEGORY_KEYS.filter((key) => !keySet.has(key));
  if (missing.length > 0) {
    throw new Error(`taxonomy.json: missing categories: ${missing.join(", ")}`);
  }
  if (keys.length !== CATEGORY_KEYS.length) {
    throw new Error("taxonomy.json: contains keys outside CATEGORY_KEYS");
  }

  return categories;
}
