import fs from "node:fs";
import path from "node:path";
import test from "ava";
import { listingSchema } from "../lib/schema";

const FIXTURES = path.join(process.cwd(), "tests", "fixtures");

function loadFixture(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES, name), "utf8"));
}

const validListing = () =>
  loadFixture("valid-listing.json") as Record<string, unknown>;

test("known-good fixture passes the listing schema", (t) => {
  const result = listingSchema.safeParse(validListing());
  t.true(
    result.success,
    result.success ? undefined : JSON.stringify(result.error.issues),
  );
});

test("rejects non-https URLs", (t) => {
  t.false(
    listingSchema.safeParse({ ...validListing(), url: "http://example.com" })
      .success,
  );
});

test("rejects localhost and private-range URLs", (t) => {
  for (const url of [
    "https://localhost:3000",
    "https://127.0.0.1",
    "https://10.0.0.1",
    "https://192.168.1.1",
    "https://172.16.0.1",
  ]) {
    t.false(listingSchema.safeParse({ ...validListing(), url }).success, url);
  }
});

test("rejects HTML and javascript: payloads in descriptions", (t) => {
  for (const description of [
    "A tool with <script>alert(1)</script> in its description",
    "Totally innocent javascript:alert(1) description text",
  ]) {
    t.false(
      listingSchema.safeParse({ ...validListing(), description }).success,
    );
  }
});

test("rejects non-github.com github links", (t) => {
  t.false(
    listingSchema.safeParse({
      ...validListing(),
      github: "https://gitlab.com/foo/bar",
    }).success,
  );
});

test("rejects slugs that are not kebab-case", (t) => {
  for (const slug of [
    "Not-Kebab",
    "spaces here",
    "trailing-",
    "-leading",
    "sneaky/../path",
  ]) {
    t.false(listingSchema.safeParse({ ...validListing(), slug }).success, slug);
  }
});

test("rejects unknown categories and extra keys", (t) => {
  t.false(
    listingSchema.safeParse({
      ...validListing(),
      categories: ["not-a-real-category"],
    }).success,
  );
  t.false(
    listingSchema.safeParse({ ...validListing(), surprise: true }).success,
  );
});
