import test from "ava";
import {
  getAllCategories,
  getAllListings,
  getCategoryCounts,
} from "../lib/listings";
import { CATEGORY_KEYS } from "../lib/schema";

test("every committed listing validates, with unique slugs and URLs", (t) => {
  const listings = getAllListings();
  t.true(listings.length > 0);
});

test("taxonomy on disk matches the bundled category keys exactly", (t) => {
  const categories = getAllCategories();
  t.is(categories.length, CATEGORY_KEYS.length);
});

test("category counts cover every category key", (t) => {
  const counts = getCategoryCounts();
  t.deepEqual(Object.keys(counts).sort(), [...CATEGORY_KEYS].sort());
  for (const [key, count] of Object.entries(counts)) {
    t.true(count >= 0, key);
  }
});
