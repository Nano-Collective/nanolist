/**
 * Post-build script that emits LLM-friendly content alongside the static
 * export, following https://llmstxt.org/ — the same convention the
 * organisation site uses (see ../../organisation/scripts/generate-llms.mjs).
 *
 *   1. For every page, write a raw Markdown mirror at the page's URL plus
 *      `.md` (e.g. /listing/ollama -> /listing/ollama.md). Mirrors are
 *      produced by extracting the built page's main content and converting it
 *      to Markdown.
 *   2. Emit /listings.json: the full listings dataset as one JSON array, for
 *      agents and API-style consumers.
 *   3. Emit /llms.txt at the site root: a single index of every page with a
 *      title, short description, and a link to its raw Markdown.
 *
 * Runs after `next build` (see the build script in package.json) and writes
 * into the static `dist/` export directory.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import TurndownService from "turndown";
import { DIST_DIR, readCategories, readListings, SITE_URL } from "./site.mjs";

const SUMMARY =
  "Nanolist is the Nano Collective's curated directory of AI tools, highlighting open-source, local-first, and privacy-respecting software. Every listing records the tool's categories, licensing, pricing, and privacy attributes.";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});
// Decorative/interactive-only elements carry no meaning in Markdown.
turndown.remove(["script", "style", "svg", "noscript"]);
// Icon-only links (their SVG stripped) would render as empty `[](url)` noise.
turndown.addRule("stripEmptyLinks", {
  filter: (node) => node.nodeName === "A" && !node.textContent.trim(),
  replacement: () => "",
});

/**
 * Isolate a page's readable content: prefer <main>, otherwise fall back to
 * <body> with the shared header and footer stripped out.
 */
function extractContentHtml(html) {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  let region = main
    ? main[1]
    : (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html);

  region = region
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  return region;
}

/** Convert a built HTML page into a Markdown document. */
function htmlPageToMarkdown(page, html) {
  const markdown = turndown
    .turndown(extractContentHtml(html))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return `# ${page.title}\n\n${markdown}\n`;
}

/**
 * Write `<route>.md` into the export for a page and return an index entry
 * pointing at it, or null when the built HTML is missing (so a partial
 * export degrades to a shorter index instead of a failed build).
 */
function writePageMirror(page) {
  const htmlPath = join(DIST_DIR, page.file);
  if (!existsSync(htmlPath)) {
    console.warn(`Skipping ${page.route}: ${page.file} not found in export`);
    return null;
  }

  const relative = page.route === "/" ? "index" : page.route.replace(/^\//, "");
  const outPath = join(DIST_DIR, `${relative}.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    htmlPageToMarkdown(page, readFileSync(htmlPath, "utf-8")),
  );
  return {
    route: `/${relative}.md`,
    title: page.title,
    description: page.description,
  };
}

function line(entry) {
  const desc = entry.description ? `: ${entry.description}` : "";
  return `- [${entry.title}](${SITE_URL}${entry.route})${desc}`;
}

function generateLlmsTxt(pageEntries, categoryEntries, listingEntries, count) {
  const lines = [];

  lines.push("# Nanolist");
  lines.push("");
  lines.push(`> ${SUMMARY}`);
  lines.push("");
  lines.push(
    "This file indexes the Nanolist website. Every link points to the page's raw Markdown so it can be fetched and parsed directly without HTML rendering.",
  );
  lines.push("");

  lines.push("## Data");
  lines.push("");
  lines.push(
    `- [Full dataset (JSON)](${SITE_URL}/listings.json): All ${count} listings as a single JSON array — name, description, url, categories, tags, attributes, pricing, license, and dates for each tool.`,
  );
  lines.push("");

  lines.push("## Pages");
  lines.push("");
  for (const entry of pageEntries) lines.push(line(entry));
  lines.push("");

  if (categoryEntries.length > 0) {
    lines.push("## Categories");
    lines.push("");
    for (const entry of categoryEntries) lines.push(line(entry));
    lines.push("");
  }

  if (listingEntries.length > 0) {
    lines.push("## Listings");
    lines.push("");
    for (const entry of listingEntries) lines.push(line(entry));
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  console.log("Generating Markdown mirrors, listings.json, and llms.txt...");

  const listings = readListings();
  const categories = readCategories();

  const pages = [
    {
      route: "/",
      file: "index.html",
      title: "Nanolist",
      description: SUMMARY,
    },
    {
      route: "/submit",
      file: "submit.html",
      title: "Submit a tool",
      description: "How to submit a new tool to Nanolist.",
    },
  ];

  const categoryPages = categories.map((category) => ({
    route: `/category/${category.key}`,
    file: `category/${category.key}.html`,
    title: category.name,
    description: category.description,
  }));

  const listingPages = listings.map((listing) => ({
    route: `/listing/${listing.slug}`,
    file: `listing/${listing.slug}.html`,
    title: listing.name,
    description: listing.description,
  }));

  const pageEntries = pages.map(writePageMirror).filter(Boolean);
  const categoryEntries = categoryPages.map(writePageMirror).filter(Boolean);
  const listingEntries = listingPages.map(writePageMirror).filter(Boolean);
  console.log(
    `Wrote ${pageEntries.length + categoryEntries.length + listingEntries.length} page markdown mirrors`,
  );

  mkdirSync(DIST_DIR, { recursive: true });

  writeFileSync(
    join(DIST_DIR, "listings.json"),
    `${JSON.stringify(listings, null, 2)}\n`,
  );
  console.log(`Generated: listings.json (${listings.length} listings)`);

  writeFileSync(
    join(DIST_DIR, "llms.txt"),
    generateLlmsTxt(
      pageEntries,
      categoryEntries,
      listingEntries,
      listings.length,
    ),
  );
  console.log("Generated: llms.txt");
}

try {
  main();
} catch (error) {
  console.error("Error generating llms.txt:", error);
  process.exit(1);
}
