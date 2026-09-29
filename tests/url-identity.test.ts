import test from "ava";
import { normalizedHostname, urlIdentity } from "../lib/url-identity";

test("a vendor domain is identified by its hostname alone", (t) => {
  t.is(urlIdentity("https://ollama.com"), "ollama.com");
  t.is(urlIdentity("https://www.ollama.com/turbo"), "ollama.com");
  t.is(urlIdentity("https://ollama.com/library/llama3"), "ollama.com");
});

test("different projects on a shared code host stay distinct", (t) => {
  // The regression this guards: three listings already use a github.com URL,
  // so hostname-only matching rejected every later GitHub submission.
  const identities = [
    "https://github.com/ggml-org/llama.cpp",
    "https://github.com/ggml-org/whisper.cpp",
    "https://github.com/OHF-Voice/piper1-gpl",
    "https://github.com/louis030195/hyperconsciousness",
    "https://github.com/cpys/codex-quota-overlay",
  ].map((url) => urlIdentity(url));

  t.is(new Set(identities).size, identities.length);
});

test("the same repo resolves to one identity across spellings", (t) => {
  const canonical = urlIdentity("https://github.com/ollama/ollama");
  t.is(canonical, "github.com/ollama/ollama");
  for (const variant of [
    "https://github.com/OLLAMA/Ollama",
    "https://github.com/ollama/ollama.git",
    "https://github.com/ollama/ollama/",
    "https://github.com/ollama/ollama/tree/main/docs",
    "https://www.github.com/ollama/ollama",
  ]) {
    t.is(urlIdentity(variant), canonical, variant);
  }
});

test("owner subdomains reserve one path segment for the project", (t) => {
  t.is(
    urlIdentity("https://thewh1teagle.github.io/vibe/"),
    "thewh1teagle.github.io/vibe",
  );
  t.not(
    urlIdentity("https://thewh1teagle.github.io/vibe/"),
    urlIdentity("https://thewh1teagle.github.io/other-project"),
  );
});

test("namespaced shared hosts keep separate owners apart", (t) => {
  t.not(
    urlIdentity("https://huggingface.co/spaces/alice/demo"),
    urlIdentity("https://huggingface.co/spaces/bob/demo"),
  );
  t.is(
    urlIdentity("https://huggingface.co/spaces/alice/demo"),
    "huggingface.co/spaces/alice/demo",
  );
});

test("a shared host with no project path falls back to the host", (t) => {
  t.is(urlIdentity("https://github.com"), "github.com");
  t.is(urlIdentity("https://github.com/"), "github.com");
});

test("unparseable input yields null rather than throwing", (t) => {
  t.is(urlIdentity("not a url"), null);
  t.is(normalizedHostname("not a url"), null);
});

test("normalizedHostname lowercases and strips www.", (t) => {
  t.is(normalizedHostname("https://WWW.Example.COM/path"), "example.com");
});
