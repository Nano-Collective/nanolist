// Post-build script that writes sitemap.xml into the static export: the home
// page, /submit, every category page, and every listing page. Listing lastmod
// comes from the listing's addedAt date; category lastmod from the newest
// listing in that category.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DIST_DIR, readCategories, readListings, SITE_URL } from "./site.mjs";

// Static pages (explicit list - no Next.js internal routes)
const STATIC_PAGES = [
  { loc: "", priority: "1.0", changefreq: "daily" },
  { loc: "submit", priority: "0.6", changefreq: "monthly" },
];

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function url(loc, lastmod, changefreq, priority) {
  return `<url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>\n`;
}

function generateSitemap(listings, categories) {
  const today = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Static pages
  for (const page of STATIC_PAGES) {
    const loc = page.loc ? `${SITE_URL}/${page.loc}` : SITE_URL;
    xml += url(loc, today, page.changefreq, page.priority);
  }

  // Category pages, freshest listing in the category as lastmod
  for (const category of categories) {
    const lastAdded = listings
      .filter((listing) => listing.categories.includes(category.key))
      .map((listing) => listing.addedAt)
      .sort()
      .at(-1);
    xml += url(
      `${SITE_URL}/category/${category.key}`,
      lastAdded ?? today,
      "weekly",
      "0.8",
    );
  }

  // Listing pages
  for (const listing of listings) {
    xml += url(
      `${SITE_URL}/listing/${listing.slug}`,
      listing.addedAt,
      "weekly",
      "0.7",
    );
  }

  xml += "</urlset>";
  return xml;
}

function generateSitemapFile() {
  console.log("Generating sitemap.xml...");

  const listings = readListings();
  const categories = readCategories();

  mkdirSync(DIST_DIR, { recursive: true });
  writeFileSync(
    join(DIST_DIR, "sitemap.xml"),
    generateSitemap(listings, categories),
    "utf-8",
  );
  console.log(
    `Generated: sitemap.xml (${STATIC_PAGES.length + categories.length + listings.length} urls)`,
  );
}

try {
  generateSitemapFile();
} catch (error) {
  console.error("Error generating sitemap:", error);
  process.exit(1);
}
