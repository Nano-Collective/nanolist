// Shared constants and data readers for the post-build .mjs scripts.
// These run with plain `node` (no tsx), so listings and categories are read
// as raw JSON here. Validation happens elsewhere (pnpm validate / next build);
// by the time these scripts run the data is known-good.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const SITE_URL = "https://list.nanocollective.org";

// Where the static export lives. Overridable so the generators can be tested
// against a stub export outside the repo.
export const DIST_DIR = resolve(process.cwd(), process.env.DIST_DIR ?? "dist");

/** All listings from data/listings/*.json, sorted by filename. */
export function readListings() {
  const dir = join(process.cwd(), "data", "listings");
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(readFileSync(join(dir, file), "utf-8")));
}

/** All categories from data/taxonomy.json, in file order. */
export function readCategories() {
  return JSON.parse(
    readFileSync(join(process.cwd(), "data", "taxonomy.json"), "utf-8"),
  ).categories;
}
