// End-to-end tests for the submission validator, driven the same way the
// workflow drives it: environment in, one line of JSON out.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "ava";
import { getAllListings } from "../lib/listings";
import { urlIdentity } from "../lib/url-identity";

const FIXTURES = path.join(process.cwd(), "tests", "fixtures", "submission");
const SCRIPT = path.join(process.cwd(), "scripts", "parse-submission.ts");

type Result = { ok: boolean; slug?: string; errors?: string[] };

function loadFixture(name: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES, name), "utf8"));
}

/** Runs the validator. Exit code 1 on rejection is expected, not a failure. */
function validate(fields: Record<string, unknown>): Result {
  let stdout: string;
  try {
    stdout = execFileSync(process.execPath, ["--import=tsx", SCRIPT], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      env: {
        ...process.env,
        PARSED_ISSUE: JSON.stringify(fields),
        SUBMITTED_BY: "testuser",
        TODAY: "2026-09-29",
      },
    });
  } catch (error) {
    stdout = String((error as { stdout?: string }).stdout ?? "");
  }
  const lines = stdout.trim().split("\n");
  return JSON.parse(lines[lines.length - 1]);
}

// Reserved for tests that need a repo guaranteed absent from data/listings.
const UNLISTED_OWNER = "nanolist-test-fixture-owner";
const UNLISTED_REPO = "nanolist-test-fixture-repo";

/**
 * A repo URL taken from live listing data, so these tests assert behaviour
 * against whatever is actually listed rather than against names that were
 * listed when they were written. `field` picks which column to read: a repo
 * recorded as a listing's `github`, or one used as its primary `url`.
 */
function listedRepo(field: "github" | "url"): string {
  const match = getAllListings().find((listing) => {
    const value = field === "github" ? listing.github : listing.url;
    return (
      value !== null && urlIdentity(value)?.startsWith("github.com/") === true
    );
  });
  if (match === undefined) {
    throw new Error(`no listing has a github.com repo in its ${field} field`);
  }
  return (field === "github" ? match.github : match.url) as string;
}

/** Owner of an already-listed repo, for "same owner, new repo" cases. */
function listedOwner(): string {
  const identity = urlIdentity(listedRepo("url"));
  return (identity as string).split("/")[1];
}

const submission = (overrides: Record<string, unknown> = {}) => ({
  ...loadFixture("valid.json"),
  ...overrides,
});

test("a known-good submission is accepted", (t) => {
  const result = validate(submission());
  t.true(result.ok, JSON.stringify(result.errors));
  t.is(result.slug, "example-notes-ai");
});

test("the web-template variant is accepted", (t) => {
  t.true(validate(loadFixture("valid-web.json")).ok);
});

test("a hostile submission is rejected", (t) => {
  t.false(validate(loadFixture("hostile.json")).ok);
});

test("a new product on an already-listed vendor domain is rejected", (t) => {
  const result = validate(loadFixture("duplicate.json"));
  t.false(result.ok);
  t.deepEqual(result.errors, ["url: this URL or its domain is already listed"]);
});

test("a GitHub-hosted submission is not blocked by other GitHub listings", (t) => {
  // The regression this guards: several listings use a github.com repo as their
  // URL, and hostname-only matching rejected every later GitHub submission
  // (issues #33 and #26 were both false positives). The precondition is read
  // from live data, and the candidate repo is a fixture name no listing can
  // take, so approving a real submission can never turn this test red.
  const onGitHub = getAllListings().filter(
    (listing) => urlIdentity(listing.url)?.startsWith("github.com/") === true,
  );
  t.true(
    onGitHub.length >= 2,
    "expected at least two github.com-hosted listings for this to be meaningful",
  );

  const repo = `https://github.com/${UNLISTED_OWNER}/${UNLISTED_REPO}`;
  const result = validate(
    submission({ name: "Unlisted GitHub Tool", url: repo, github: repo }),
  );
  t.true(result.ok, JSON.stringify(result.errors));
});

test("an already-listed repo is rejected even under a new domain", (t) => {
  // The gap the repo check closes: before it, only `url` was compared, so the
  // same project could be listed twice under a fresh homepage.
  const result = validate(
    submission({
      name: "Rebranded Duplicate",
      url: "https://an-unlisted-domain.example",
      github: listedRepo("github"),
    }),
  );
  t.false(result.ok);
  t.deepEqual(result.errors, ["github: this repository is already listed"]);
});

test("a repo already listed as another listing's URL is rejected", (t) => {
  const result = validate(
    submission({
      name: "Cross Field Duplicate",
      url: "https://another-unlisted-domain.example",
      github: listedRepo("url"),
    }),
  );
  t.false(result.ok);
  t.deepEqual(result.errors, ["github: this repository is already listed"]);
});

test("a different repo under an already-listed owner is accepted", (t) => {
  const repo = `https://github.com/${listedOwner()}/${UNLISTED_REPO}`;
  const result = validate(
    submission({ name: "Same Owner New Repo", url: repo, github: repo }),
  );
  t.true(result.ok, JSON.stringify(result.errors));
});

test("a repo given as both url and github reports a single error", (t) => {
  const repo = listedRepo("url");
  const result = validate(
    submission({ name: "Llama Dup", url: repo, github: repo }),
  );
  t.false(result.ok);
  t.deepEqual(result.errors, ["url: this URL or its domain is already listed"]);
});
