// Post-build script that writes RSS/Atom feeds into the static export:
//
//   - feed.xml / atom.xml: the 50 most recently added listings.
//   - recommended.xml: the 50 most recently recommended listings.
//
// Descriptions are the listings' plain-text descriptions; the feed library
// handles all XML escaping.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Feed } from "feed";
import { DIST_DIR, readCategories, readListings, SITE_URL } from "./site.mjs";

const SITE_TITLE = "Nanolist";
const SITE_DESCRIPTION =
  "A curated list of AI tools from the Nano Collective community, highlighting open-source, local-first, and privacy-respecting software.";

const MAX_ITEMS = 50;

function createFeed({ title, description, path }) {
  return new Feed({
    title,
    description,
    id: SITE_URL,
    link: SITE_URL,
    language: "en",
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Nano Collective`,
    feedLinks: {
      rss2: `${SITE_URL}/${path}`,
      atom: `${SITE_URL}/atom.xml`,
    },
    author: {
      name: "Nano Collective",
      link: SITE_URL,
    },
  });
}

// The feed library emits Atom category names as XML attributes, which its
// serializer (xml-js) does not escape. Atom feeds therefore get their
// category names pre-escaped via a separate Feed instance; RSS renders
// categories as text nodes, which xml-js escapes itself.
function escapeXmlAttribute(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function addListing(feed, listing, categoryNames, date, mapName) {
  const url = `${SITE_URL}/listing/${listing.slug}`;

  feed.addItem({
    title: listing.name,
    id: url,
    link: url,
    description: listing.description,
    author: [{ name: listing.author }],
    date,
    category: listing.categories.map((key) => ({
      name: mapName(categoryNames.get(key) ?? key),
    })),
  });
}

function generateFeeds() {
  console.log("Generating RSS/Atom feeds...");

  const listings = readListings();
  const categoryNames = new Map(
    readCategories().map((category) => [category.key, category.name]),
  );

  // Latest listings, newest first
  const latest = [...listings]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, MAX_ITEMS);

  const feed = createFeed({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: "feed.xml",
  });
  const atomFeed = createFeed({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: "feed.xml",
  });
  for (const listing of latest) {
    const date = new Date(listing.addedAt);
    addListing(feed, listing, categoryNames, date, (name) => name);
    addListing(atomFeed, listing, categoryNames, date, escapeXmlAttribute);
  }

  // Recommended listings, most recently recommended first
  const recommended = listings
    .filter((listing) => listing.recommendedAt !== null)
    .sort((a, b) => b.recommendedAt.localeCompare(a.recommendedAt))
    .slice(0, MAX_ITEMS);

  const recommendedFeed = createFeed({
    title: `${SITE_TITLE} — Recommended`,
    description:
      "Tools recommended by the Nano Collective community, most recently recommended first.",
    path: "recommended.xml",
  });
  for (const listing of recommended) {
    addListing(
      recommendedFeed,
      listing,
      categoryNames,
      new Date(listing.recommendedAt),
      (name) => name,
    );
  }

  mkdirSync(DIST_DIR, { recursive: true });

  writeFileSync(join(DIST_DIR, "feed.xml"), feed.rss2());
  console.log(`Generated: feed.xml (${latest.length} listings)`);

  writeFileSync(join(DIST_DIR, "atom.xml"), atomFeed.atom1());
  console.log(`Generated: atom.xml (${latest.length} listings)`);

  writeFileSync(join(DIST_DIR, "recommended.xml"), recommendedFeed.rss2());
  console.log(`Generated: recommended.xml (${recommended.length} listings)`);
}

try {
  generateFeeds();
} catch (error) {
  console.error("Error generating feeds:", error);
  process.exit(1);
}
