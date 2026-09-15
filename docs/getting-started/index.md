---
title: "Getting Started"
description: "Browse the Nanolist directory, submit a tool, or run the site locally"
sidebar_order: 2
---

# Getting Started

## Browse the directory

The site lives at [list.nanocollective.org](https://list.nanocollective.org). Search, filter by category, attributes (open source, local-first, privacy-first, self-hostable) and pricing, or browse by category. Every tool has a detail page at `/listing/<slug>` with its description, links, license, and attributes.

## Submit a tool

Use the [website form](https://list.nanocollective.org/submit) — it validates your listing and opens a prefilled GitHub issue for you. No fork, no PR, no JSON. The [Submitting a Listing](../submitting.md) guide walks through the form fields and the review lifecycle.

## Run the site locally

Prerequisites: Node 22 and pnpm.

```bash
git clone https://github.com/Nano-Collective/nanolist.git
cd nanolist
pnpm install
pnpm dev
```

The site runs at [http://localhost:3000](http://localhost:3000). It is a Next.js 15 (Pages Router) static export — no server-side code at runtime.

```bash
# Build the static site into dist/
pnpm build

# Run the full test gate (format, lint, types, knip, listing validation, tests)
pnpm test:all
```

For coding standards, commands, and how listing data changes work, see [CONTRIBUTING.md](https://github.com/Nano-Collective/nanolist/blob/master/CONTRIBUTING.md).
