// Identity of a listing URL, used for duplicate detection.
//
// Most tools live on a domain their vendor controls, so the hostname alone
// identifies the tool: a second submission on an already-listed domain is the
// same vendor under a new name and is rejected. Multi-tenant hosts break that
// assumption — thousands of unrelated projects share github.com — so for those
// the leading path segments that name the project (owner/repo) are part of the
// identity instead.
//
// SECURITY: inputs are hostile submitter strings. Everything here is parsing
// and comparison only; callers must never echo the return value back to a
// submitter.

/**
 * Multi-tenant hosts -> number of leading path segments that name the project.
 * Without this, one listing whose URL is a GitHub repo would block every later
 * submission hosted on GitHub.
 */
const SHARED_HOSTS = new Map<string, number>([
  ["github.com", 2],
  ["gitlab.com", 2],
  ["bitbucket.org", 2],
  ["codeberg.org", 2],
  ["gitea.com", 2],
  ["git.sr.ht", 2],
  ["huggingface.co", 2],
  ["sourceforge.net", 2],
  ["docs.nanocollective.org", 1],
]);

/**
 * Host suffixes where the subdomain already names the owner, leaving a single
 * path segment to name the project (e.g. owner.github.io/project).
 */
const SHARED_HOST_SUFFIXES = new Map<string, number>([
  [".github.io", 1],
  [".gitlab.io", 1],
  [".sourceforge.io", 1],
]);

/**
 * Path prefixes that push owner/repo one segment deeper on a shared host, so
 * huggingface.co/spaces/a/x and huggingface.co/spaces/b/y stay distinct.
 */
const NAMESPACE_PREFIXES = new Map<string, ReadonlySet<string>>([
  ["huggingface.co", new Set(["spaces", "datasets", "models"])],
  ["sourceforge.net", new Set(["projects", "p"])],
]);

/** Hostname of a URL, lowercased, without a leading "www.". Null if unparseable. */
export function normalizedHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Path-segment depth that identifies a project on `host`, or null if not shared. */
function sharedHostDepth(host: string): number | null {
  const direct = SHARED_HOSTS.get(host);
  if (direct !== undefined) return direct;
  for (const [suffix, depth] of SHARED_HOST_SUFFIXES) {
    if (host.length > suffix.length && host.endsWith(suffix)) return depth;
  }
  return null;
}

/**
 * A comparable identity string for a listing URL: the bare hostname for a
 * vendor domain, or "host/owner/repo" on a multi-tenant host. Two URLs belong
 * to the same tool when their identities are equal. Null if unparseable.
 */
export function urlIdentity(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const depth = sharedHostDepth(host);
  if (depth === null) return host;

  const segments = parsed.pathname
    .split("/")
    .map((segment) => segment.trim().toLowerCase())
    .filter((segment) => segment.length > 0);

  let take = depth;
  const prefixes = NAMESPACE_PREFIXES.get(host);
  if (
    prefixes !== undefined &&
    segments.length > 0 &&
    prefixes.has(segments[0])
  ) {
    take += 1;
  }

  const project = segments.slice(0, take);
  // A shared host with no project path can't be told apart from any other
  // project on that host, so fall back to the host itself: such URLs still
  // collide with each other without swallowing every path-qualified listing.
  if (project.length === 0) return host;

  // Repo URLs are sometimes given with a .git suffix; strip it so the clone
  // URL and the browse URL resolve to one identity.
  const last = project.length - 1;
  project[last] = project[last].replace(/\.git$/, "");

  return [host, ...project].join("/");
}
