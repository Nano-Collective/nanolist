// CLI: renders the listing-submission issue forms from data/taxonomy.json so
// they can never drift from the taxonomy. Two templates are generated:
//
//   submit-listing.yml      dropdown/checkbox form for humans on GitHub
//   submit-listing-web.yml  input-only variant the website form prefills via
//                           /issues/new query params (GitHub can only prefill
//                           input and textarea fields, never dropdowns)
//
//   pnpm generate:issue-template          write both templates to disk
//   tsx scripts/generate-issue-template.ts --check
//                                         exit 1 if either file on disk is stale
//
// Output is deterministic: options follow taxonomy order, trailing newline.
import fs from "node:fs";
import path from "node:path";
import taxonomy from "@/data/taxonomy.json";

const TEMPLATE_DIR = path.join(process.cwd(), ".github", "ISSUE_TEMPLATE");

/** Values safe to emit as unquoted YAML scalars; anything else gets quoted. */
const SAFE_SCALAR = /^[A-Za-z0-9][A-Za-z0-9 &().+/-]*$/;

function yamlScalar(value: string): string {
  return SAFE_SCALAR.test(value) && !value.endsWith(" ")
    ? value
    : JSON.stringify(value);
}

function optionLines(values: string[]): string {
  return values.map((value) => `        - ${yamlScalar(value)}`).join("\n");
}

const POLICY_MARKDOWN = `  - type: markdown
    attributes:
      value: |
        ## Submission policy

        Nanolist accepts any real AI tool — product, framework, library, or
        model. Listings must be live, publicly accessible, and honestly
        described. We especially welcome tools that align with the Nano
        Collective's values: open source, local-first, and privacy-respecting
        — those are eligible for a Recommended badge from our curators.

        **Not accepted:** affiliate or tracking links, self-promotional spam,
        duplicates, vaporware, or listings that misrepresent what a tool does.`;

const FREE_TEXT_FIELDS_HEAD = `  - type: input
    id: name
    attributes:
      label: Name
      description: The tool's name as it should appear on nanolist.
    validations:
      required: true
  - type: input
    id: url
    attributes:
      label: URL
      description: The tool's homepage.
      placeholder: "https://"
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: Description
      description: 10–300 characters, plain text.
    validations:
      required: true
  - type: input
    id: author
    attributes:
      label: Author
      description: who makes it
    validations:
      required: true`;

const FREE_TEXT_FIELDS_TAIL = `  - type: input
    id: license
    attributes:
      label: License
      description: SPDX id, e.g. MIT
  - type: input
    id: github
    attributes:
      label: GitHub
      description: https://github.com/... repo
`;

function renderDropdownTemplate(): string {
  const categoryOptions = optionLines(
    taxonomy.categories.map((category) => category.name),
  );
  const tagOptions = optionLines(taxonomy.tags);

  return `name: Submit a listing
description: Suggest an AI tool, framework, library, or model for nanolist.
title: "[Listing]: "
labels: ["listing-submission"]
body:
${POLICY_MARKDOWN}
${FREE_TEXT_FIELDS_HEAD}
  - type: dropdown
    id: categories
    attributes:
      label: Categories
      description: Pick one to three categories that fit best.
      multiple: true
      options:
${categoryOptions}
    validations:
      required: true
  - type: dropdown
    id: tags
    attributes:
      label: Tags
      description: Pick up to 8
      multiple: true
      options:
${tagOptions}
  - type: checkboxes
    id: attributes
    attributes:
      label: Attributes
      description: Tick every attribute that honestly applies.
      options:
        - label: Open source
        - label: Local-first (runs fully on your machine)
        - label: Privacy-first (no required cloud or telemetry)
        - label: Self-hostable
  - type: dropdown
    id: pricing
    attributes:
      label: Pricing
      options:
        - free
        - freemium
        - paid
        - open-source
    validations:
      required: true
${FREE_TEXT_FIELDS_TAIL}`;
}

// GitHub can only prefill `input`/`textarea` fields via /issues/new query
// params, so every structured field becomes an input here. Same field ids and
// order as the dropdown template so both parse with the same pipeline.
function renderWebTemplate(): string {
  return `name: Submit a listing (via website form)
description: For submissions prefilled by the website form at list.nanocollective.org/submit — values are validated automatically. Filling this out by hand? Use "Submit a listing" instead.
title: "[Listing]: "
labels: ["listing-submission", "via-website"]
body:
${POLICY_MARKDOWN}
${FREE_TEXT_FIELDS_HEAD}
  - type: input
    id: categories
    attributes:
      label: Categories
      description: Comma-separated category keys — filled by the website form.
    validations:
      required: true
  - type: input
    id: tags
    attributes:
      label: Tags
      description: Comma-separated accepted tags — filled by the website form.
  - type: input
    id: attributes
    attributes:
      label: Attributes
      description: "Comma-separated, from: open-source, local-first, privacy-first, self-hostable."
  - type: input
    id: pricing
    attributes:
      label: Pricing
      description: "One of: free, freemium, paid, open-source."
    validations:
      required: true
${FREE_TEXT_FIELDS_TAIL}`;
}

const TEMPLATES: Array<{ file: string; render: () => string }> = [
  { file: "submit-listing.yml", render: renderDropdownTemplate },
  { file: "submit-listing-web.yml", render: renderWebTemplate },
];

function main(): void {
  const check = process.argv.includes("--check");
  let stale = false;

  for (const { file, render } of TEMPLATES) {
    const target = path.join(TEMPLATE_DIR, file);
    const rendered = render();

    if (check) {
      const onDisk = fs.existsSync(target)
        ? fs.readFileSync(target, "utf8")
        : null;
      if (onDisk !== rendered) {
        console.error(
          `.github/ISSUE_TEMPLATE/${file} is stale — run pnpm generate:issue-template`,
        );
        stale = true;
      }
      continue;
    }

    fs.writeFileSync(target, rendered);
    console.log(`✓ wrote ${path.relative(process.cwd(), target)}`);
  }

  if (check) {
    if (stale) process.exit(1);
    console.log("✓ issue templates are in sync with data/taxonomy.json");
  }
}

main();
