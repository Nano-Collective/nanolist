---
title: "Submitting a Listing"
description: "How to submit an AI tool to Nanolist, what the validation bot checks, and how review and publishing work"
sidebar_order: 1
---

# Submitting a Listing

Anyone can submit a tool to Nanolist. You do not need to fork the repository, write JSON, or open a pull request — everything happens through a GitHub issue form.

## What we accept

Nanolist accepts any real AI tool — product, framework, library, or model. Listings must be live, publicly accessible, and honestly described. We especially welcome tools that align with the Nano Collective's values: open source, local-first, and privacy-respecting — those are eligible for a Recommended badge from our curators. Not accepted: affiliate or tracking links, self-promotional spam, duplicates, vaporware, or listings that misrepresent what a tool does.

## Submitting

The recommended path is the [website form](https://list.nanocollective.org/submit), which validates your listing as you type and opens a prefilled GitHub issue for you to review and submit. Alternatively, open the [listing submission form](https://github.com/Nano-Collective/nanolist/issues/new?template=submit-listing.yml) on GitHub directly and fill it in. The fields map directly onto the listing data model:

- **Name** — the tool's name as its own site spells it.
- **URL** — the tool's homepage. Must be `https://` and publicly reachable. Link the tool itself, not a blog post, announcement, or store page.
- **Description** — 10–300 characters of plain text. No HTML, no Markdown, no links.
- **Author** — the person, team, or company behind the tool.
- **Categories** — pick 1–3 from the taxonomy (18 categories, from Chat Assistants to Local Inference to Learning Resources).
- **Tags** — optional, lowercase-hyphenated keywords to help search. Tags must come from the accepted list in `data/taxonomy.json`; propose new tags or categories via a normal issue or PR.
- **Attributes** — whether the tool is open source, local-first, privacy-first, and/or self-hostable. Answer honestly; these are checked during review.
- **Pricing** — free, freemium, paid, or open-source.
- **License and GitHub repository** — where applicable.

### Writing a good description

Describe what the tool does, plainly, for someone who has never heard of it. Say what it is, what it runs on or connects to, and what makes it distinct. Skip the marketing.

Good:

> A local-first CLI coding agent that works with multiple AI providers, including fully offline models via Ollama.

> Open-source vector database for storing and querying embeddings, with client libraries for Python and JavaScript.

Bad:

> The world's most revolutionary AI platform that will 10x your productivity! 🚀 Try it now at the link below!

> A tool for AI.

The first bad example is hype with no information (and links are not allowed in descriptions anyway); the second says nothing at all.

## What the validation bot checks

When you submit, an automated workflow validates the issue and comments the results. It checks, among other things:

- the URL is `https://` with a public hostname (no localhost or private IP ranges);
- the description contains no HTML (`<`, `>`) or `javascript:` fragments;
- field length limits (description 10–300 characters, name and author limits, at most 3 categories and 8 tags);
- the tool is not already listed or pending as another submission;
- your GitHub account is at least 7 days old;
- you have submitted no more than 5 listings that day.

If validation fails, the bot labels the issue `needs-changes` and tells you exactly what to fix — edit the issue body and it will re-check. If it passes, the issue is labelled `validated` and waits for a maintainer.

## From submission to published

1. **You submit** the issue form. The bot validates and labels it.
2. **A maintainer approves** by commenting `/approve` on the issue. The bot verifies via the GitHub API that the commenter actually has maintainer permissions — a random commenter typing `/approve` does nothing.
3. **The bot opens a pull request** adding a single file, `data/listings/<slug>.json`, after re-validating the submission.
4. **A code owner reviews** the PR — this is a second, human check on the content.
5. **Merge publishes.** The merge to `main` triggers a Cloudflare Pages build and the listing appears on the site.

There is no fixed turnaround; maintainers review as time allows. If a submission sits for a while, a polite ping on the issue is fine.

## Editing or removing an existing listing

Open a regular issue on the repository describing the change — a corrected URL, an updated description, a tool that has shut down. If you are comfortable with JSON, a direct pull request editing the relevant `data/listings/<slug>.json` file is also welcome; it must pass `pnpm validate`.

## The Recommended badge

Curators mark tools that align with the collective's values — open source, local-first, privacy-respecting — by setting a `recommendedAt` date on the listing, which shows as a Recommended badge on the site. This is a curatorial decision made after review; you cannot request it in the submission form, and asking for it will not speed it up.

## Questions

Ask in the [Discord](https://discord.gg/ktPDV6rekE) or open an issue.
