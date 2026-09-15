---
title: "Architecture"
description: "How Nanolist works: data flow from submission to publish, the security model for hostile input, and how the site stays private"
sidebar_order: 4
---

# Architecture

Nanolist is a static Next.js 15 (Pages Router) site exported and deployed to Cloudflare Pages. There is no runtime backend: all listing data is JSON in the repository, baked into the site at build time. The interesting parts are the submission pipeline that turns a GitHub issue into a data file, and the measures that keep hostile input from becoming a problem.

## Data flow

```
issue form ──▶ validate workflow ──▶ /approve gate ──▶ bot PR ──▶ CODEOWNERS review ──▶ merge ──▶ Cloudflare Pages build
```

1. **Issue form.** Submissions arrive via a structured GitHub issue template (`submit-listing.yml`). The submitter never touches the repository contents.
2. **Validate workflow.** Runs read-only on the issue: schema-level checks (https URL with a public hostname, plain-text description within length limits, category and tag limits), duplicate detection against existing and pending listings, and anti-abuse checks (submitter account age ≥ 7 days, ≤ 5 submissions per day). Results are commented on the issue and it is labelled `validated` or `needs-changes`.
3. **`/approve` gate.** A maintainer comments `/approve`. The workflow verifies the commenter's repository permission level through the GitHub API before doing anything — the comment text alone grants nothing.
4. **Bot PR.** The submission is **re-validated at approval time** (the issue body may have been edited since the first pass), then the bot opens a PR adding exactly one file: `data/listings/<slug>.json`. The PR is authored with the `NANOLIST_BOT_TOKEN` fine-grained PAT so that `pr-checks.yml` runs on it; PRs opened with the default `github.token` would not trigger checks.
5. **Review and merge.** The review ruleset requires one CODEOWNERS review, and the quality ruleset requires the shared `pr-checks` status checks plus the local `Validate Listings` job (which re-runs the zod schema against every listing). Merge to `master` triggers the Cloudflare Pages build and deploy.

## Security model

Submissions are untrusted input from arbitrary GitHub accounts, so the pipeline is built around a few principles:

- **Env-var indirection.** Workflow scripts never interpolate issue content into shell commands or expressions; untrusted text is passed through environment variables and handled as data.
- **Least-privilege jobs.** The validation workflow runs read-only. Write permissions (creating branches, opening PRs) exist only in the approval job, gated behind the permission check.
- **API-verified approver.** `/approve` is honoured only if the GitHub API confirms the commenter has maintainer-level permission on the repository.
- **Re-validation at approval time.** Validation results from submission time are never trusted at approval time; the content is checked again immediately before the PR is created.
- **Schema rejects markup.** The zod schema (`lib/schema.ts`) forbids `<`, `>`, and `javascript:` in descriptions, requires public https URLs, and is `.strict()` — unknown fields fail validation.
- **Plain-text rendering.** Listing fields are rendered as text, never as HTML.
- **No SVG icons.** Icons are PNG only (`/icons/<slug>.png`), fetched by maintainers via the icon pipeline and served from this repository — SVG's script-bearing capabilities are excluded entirely.
- **Two human gates.** Even if every automated check were fooled, a maintainer must approve the issue and a code owner must approve the PR before anything is published.

## Repository layout

```
data/
  taxonomy.json        # taxonomy: 18 categories in 9 groups, plus accepted tags
  listings/            # one JSON file per listing
lib/
  schema.ts            # zod schemas: the single source of truth for the data model
  listings.ts          # data loading for the site
pages/                 # Next.js Pages Router: index, /listing/[slug], /category/[key], /submit
scripts/
  validate-listings.ts # backs `pnpm validate`
public/icons/          # self-hosted listing icons (PNG)
docs/                  # this documentation
```

## Privacy: how search stays client-side

The full listing index ships with the static build, and search, filtering, and sorting run entirely in the browser using Fuse.js. No search backend, no query logging, no third-party requests of any kind from visitors: icons are self-hosted PNGs and there is no analytics. What a visitor searches for never leaves their machine.

## Icon pipeline

`pnpm fetch-icons` fetches icons for listings and stores them as PNGs under `public/icons/`, referenced from each listing's `icon` field (validated against `/icons/<slug>.png`). Icons are fetched by maintainers at curation time, not at page load — visitors only ever load images from the site's own origin.
