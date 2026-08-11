// CLI: converts a parsed GitHub issue-form submission into a listing object.
//
// Input (all via environment, no GitHub API calls — unit-testable offline):
//   PARSED_ISSUE  JSON string from stefanbuck/github-issue-parser
//                 (field ids -> string values)
//   SUBMITTED_BY  GitHub login of the submitter
//   TODAY         ISO date (YYYY-MM-DD) used for addedAt
//
// Behaviour: maps the form fields to a listing, validates it with the shared
// listingSchema, and cross-checks slug/url uniqueness against data/listings/.
// With --write it also writes data/listings/<slug>.json.
//
// Output: single-line JSON on stdout — {ok:true, slug, listing} on success,
// {ok:false, errors:[...]} and exit code 1 on failure.
//
// SECURITY: all submitter input is hostile. Error strings are constant
// messages plus field names only — raw input must NEVER be echoed back, as
// errors flow into workflow logs and issue comments.
import fs from "node:fs";
import path from "node:path";
import { getAllCategories, getAllListings } from "@/lib/listings";
import { type Listing, listingSchema } from "@/lib/schema";

const LISTINGS_DIR = path.join(process.cwd(), "data", "listings");

/** Placeholder values the issue parser emits for empty optional fields. */
const NO_RESPONSE = new Set(["_no response_", "none"]);

/** GitHub logins: 1-39 chars, alphanumeric or hyphen, no leading hyphen. */
const GITHUB_LOGIN = /^[a-z0-9][a-z0-9-]{0,38}$/i;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Checkbox labels from the issue form (normalized) -> attribute keys. */
const ATTRIBUTE_LABELS: Record<string, keyof Listing["attributes"]> = {
  "open source": "openSource",
  "local-first": "localFirst",
  "privacy-first": "privacyFirst",
  "self-hostable": "selfHostable",
};

/** Constant, human-readable hints per field. Never include submitted input. */
const FIELD_HINTS: Record<string, string> = {
  name: "must be 1-60 characters",
  slug: "the name must contain at least one letter or number",
  description:
    "must be 10-300 characters of plain text (no < or > characters, no javascript: links)",
  url: "must be a public https:// URL (no localhost or private IP ranges)",
  author: "must be 1-80 characters",
  categories: "choose between 1 and 3 of the listed categories",
  tags: "choose up to 8 tags from the accepted tag list",
  pricing: "must be one of: free, freemium, paid, open-source",
  license: "must be an SPDX identifier of at most 40 characters",
  github: "must be an https://github.com/... URL",
  submittedBy: "submitter login is missing or invalid",
  addedAt: "submission date is missing or invalid",
};

/** Trims a raw parser value and maps "no response" placeholders to "". */
function cleanValue(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return NO_RESPONSE.has(trimmed.toLowerCase()) ? "" : trimmed;
}

/**
 * Extracts checked labels from a checkbox field. github-issue-parser emits
 * multiline "- [x] Label" markdown; be robust to a plain comma list too.
 */
function parseCheckedLabels(value: string): string[] {
  if (!value) return [];
  if (/^\s*-\s*\[/m.test(value)) {
    const labels: string[] = [];
    for (const line of value.split("\n")) {
      const match = line.match(/^\s*-\s*\[\s*[xX]\s*\]\s*(.+?)\s*$/);
      if (match) labels.push(match[1]);
    }
    return labels;
  }
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Lowercases a form label and strips any trailing "(...)" clarifier. */
function normalizeLabel(label: string): string {
  return label
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim()
    .toLowerCase();
}

/** kebab-case slug from the listing name; strips non-alphanumerics. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Hostname of a URL, lowercased, without a leading "www.". Null if unparseable. */
function normalizedHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function hintFor(field: string): string {
  return FIELD_HINTS[field] ?? "invalid value";
}

function fail(errors: string[]): never {
  const unique = [...new Set(errors)];
  console.log(JSON.stringify({ ok: false, errors: unique }));
  process.exit(1);
}

function main(): void {
  const write = process.argv.includes("--write");
  const errors: string[] = [];

  // --- Environment ---------------------------------------------------------
  let fields: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(process.env.PARSED_ISSUE ?? "");
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new Error("not an object");
    }
    fields = parsed as Record<string, unknown>;
  } catch {
    fail(["PARSED_ISSUE: missing or not a valid JSON object"]);
  }

  const submittedBy = cleanValue(process.env.SUBMITTED_BY);
  if (!GITHUB_LOGIN.test(submittedBy)) {
    errors.push(`submittedBy: ${hintFor("submittedBy")}`);
  }

  const today = cleanValue(process.env.TODAY);
  if (!ISO_DATE.test(today)) {
    errors.push(`addedAt: ${hintFor("addedAt")}`);
  }

  // --- Categories: human-readable labels (or raw keys) -> category keys ----
  const categoryByLabel = new Map<string, string>();
  for (const category of getAllCategories()) {
    categoryByLabel.set(category.name.toLowerCase(), category.key);
    categoryByLabel.set(category.key, category.key);
  }

  const categories: string[] = [];
  for (const raw of cleanValue(fields.categories).split(/[,\n]/)) {
    const label = raw.trim();
    if (!label) continue;
    const key = categoryByLabel.get(label.toLowerCase());
    if (key === undefined) {
      errors.push("categories: contains an unrecognized category");
    } else if (!categories.includes(key)) {
      categories.push(key);
    }
  }

  // --- Tags: optional dropdown; labels ARE the tag values -------------------
  // Unknown tags are rejected by the shared schema (tagSchema enum) below,
  // which reports the constant FIELD_HINTS.tags message.
  const tags: string[] = [];
  for (const raw of cleanValue(fields.tags).split(/[,\n]/)) {
    const tag = raw.trim();
    if (tag && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // --- Attributes: checked labels -> boolean flags --------------------------
  const attributes = {
    openSource: false,
    localFirst: false,
    privacyFirst: false,
    selfHostable: false,
  };
  for (const label of parseCheckedLabels(cleanValue(fields.attributes))) {
    const key = ATTRIBUTE_LABELS[normalizeLabel(label)];
    if (key === undefined) {
      errors.push("attributes: contains an unrecognized attribute");
    } else {
      attributes[key] = true;
    }
  }

  // --- Build the candidate listing -----------------------------------------
  const name = cleanValue(fields.name);
  const license = cleanValue(fields.license);
  const github = cleanValue(fields.github);

  const candidate = {
    slug: slugify(name),
    name,
    description: cleanValue(fields.description),
    url: cleanValue(fields.url),
    author: cleanValue(fields.author),
    categories,
    tags,
    attributes,
    pricing: cleanValue(fields.pricing),
    license: license === "" ? null : license,
    github: github === "" ? null : github,
    icon: null,
    submittedBy,
    addedAt: today,
    recommendedAt: null,
    status: "active",
  };

  // --- Validate with the shared schema (single source of truth) ------------
  const result = listingSchema.safeParse(candidate);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path.length > 0 ? String(issue.path[0]) : "form";
      errors.push(`${field}: ${hintFor(field)}`);
    }
    fail(errors);
  }
  if (errors.length > 0) {
    fail(errors);
  }
  const listing = result.data;

  // --- Cross-check against existing listings --------------------------------
  let existing: Listing[];
  try {
    existing = getAllListings();
  } catch {
    fail(["internal: existing listing data failed to validate"]);
  }

  if (fs.existsSync(path.join(LISTINGS_DIR, `${listing.slug}.json`))) {
    errors.push("slug: a listing with this slug already exists");
  }

  const newHost = normalizedHostname(listing.url);
  for (const other of existing) {
    if (
      other.url === listing.url ||
      (newHost !== null && normalizedHostname(other.url) === newHost)
    ) {
      errors.push("url: this URL or its domain is already listed");
      break;
    }
  }

  if (errors.length > 0) {
    fail(errors);
  }

  // --- Success ---------------------------------------------------------------
  if (write) {
    fs.writeFileSync(
      path.join(LISTINGS_DIR, `${listing.slug}.json`),
      `${JSON.stringify(listing, null, 2)}\n`,
    );
  }
  console.log(JSON.stringify({ ok: true, slug: listing.slug, listing }));
}

main();
