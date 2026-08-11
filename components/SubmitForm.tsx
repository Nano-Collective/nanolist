import { ExternalLink } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import taxonomy from "@/data/taxonomy.json";
import { listingSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";

// The website form validates a listing with the real shared schema, then opens
// a prefilled GitHub issue. GitHub can only prefill input/textarea fields via
// /issues/new query params, so this targets the all-input web template.
const ISSUE_BASE_URL = "https://github.com/Nano-Collective/nanolist/issues/new";
const WEB_TEMPLATE = "submit-listing-web.yml";

/** GitHub truncates prefill URLs at 8,191 bytes; stay comfortably under. */
const MAX_URL_LENGTH = 7500;

const MAX_CATEGORIES = 3;
const MAX_TAGS = 8;

const ATTRIBUTE_OPTIONS = [
  ["openSource", "open-source", "Open source"],
  ["localFirst", "local-first", "Local-first"],
  ["privacyFirst", "privacy-first", "Privacy-first"],
  ["selfHostable", "self-hostable", "Self-hostable"],
] as const;

type AttributeKey = (typeof ATTRIBUTE_OPTIONS)[number][0];

const PRICING_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "paid", label: "Paid" },
  { value: "open-source", label: "Open source" },
] as const;

/** Constant, friendly per-field messages shown instead of raw zod output. */
const FIELD_MESSAGES: Record<string, string> = {
  name: "Name must be 1–60 characters.",
  slug: "Name must contain at least one letter or number.",
  url: "Must be a public https:// URL (no localhost or private addresses).",
  description:
    "Description must be 10–300 plain-text characters, without < or > characters or javascript: links.",
  author: "Author must be 1–80 characters.",
  categories: "Choose between 1 and 3 categories.",
  tags: "Choose up to 8 tags from the list.",
  pricing: "Choose a pricing model.",
  license: "License must be an SPDX identifier of at most 40 characters.",
  github: "Must be an https://github.com/... URL.",
};

/** kebab-case slug from the listing name; mirrors scripts/parse-submission.ts. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface FormValues {
  name: string;
  url: string;
  author: string;
  description: string;
  categories: string[];
  tags: string[];
  attributes: Record<AttributeKey, boolean>;
  pricing: string;
  license: string;
  github: string;
}

const INITIAL_VALUES: FormValues = {
  name: "",
  url: "",
  author: "",
  description: "",
  categories: [],
  tags: [],
  attributes: {
    openSource: false,
    localFirst: false,
    privacyFirst: false,
    selfHostable: false,
  },
  pricing: "",
  license: "",
  github: "",
};

/** Group categories by their `group` field, preserving taxonomy order. */
function groupedCategories() {
  const groups: Array<[string, typeof taxonomy.categories]> = [];
  for (const category of taxonomy.categories) {
    const existing = groups.find(([name]) => name === category.group);
    if (existing) {
      existing[1].push(category);
    } else {
      groups.push([category.group, [category]]);
    }
  }
  return groups;
}

function validate(values: FormValues): Record<string, string> {
  const candidate = {
    slug: slugify(values.name.trim()),
    name: values.name.trim(),
    description: values.description.trim(),
    url: values.url.trim(),
    author: values.author.trim(),
    categories: values.categories,
    tags: values.tags,
    attributes: values.attributes,
    pricing: values.pricing,
    license: values.license.trim() === "" ? null : values.license.trim(),
    github: values.github.trim() === "" ? null : values.github.trim(),
    icon: null,
    submittedBy: null,
    addedAt: new Date().toISOString().slice(0, 10),
    recommendedAt: null,
    status: "active",
  };

  const result = listingSchema.safeParse(candidate);
  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : "form";
    // A slug problem is really a name problem from the user's point of view.
    const target = field === "slug" ? "name" : field;
    if (!errors[target]) {
      errors[target] =
        FIELD_MESSAGES[field] ?? "This field has an invalid value.";
    }
  }
  return errors;
}

function buildIssueUrl(values: FormValues): string {
  const attributeTokens = ATTRIBUTE_OPTIONS.filter(
    ([key]) => values.attributes[key],
  ).map(([, token]) => token);

  const params: Array<[string, string]> = [
    ["template", WEB_TEMPLATE],
    ["name", values.name.trim()],
    ["url", values.url.trim()],
    ["description", values.description.trim()],
    ["author", values.author.trim()],
    ["categories", values.categories.join(",")],
    ["tags", values.tags.join(",")],
    ["attributes", attributeTokens.join(",")],
    ["pricing", values.pricing],
    ["license", values.license.trim()],
    ["github", values.github.trim()],
  ];

  const query = params
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `${ISSUE_BASE_URL}?${query}`;
}

const inputClasses =
  "h-10 w-full border border-foreground/20 bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground transition-colors hover:border-foreground/40 focus-visible:border-[#0000EE] focus-visible:outline-none dark:focus-visible:border-[#A1A1AA]";

const labelClasses =
  "block font-mono text-xs font-semibold uppercase tracking-wide text-foreground";

const legendClasses =
  "font-mono text-xs font-semibold uppercase tracking-wide text-foreground";

const hintClasses = "mt-1 text-xs text-muted-foreground";

function chipClasses(selected: boolean, disabled: boolean): string {
  return cn(
    "border px-2.5 py-1.5 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    selected
      ? "border-[#0000EE] bg-[#0000EE] font-bold text-white dark:border-[#A1A1AA] dark:bg-[#A1A1AA] dark:text-black"
      : "border-foreground/20 bg-background text-foreground/70 hover:border-foreground hover:text-foreground",
    disabled && "cursor-not-allowed opacity-40 hover:border-foreground/20",
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-red-600">
      {message}
    </p>
  );
}

export function SubmitForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);
  const [tooLong, setTooLong] = useState(false);
  const [tagFilter, setTagFilter] = useState("");

  const errors = useMemo(() => validate(values), [values]);
  const groups = useMemo(groupedCategories, []);

  const showError = (field: string): string | undefined =>
    touched[field] || submitAttempted ? errors[field] : undefined;

  const setField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setIssueUrl(null);
    setTooLong(false);
  };

  const markTouched = (field: string) =>
    setTouched((previous) => ({ ...previous, [field]: true }));

  const toggleCategory = (key: string) => {
    markTouched("categories");
    setField(
      "categories",
      values.categories.includes(key)
        ? values.categories.filter((item) => item !== key)
        : values.categories.length < MAX_CATEGORIES
          ? [...values.categories, key]
          : values.categories,
    );
  };

  const toggleTag = (tag: string) => {
    markTouched("tags");
    setField(
      "tags",
      values.tags.includes(tag)
        ? values.tags.filter((item) => item !== tag)
        : values.tags.length < MAX_TAGS
          ? [...values.tags, tag]
          : values.tags,
    );
  };

  const toggleAttribute = (key: AttributeKey) => {
    setField("attributes", {
      ...values.attributes,
      [key]: !values.attributes[key],
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0) return;

    const url = buildIssueUrl(values);
    if (url.length > MAX_URL_LENGTH) {
      setTooLong(true);
      setIssueUrl(null);
      return;
    }
    setTooLong(false);
    setIssueUrl(url);
    window.open(url, "_blank", "noopener");
  };

  const filteredTags = taxonomy.tags.filter((tag) =>
    tag.toLowerCase().includes(tagFilter.trim().toLowerCase()),
  );

  const categoriesAtCap = values.categories.length >= MAX_CATEGORIES;
  const tagsAtCap = values.tags.length >= MAX_TAGS;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* --- Basics ------------------------------------------------------- */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="submit-name" className={labelClasses}>
            Name *
          </label>
          <input
            id="submit-name"
            type="text"
            autoComplete="off"
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
            onBlur={() => markTouched("name")}
            aria-invalid={showError("name") ? true : undefined}
            aria-describedby={
              showError("name") ? "submit-name-error" : undefined
            }
            className={cn(inputClasses, "mt-2")}
          />
          <FieldError id="submit-name-error" message={showError("name")} />
        </div>
        <div>
          <label htmlFor="submit-author" className={labelClasses}>
            Author *
          </label>
          <input
            id="submit-author"
            type="text"
            autoComplete="off"
            placeholder="Who makes it"
            value={values.author}
            onChange={(event) => setField("author", event.target.value)}
            onBlur={() => markTouched("author")}
            aria-invalid={showError("author") ? true : undefined}
            aria-describedby={
              showError("author") ? "submit-author-error" : undefined
            }
            className={cn(inputClasses, "mt-2")}
          />
          <FieldError id="submit-author-error" message={showError("author")} />
        </div>
      </div>

      <div>
        <label htmlFor="submit-url" className={labelClasses}>
          URL *
        </label>
        <input
          id="submit-url"
          type="url"
          autoComplete="off"
          placeholder="https://"
          value={values.url}
          onChange={(event) => setField("url", event.target.value)}
          onBlur={() => markTouched("url")}
          aria-invalid={showError("url") ? true : undefined}
          aria-describedby={showError("url") ? "submit-url-error" : undefined}
          className={cn(inputClasses, "mt-2")}
        />
        <FieldError id="submit-url-error" message={showError("url")} />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="submit-description" className={labelClasses}>
            Description *
          </label>
          <span
            id="submit-description-count"
            aria-live="polite"
            className={cn(
              "font-mono text-xs",
              values.description.length > 300
                ? "font-bold text-red-600"
                : "text-muted-foreground",
            )}
          >
            {values.description.length}/300
          </span>
        </div>
        <textarea
          id="submit-description"
          rows={4}
          value={values.description}
          onChange={(event) => setField("description", event.target.value)}
          onBlur={() => markTouched("description")}
          aria-invalid={showError("description") ? true : undefined}
          aria-describedby={cn(
            "submit-description-count",
            showError("description") && "submit-description-error",
          )}
          className={cn(
            inputClasses,
            "mt-2 h-auto min-h-24 resize-y py-2 leading-relaxed",
          )}
        />
        <p className={hintClasses}>
          10&ndash;300 characters of plain text — what the tool does, honestly.
        </p>
        <FieldError
          id="submit-description-error"
          message={showError("description")}
        />
      </div>

      {/* --- Categories --------------------------------------------------- */}
      <fieldset>
        <legend className={legendClasses}>
          Categories * ({values.categories.length}/{MAX_CATEGORIES})
        </legend>
        <p className={hintClasses}>
          Pick one to three categories that fit best.
        </p>
        <div className="mt-3 space-y-4">
          {groups.map(([groupName, items]) => (
            <div key={groupName}>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {groupName}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {items.map((category) => {
                  const selected = values.categories.includes(category.key);
                  const disabled = !selected && categoriesAtCap;
                  return (
                    <button
                      key={category.key}
                      type="button"
                      aria-pressed={selected}
                      disabled={disabled}
                      title={category.description}
                      onClick={() => toggleCategory(category.key)}
                      className={chipClasses(selected, disabled)}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <FieldError
          id="submit-categories-error"
          message={showError("categories")}
        />
      </fieldset>

      {/* --- Tags --------------------------------------------------------- */}
      <fieldset>
        <legend className={legendClasses}>
          Tags ({values.tags.length}/{MAX_TAGS})
        </legend>
        <p className={hintClasses}>Optional — pick up to 8.</p>
        <div className="mt-3">
          <label htmlFor="submit-tag-filter" className="sr-only">
            Filter tags
          </label>
          <input
            id="submit-tag-filter"
            type="search"
            autoComplete="off"
            placeholder="Filter tags..."
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            className={cn(inputClasses, "max-w-xs")}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {filteredTags.map((tag) => {
            const selected = values.tags.includes(tag);
            const disabled = !selected && tagsAtCap;
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => toggleTag(tag)}
                className={chipClasses(selected, disabled)}
              >
                {tag}
              </button>
            );
          })}
          {filteredTags.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No tags match that filter.
            </p>
          )}
        </div>
        <FieldError id="submit-tags-error" message={showError("tags")} />
      </fieldset>

      {/* --- Attributes --------------------------------------------------- */}
      <fieldset>
        <legend className={legendClasses}>Attributes</legend>
        <p className={hintClasses}>
          Tick every attribute that honestly applies.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ATTRIBUTE_OPTIONS.map(([key, , label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={values.attributes[key]}
              onClick={() => toggleAttribute(key)}
              className={chipClasses(values.attributes[key], false)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* --- Pricing, license, github ------------------------------------- */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="submit-pricing" className={labelClasses}>
            Pricing *
          </label>
          <select
            id="submit-pricing"
            value={values.pricing}
            onChange={(event) => setField("pricing", event.target.value)}
            onBlur={() => markTouched("pricing")}
            aria-invalid={showError("pricing") ? true : undefined}
            aria-describedby={
              showError("pricing") ? "submit-pricing-error" : undefined
            }
            className={cn(inputClasses, "mt-2")}
          >
            <option value="">Select...</option>
            {PRICING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError
            id="submit-pricing-error"
            message={showError("pricing")}
          />
        </div>
        <div>
          <label htmlFor="submit-license" className={labelClasses}>
            License
          </label>
          <input
            id="submit-license"
            type="text"
            autoComplete="off"
            placeholder="MIT"
            value={values.license}
            onChange={(event) => setField("license", event.target.value)}
            onBlur={() => markTouched("license")}
            aria-invalid={showError("license") ? true : undefined}
            aria-describedby={
              showError("license") ? "submit-license-error" : undefined
            }
            className={cn(inputClasses, "mt-2")}
          />
          <FieldError
            id="submit-license-error"
            message={showError("license")}
          />
        </div>
        <div>
          <label htmlFor="submit-github" className={labelClasses}>
            GitHub
          </label>
          <input
            id="submit-github"
            type="url"
            autoComplete="off"
            placeholder="https://github.com/..."
            value={values.github}
            onChange={(event) => setField("github", event.target.value)}
            onBlur={() => markTouched("github")}
            aria-invalid={showError("github") ? true : undefined}
            aria-describedby={
              showError("github") ? "submit-github-error" : undefined
            }
            className={cn(inputClasses, "mt-2")}
          />
          <FieldError id="submit-github-error" message={showError("github")} />
        </div>
      </div>

      {/* --- Submit -------------------------------------------------------- */}
      <div className="border-t border-foreground/20 pt-6">
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-3 rounded-none bg-[#0000EE] px-8 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-[#0000EE]/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
        >
          Continue on GitHub
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className={cn(hintClasses, "mt-3")}>
          This opens a prefilled GitHub issue in a new tab — you need a GitHub
          account. Review the values there, then press{" "}
          <strong className="text-foreground">Submit new issue</strong> to
          finish. Nothing is sent anywhere until you do.
        </p>

        {submitAttempted && Object.keys(errors).length > 0 && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            Some fields need attention — check the messages above.
          </p>
        )}

        {tooLong && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            This submission is too long to prefill a GitHub issue — please
            shorten the description.
          </p>
        )}

        {issueUrl && (
          <p className="mt-3 text-sm text-foreground/80">
            Didn&apos;t open?{" "}
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0000EE] underline dark:text-[#A1A1AA]"
            >
              Open the prefilled GitHub issue
            </a>
            .
          </p>
        )}
      </div>
    </form>
  );
}
