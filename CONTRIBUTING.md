# Contributing to Nanolist

Thanks for your interest in contributing. Contributors of all skill levels are welcome — whether you are fixing a typo in a listing, improving the site, or building out the submission automation, there is a place for you here. If you are unsure where to start, say hello in [Discord](https://discord.gg/ktPDV6rekE).

## Development Setup

Prerequisites: Node 22 and pnpm (the repo pins `pnpm@11.0.9` via `packageManager`).

```bash
git clone https://github.com/Nano-Collective/nanolist.git
cd nanolist
pnpm install
pnpm dev
```

The site runs at [http://localhost:3000](http://localhost:3000). It is a Next.js 15 (Pages Router) static export — no server-side code at runtime.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run the development server |
| `pnpm build` | Build the static site |
| `pnpm lint` | Lint and format check (Biome) |
| `pnpm types` | Type-check (strict TypeScript, no emit) |
| `pnpm knip` | Dead code and unused dependency detection |
| `pnpm validate` | Validate every file in `data/listings/` against the zod schema in `lib/schema.ts` |
| `pnpm fetch-icons` | Fetch and self-host listing icons |
| `pnpm test:all` | The full gate: types, lint, knip, validate |

Run `pnpm test:all` before opening a PR. CI runs the same gate, so if it passes locally it should pass there.

## Coding Standards

- **TypeScript, strict.** No `any` escapes; keep `pnpm types` clean.
- **Biome** handles linting and formatting — run `pnpm lint:fix` rather than arguing with it.
- **No dead code.** `pnpm knip` is part of the gate; remove unused exports and dependencies rather than suppressing them.
- **Validation lives in `lib/schema.ts`.** If you change the listing data model, change the zod schema first and let the types flow from it.

## Listing Data Changes

Listings are one JSON file each in `data/listings/`, validated by `lib/schema.ts`. Two ways to change them:

- **New listings** should go through the submission pipeline — the [issue form](https://github.com/Nano-Collective/nanolist/issues/new?template=submit-listing.yml) — rather than a direct PR. That keeps validation, approval, and provenance in one place. See [docs/submitting.md](docs/submitting.md).
- **Corrections** (fixing a URL, updating a description, correcting attributes) are welcome as direct PRs editing the relevant `data/listings/<slug>.json`. They must pass `pnpm validate`.

The taxonomy lives in `data/categories.json` (18 categories in 9 groups). Changes to it are structural, not editorial — raise an issue first.

The `recommendedAt` field is set by curators only; PRs adding it to your own submission will be declined.

## Commit Messages

Commits follow the collective's light convention:

- `feat: <description>` — new feature
- `fix: <description>` — bug fix
- `mod: <description>` — modification to existing behaviour
- `chore: <description>` — maintenance, dependency updates (`chore(deps): ...`)
- `docs: <description>` — documentation-only change

Lowercase, imperative mood, no trailing period. Scope is optional in parentheses.

## Code of Conduct

Nanolist follows the [Nano Collective Code of Conduct](https://doc.nanocollective.org/collective/organisation/community). We do not redefine it here — read it there, and hold to it.

## Questions?

- Open an issue on GitHub.
- Join the [Discord](https://discord.gg/ktPDV6rekE).

By contributing, you agree that your contributions are licensed under the MIT License. See [LICENSE.md](LICENSE.md).
