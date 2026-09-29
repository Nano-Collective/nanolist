// End-to-end tests for the submission validator, driven the same way the
// workflow drives it: environment in, one line of JSON out.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "ava";

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
  // data/listings already contains three listings whose URL is a github.com
  // repo; hostname-only matching rejected these two real submissions (#33, #26).
  for (const [name, repo] of [
    ["Hyperconsciousness", "https://github.com/louis030195/hyperconsciousness"],
    ["Codex Quota Overlay", "https://github.com/cpys/codex-quota-overlay"],
  ]) {
    const result = validate(submission({ name, url: repo, github: repo }));
    t.true(result.ok, `${name}: ${JSON.stringify(result.errors)}`);
  }
});

test("an already-listed repo is rejected even under a new domain", (t) => {
  const result = validate(
    submission({
      name: "Ollama Rebrand",
      url: "https://an-unlisted-domain.example",
      github: "https://github.com/ollama/ollama",
    }),
  );
  t.false(result.ok);
  t.deepEqual(result.errors, ["github: this repository is already listed"]);
});

test("a repo already listed as another listing's URL is rejected", (t) => {
  const result = validate(
    submission({
      name: "Llama Redux",
      url: "https://another-unlisted-domain.example",
      github: "https://github.com/ggml-org/llama.cpp",
    }),
  );
  t.false(result.ok);
  t.deepEqual(result.errors, ["github: this repository is already listed"]);
});

test("a different repo under an already-listed owner is accepted", (t) => {
  const result = validate(
    submission({
      name: "GGML Something New",
      url: "https://github.com/ggml-org/something-new",
      github: "https://github.com/ggml-org/something-new",
    }),
  );
  t.true(result.ok, JSON.stringify(result.errors));
});

test("a repo given as both url and github reports a single error", (t) => {
  const repo = "https://github.com/ggml-org/llama.cpp";
  const result = validate(
    submission({ name: "Llama Dup", url: repo, github: repo }),
  );
  t.false(result.ok);
  t.deepEqual(result.errors, ["url: this URL or its domain is already listed"]);
});
