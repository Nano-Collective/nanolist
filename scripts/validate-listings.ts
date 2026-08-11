// CLI: validates data/categories.json and every file in data/listings/.
// Run with: pnpm validate
import { getAllCategories, getAllListings } from "@/lib/listings";

function main(): void {
  let failed = false;

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
