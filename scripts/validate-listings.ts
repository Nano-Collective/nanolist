// CLI: validates data/taxonomy.json and every file in data/listings/.
// Run with: pnpm validate
import fs from "node:fs";
import path from "node:path";
import { getAllCategories, getAllListings } from "@/lib/listings";

const TAXONOMY_FILE = path.join(process.cwd(), "data", "taxonomy.json");
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Validates the tag list in data/taxonomy.json: non-empty, kebab-case,
 * no duplicates. (Categories are validated by getAllCategories.)
 */
function validateTaxonomyTags(): void {
  const raw: unknown = JSON.parse(fs.readFileSync(TAXONOMY_FILE, "utf8"));
  const tags = (raw as { tags?: unknown }).tags;
  if (!Array.isArray(tags) || tags.length === 0) {
    throw new Error("taxonomy.json: tags must be a non-empty array");
  }
  const seen = new Set<string>();
  for (const tag of tags) {
    if (typeof tag !== "string" || !KEBAB_CASE.test(tag)) {
      throw new Error("taxonomy.json: tags must be kebab-case strings");
    }
    if (seen.has(tag)) {
      throw new Error(`taxonomy.json: duplicate tag "${tag}"`);
    }
    seen.add(tag);
  }
}

function main(): void {
  let failed = false;

  try {
    validateTaxonomyTags();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    failed = true;
  }

  try {
    getAllCategories();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    failed = true;
  }

  let count = 0;
  try {
    count = getAllListings().length;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }

  console.log(`✓ ${count} listings valid`);
}

main();
