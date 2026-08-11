// CLI: fetches favicons for listings that have no icon yet, or for one
// listing with `--slug <slug>`. Run with: pnpm fetch-icons [--slug <slug>]
//
// For each listing it tries DuckDuckGo's icon service first, then the site's
// own /favicon.ico. Icons come from arbitrary third-party domains, so the
// response is treated as hostile: 5s timeout, hard 100 KB cap while
// streaming, and the body is accepted only when its magic bytes match a known
// raster format (png/ico/jpeg/gif/webp) — never svg/xml/html, whatever the
// content-type header claims. Successful fetches land in public/icons/ and
// the listing JSON's `icon` field is updated; failures leave the icon null
// (the UI falls back to a letter tile) and never fail the run.
import fs from "node:fs";
import path from "node:path";
import { getAllListings } from "@/lib/listings";
import type { Listing } from "@/lib/schema";

const FETCH_TIMEOUT_MS = 5_000;
const MAX_ICON_BYTES = 100 * 1024;

const ICONS_DIR = path.join(process.cwd(), "public", "icons");
const LISTINGS_DIR = path.join(process.cwd(), "data", "listings");

type IconExt = "png" | "ico" | "jpg" | "gif" | "webp";
const ICON_EXTS: IconExt[] = ["png", "ico", "jpg", "gif", "webp"];

/** The format an icon body claims to be, by magic bytes alone. */
function sniffIconExt(body: Buffer): IconExt | null {
  if (body.length < 12) return null;
  // \x89PNG
  if (
    body[0] === 0x89 &&
    body[1] === 0x50 &&
    body[2] === 0x4e &&
    body[3] === 0x47
  ) {
    return "png";
  }
  // ICO: \x00\x00\x01\x00
  if (
    body[0] === 0x00 &&
    body[1] === 0x00 &&
    body[2] === 0x01 &&
    body[3] === 0x00
  ) {
    return "ico";
  }
  // JPEG: \xFF\xD8\xFF
  if (body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) {
    return "jpg";
  }
  // GIF87a / GIF89a
  if (body.subarray(0, 4).toString("latin1") === "GIF8") {
    return "gif";
  }
  // WEBP: RIFF....WEBP
  if (
    body.subarray(0, 4).toString("latin1") === "RIFF" &&
    body.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

/**
 * Fetch a URL with a hard timeout and a hard byte cap, aborting the transfer
 * the moment the body exceeds the cap. Throws on any failure.
 */
async function fetchCapped(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    if (!response.body) {
      throw new Error("empty response body");
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_ICON_BYTES) {
        await reader.cancel();
        throw new Error(`body exceeds ${MAX_ICON_BYTES} bytes`);
      }
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timeout);
  }
}

/** The listing's hostname with any leading "www." stripped. */
function iconHostname(listing: Listing): string {
  return new URL(listing.url).hostname.replace(/^www\./, "");
}

type FetchResult = {
  slug: string;
  source: string;
  outcome: string;
  ok: boolean;
};

/**
 * Fetch one listing's icon (DuckDuckGo first, site favicon as fallback),
 * write it to public/icons/, and point the listing JSON's `icon` at it.
 */
async function fetchIcon(listing: Listing): Promise<FetchResult> {
  const hostname = iconHostname(listing);
  const sources = [
    {
      name: "duckduckgo",
      url: `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
    },
    { name: "favicon", url: `https://${hostname}/favicon.ico` },
  ];

  const failures: string[] = [];
  for (const source of sources) {
    let body: Buffer;
    try {
      body = await fetchCapped(source.url);
    } catch (error) {
      failures.push(
        `${source.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    const ext = sniffIconExt(body);
    if (!ext) {
      failures.push(`${source.name}: unrecognised image format`);
      continue;
    }

    writeIcon(listing.slug, ext, body);
    updateListingIcon(listing.slug, `/icons/${listing.slug}.${ext}`);
    return { slug: listing.slug, source: source.name, outcome: ext, ok: true };
  }

  console.warn(`Warning: ${listing.slug}: ${failures.join("; ")}`);
  return {
    slug: listing.slug,
    source: "-",
    outcome: failures.join("; "),
    ok: false,
  };
}

/** Write the icon file, dropping any stale copy with a different extension. */
function writeIcon(slug: string, ext: IconExt, body: Buffer): void {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  for (const staleExt of ICON_EXTS) {
    if (staleExt === ext) continue;
    fs.rmSync(path.join(ICONS_DIR, `${slug}.${staleExt}`), { force: true });
  }
  fs.writeFileSync(path.join(ICONS_DIR, `${slug}.${ext}`), body);
}

/** Rewrite the listing JSON's `icon` field (2-space indent, trailing \n). */
function updateListingIcon(slug: string, icon: string): void {
  const file = path.join(LISTINGS_DIR, `${slug}.json`);
  const listing = JSON.parse(fs.readFileSync(file, "utf8"));
  listing.icon = icon;
  fs.writeFileSync(file, `${JSON.stringify(listing, null, 2)}\n`);
}

function printSummary(results: FetchResult[]): void {
  const width = Math.max(...results.map((result) => result.slug.length), 7);
  console.log(`\n${"listing".padEnd(width)}  ${"source".padEnd(10)}  result`);
  for (const result of results) {
    const status = result.ok ? `✓ ${result.outcome}` : `✗ ${result.outcome}`;
    console.log(
      `${result.slug.padEnd(width)}  ${result.source.padEnd(10)}  ${status}`,
    );
  }
  const fetched = results.filter((result) => result.ok).length;
  console.log(`\n${fetched}/${results.length} icons fetched`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const slugFlag = args.indexOf("--slug");
  const slug = slugFlag === -1 ? null : args[slugFlag + 1];
  if (slugFlag !== -1 && !slug) {
    console.error("Usage: fetch-icons.ts [--slug <slug>]");
    process.exit(1);
  }

  const listings = getAllListings();
  const targets = slug
    ? listings.filter((listing) => listing.slug === slug)
    : listings.filter((listing) => listing.icon === null);

  if (slug && targets.length === 0) {
    console.error(`No listing with slug "${slug}"`);
    process.exit(1);
  }
  if (targets.length === 0) {
    console.log("All listings already have icons");
    return;
  }

  const results: FetchResult[] = [];
  for (const listing of targets) {
    results.push(await fetchIcon(listing));
  }

  printSummary(results);
}

main().catch((error) => {
  console.error("Error fetching icons:", error);
  process.exit(1);
});
