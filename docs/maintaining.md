---
title: "Maintaining"
description: "One-time repository setup and operational notes for Nanolist maintainers"
sidebar_order: 6
---

# Maintaining

Operational notes for maintainers. Contributors do not need any of this.

## One-time repository setup

Manual steps after pushing this repository. Without them the automation degrades quietly, so run through all five.

1. **Bot token.** Create a fine-grained personal access token scoped to this repository only, with **Contents: read/write** and **Pull requests: read/write**. Save it as the repository secret `NANOLIST_BOT_TOKEN`. The approval workflow uses it to open listing PRs, which then trigger `pr-checks.yml`. Without it, PRs fall back to `github.token` and show no status checks.
2. **Rulesets.** Apply the collective's shared quality and review rulesets with the `sync-rulesets.sh` script in [`Nano-Collective/.github`](https://github.com/Nano-Collective/.github) — see [Project Infrastructure](/collective/projects/project-infrastructure). The required status checks use the prefixed names (`pr-checks / Linting`, `pr-checks / Type Checks`, `pr-checks / Format Checks`, `pr-checks / Unused Dependencies`, `pr-checks / Unit Tests & Coverage Analysis`, `pr-checks / Verify Build`), plus the local `Validate Listings` job.
3. **Cloudflare Pages.** Create a Pages project named `nanolist` and add the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. **Labels.** Create the labels `listing-submission`, `via-website`, `validated`, and `needs-changes` — the submission workflows apply them and will fail silently if they are missing. `via-website` matters most: GitHub only applies issue-template labels that already exist in the repository, and without it submissions from the website form are parsed against the wrong template.
5. **Badge token.** Set the `PAT_TOKEN` secret (org-level or repository) so `update-badges.yml` can push regenerated badges past the rulesets.

## CODEOWNERS

`.github/CODEOWNERS` names individual maintainers rather than `@Nano-Collective/core-team`, and every path requires their review. Combined with the review ruleset's code-owner requirement, this is the gate that stops automation-created submission PRs — built from hostile submitter input — from merging without a human maintainer's approval. Add new maintainers there directly.

## Releases

Nanolist is a deployed site, not a published package. Merging to `main` triggers the Cloudflare Pages build (`deploy-cloudflare-pages.yaml`); that is the release. There are no version bumps, changesets, or registry publishes.

## Curation

The `recommendedAt` field on a listing is set by curators only. Curators mark tools that align with the collective's values: open source, local-first, privacy-respecting.
