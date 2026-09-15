# Nanolist

The easiest way to browse the AI tool ecosystem — a community-curated directory with a bias toward open-source, local-first, privacy-respecting software.

Built by the [Nano Collective](https://nanocollective.org), a community collective building AI tooling not for profit, but for the community. Every listing is a single JSON file in this repository, reviewed by humans before it goes live, and rendered as a fast, static, searchable site. Visitors make **zero third-party requests** — search runs in the browser, icons are self-hosted, and there is no analytics.

![Build Status](https://github.com/Nano-Collective/nanolist/raw/master/badges/build.svg)
![Coverage](https://github.com/Nano-Collective/nanolist/raw/master/badges/coverage.svg)
![License](https://github.com/Nano-Collective/nanolist/raw/master/badges/license.svg)
![Repo Size](https://github.com/Nano-Collective/nanolist/raw/master/badges/repo-size.svg)
![Stars](https://github.com/Nano-Collective/nanolist/raw/master/badges/stars.svg)
![Forks](https://github.com/Nano-Collective/nanolist/raw/master/badges/forks.svg)

## Quick Start

Browse the directory at **[list.nanocollective.org](https://list.nanocollective.org)** — no install, no account.

To submit a tool, use the [website form](https://list.nanocollective.org/submit): it validates your listing and opens a prefilled GitHub issue for you. No fork or PR required.

To run the site locally (Node 22 and pnpm):

```bash
git clone https://github.com/Nano-Collective/nanolist.git
cd nanolist
pnpm install
pnpm dev     # http://localhost:3000
pnpm build   # static export into dist/
```

## How It Works

Markdown awesome lists are great for curation but poor for browsing: no search, no filtering, no structure. Nanolist keeps the community-curation model and adds the browsing layer:

- **Search, filter, sort** — a full index of listings with client-side search (Fuse.js), filterable by category, attributes (open source, local-first, privacy-first, self-hostable), and pricing.
- **Detail pages** — every tool gets a page at `/listing/<slug>` with its description, links, license, and attributes.
- **Category pages** — 18 categories in 9 groups, each browsable at `/category/<key>`.
- **Recommended badge** — curators mark tools that align with the collective's values.

Behind the site, the submission flow works like this:

1. Anyone submits a tool through the website form or a GitHub issue form.
2. Automation validates the submission read-only: URL checks, length limits, duplicate detection, and basic anti-spam rules. It comments the results on the issue and labels it.
3. A maintainer reviews the issue and comments `/approve`. The bot verifies the commenter's repository permissions via the GitHub API before acting.
4. The bot re-validates the submission and opens a pull request adding one file: `data/listings/<slug>.json`.
5. A CODEOWNERS review approves and merges the PR. The merge triggers a Cloudflare Pages build, and the listing is live.

Two humans (the approver and the reviewer) sit between any submission and the published site.

## Submitting a Listing

Nanolist accepts any real AI tool — product, framework, library, or model. Listings must be live, publicly accessible, and honestly described. We especially welcome tools that align with the Nano Collective's values: open source, local-first, and privacy-respecting — those are eligible for a Recommended badge from our curators. Not accepted: affiliate or tracking links, self-promotional spam, duplicates, vaporware, or listings that misrepresent what a tool does.

The recommended way to submit is the [website form](https://list.nanocollective.org/submit); the [GitHub issue form](https://github.com/Nano-Collective/nanolist/issues/new?template=submit-listing.yml) remains available if you prefer it. The [submission guide](docs/submitting.md) walks through the form fields, what the validation bot checks, and how the review lifecycle works.

## Documentation

Documentation lives in the [docs/](docs/) folder and on the Nano Collective docs site:

- **[Getting Started](docs/getting-started/index.md)** — browsing, submitting, and local development
- **[Submitting a Listing](docs/submitting.md)** — form fields, validation, and the review lifecycle
- **[Architecture](docs/architecture.md)** — how an issue becomes a published listing, and the security model
- **[Community](docs/community.md)** — Discord, contributing, and how to help
- **[Maintaining](docs/maintaining.md)** — repository setup and operational notes for maintainers

For contribution details — commands, coding standards, how listing data changes work — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT License. See [LICENSE.md](LICENSE.md) for details.

## Community

The Nano Collective is a community collective building AI tooling for the community, not for profit. We'd love your help.

- **Contribute**: See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.
- **The collective**: [nanocollective.org](https://nanocollective.org) · [docs](https://docs.nanocollective.org) · [GitHub](https://github.com/Nano-Collective) · [Discord](https://discord.gg/ktPDV6rekE)
- **Support the work**: The [Support page](https://docs.nanocollective.org/collective/organisation/support) covers donations and sponsorship.
- **Paid contribution**: The [Economics Charter](https://docs.nanocollective.org/collective/organisation/economics-charter) sets out how scoped paid bounties work.
