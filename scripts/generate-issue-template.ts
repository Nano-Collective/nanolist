// CLI: renders .github/ISSUE_TEMPLATE/submit-listing.yml from
// data/taxonomy.json so the issue form can never drift from the taxonomy.
//
//   pnpm generate:issue-template          write the template to disk
//   tsx scripts/generate-issue-template.ts --check
//                                         exit 1 if the file on disk is stale
//
// Output is deterministic: options follow taxonomy order, trailing newline.
import fs from "node:fs";
import path from "node:path";
import taxonomy from "@/data/taxonomy.json";

const TEMPLATE_FILE = path.join(
  process.cwd(),
  ".github",
  "ISSUE_TEMPLATE",
  "submit-listing.yml",
);

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

function renderTemplate(): string {
  const categoryOptions = optionLines(
    taxonomy.categories.map((category) => category.name),
  );
  const tagOptions = optionLines(taxonomy.tags);

  return `name: Submit a listing
description: Suggest an AI tool, framework, library, or model for nanolist.
title: "[Listing]: "
labels: ["listing-submission"]
body:
  - type: markdown
    attributes:
      value: |
        ## Submission policy

        Nanolist accepts any real AI tool — product, framework, library, or
        model. Listings must be live, publicly accessible, and honestly
        described. We especially welcome tools that align with the Nano
        Collective's values: open source, local-first, and privacy-respecting
        — those are eligible for a Recommended badge from our curators.

        **Not accepted:** affiliate or tracking links, self-promotional spam,
        duplicates, vaporware, or listings that misrepresent what a tool does.
  - type: input
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
      required: true
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
  - type: input
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
}

function main(): void {
  const check = process.argv.includes("--check");
  const rendered = renderTemplate();

  if (check) {
    const onDisk = fs.existsSync(TEMPLATE_FILE)
      ? fs.readFileSync(TEMPLATE_FILE, "utf8")
      : null;
    if (onDisk !== rendered) {
      console.error(
        ".github/ISSUE_TEMPLATE/submit-listing.yml is stale — run pnpm generate:issue-template",
      );
      process.exit(1);
    }
    console.log("✓ issue template is in sync with data/taxonomy.json");
    return;
  }

  fs.writeFileSync(TEMPLATE_FILE, rendered);
  console.log(`✓ wrote ${path.relative(process.cwd(), TEMPLATE_FILE)}`);
}

main();
