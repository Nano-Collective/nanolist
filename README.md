# Nanolist

The easiest way to browse the AI tool ecosystem — a community-curated directory with a bias toward open-source, local-first, privacy-respecting software.

Built by the [Nano Collective](https://nanocollective.org), a community collective building AI tooling not for profit, but for the community. Everything we build is open, transparent, and driven by the people who use it.

Nanolist lives at the intersection of an "awesome list" and a real website: every listing is a single JSON file in this repository, reviewed by humans before it goes live, and rendered as a fast, static, searchable site. Visitors make **zero third-party requests** — search runs in the browser, icons are self-hosted, and there is no analytics.

<!-- badges: build / license / stars badges go here once the update-badges workflow is wired up -->

## How It Works

Markdown awesome lists are great for curation but poor for browsing: no search, no filtering, no structure. Nanolist keeps the community-curation model and adds the browsing layer:

- **Search, filter, sort** — a full index of listings with client-side search (Fuse.js), filterable by category, attributes (open source, local-first, privacy-first, self-hostable), and pricing.
- **Detail pages** — every tool gets a page at `/listing/<slug>` with its description, links, license, and attributes.
- **Category pages** — 18 categories in 9 groups, each browsable at `/category/<key>`.
- **Recommended badge** — curators mark tools that align with the collective's values.

Behind the site, the submission flow works like this:

1. Anyone submits a tool through a GitHub issue form.
2. Automation validates the submission read-only: URL checks, length limits, duplicate detection, and basic anti-spam rules. It comments the results on the issue and labels it.
3. A maintainer reviews the issue and comments `/approve`. The bot verifies the commenter's repository permissions via the GitHub API before acting.
4. The bot re-validates the submission and opens a pull request adding one file: `data/listings/<slug>.json`.
5. A CODEOWNERS review approves and merges the PR. The merge triggers a Cloudflare Pages build, and the listing is live.

Two humans (the approver and the reviewer) sit between any submission and the published site. See [docs/architecture.md](docs/architecture.md) for the full technical picture.

## Submitting a Listing

Nanolist accepts any real AI tool — product, framework, library, or model. Listings must be live, publicly accessible, and honestly described. We especially welcome tools that align with the Nano Collective's values: open source, local-first, and privacy-respecting — those are eligible for a Recommended badge from our curators. Not accepted: affiliate or tracking links, self-promotional spam, duplicates, vaporware, or listings that misrepresent what a tool does.

The recommended way to submit is the [website form](https://list.nanocollective.org/submit), which validates your listing and opens a prefilled GitHub issue for you; the [GitHub issue form](https://github.com/Nano-Collective/nanolist/issues/new?template=submit-listing.yml) remains available if you prefer it. Either way no fork or PR is required — the [submission guide](docs/submitting.md) walks through the form fields, what the validation bot checks, and how the review lifecycle works.

## For Developers

Requires Node 22 and pnpm.

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build the static site
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) to view the site. The main entry point is `pages/index.tsx`; listing data lives in `data/listings/`. The site is a Next.js 15 (Pages Router) static export deployed to Cloudflare Pages.

For contribution details — commands, coding standards, how listing data changes work — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Repository Setup (Maintainers)

One-time manual steps after pushing this repository. Without them the automation degrades quietly, so run through all five.

1. **Bot token.** Create a fine-grained personal access token scoped to this repository only, with **Contents: read/write** and **Pull requests: read/write**. Save it as the repository secret `NANOLIST_BOT_TOKEN`. The approval workflow uses it to open listing PRs, which then trigger `pr-checks.yml`. Without it, PRs fall back to `github.token` and show no status checks.
2. **Branch protection on `main`.** Require 1 review from CODEOWNERS, dismiss stale approvals on new pushes, and require the status check `checks` from `pr-checks.yml`.
3. **Cloudflare Pages.** Create a Pages project named `nanolist` and add the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. **Labels.** Create the labels `listing-submission`, `via-website`, `validated`, and `needs-changes` — the submission workflows apply them and will fail silently if they are missing. `via-website` matters most: GitHub only applies issue-template labels that already exist in the repository, and without it submissions from the website form are parsed against the wrong template.
5. **CODEOWNERS.** Ensure the maintainers team referenced in `.github/CODEOWNERS` exists and has write access.

## License

MIT License. See [LICENSE.md](LICENSE.md) for details.

## Community

The Nano Collective is a community collective building AI tooling for the community, not for profit. We'd love your help.

- **Contribute**: See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.
- **The collective**: [nanocollective.org](https://nanocollective.org) · [docs](https://doc.nanocollective.org/collective) · [GitHub](https://github.com/Nano-Collective) · [Discord](https://discord.gg/ktPDV6rekE)
