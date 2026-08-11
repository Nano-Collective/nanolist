import { z } from "zod";

export const CATEGORY_KEYS = [
  "chat-assistants",
  "image-generation",
  "video-generation",
  "audio-voice",
  "writing",
  "productivity",
  "search-knowledge",
  "coding-assistants",
  "agent-frameworks",
  "open-models",
  "local-inference",
  "llm-libraries",
  "evals-observability",
  "vector-databases",
  "fine-tuning",
  "model-serving",
  "compute",
  "learning-resources",
] as const;

export const categoryKeySchema = z.enum(CATEGORY_KEYS);
export type CategoryKey = z.infer<typeof categoryKeySchema>;

export const categorySchema = z.object({
  key: categoryKeySchema,
  name: z.string(),
  group: z.string(),
  description: z.string(),
});
export type Category = z.infer<typeof categorySchema>;

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Private / local hostnames and IP ranges that are never valid listing URLs. */
const PRIVATE_HOST =
  /^(localhost|127\.|10\.|0\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

function isPublicHttpsUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (PRIVATE_HOST.test(host)) return false;
  if (!host.includes(".")) return false;
  return true;
}

function isGithubUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === "https:" && parsed.hostname === "github.com";
}

export const listingSchema = z
  .object({
    slug: z.string().regex(KEBAB_CASE).max(60),
    name: z.string().min(1).max(60),
    description: z
      .string()
      .min(10)
      .max(300)
      .refine(
        (value) =>
          !value.includes("<") &&
          !value.includes(">") &&
          !value.toLowerCase().includes("javascript:"),
        {
          message:
            'Description must not contain "<" or ">" characters or "javascript:" substrings',
        },
      ),
    url: z.string().refine(isPublicHttpsUrl, {
      message:
        "URL must be a valid https:// URL with a public hostname (no localhost or private IP ranges)",
    }),
    author: z.string().min(1).max(80),
    categories: z.array(categoryKeySchema).min(1).max(3),
    tags: z.array(z.string().regex(KEBAB_CASE)).max(8).default([]),
    attributes: z.object({
      openSource: z.boolean(),
      localFirst: z.boolean(),
      privacyFirst: z.boolean(),
      selfHostable: z.boolean(),
    }),
    pricing: z.enum(["free", "freemium", "paid", "open-source"]),
    license: z.string().max(40).nullable(),
    github: z
      .string()
      .refine(isGithubUrl, {
        message: "GitHub URL must be a valid https://github.com/... URL",
      })
      .nullable(),
    icon: z
      .string()
      .regex(/^\/icons\/[a-z0-9-]+\.(png|ico|jpg|jpeg|gif|webp)$/)
      .nullable(),
    submittedBy: z.string().max(40).nullable(),
    addedAt: z.string().regex(ISO_DATE, {
      message: "addedAt must be an ISO date (YYYY-MM-DD)",
    }),
    recommendedAt: z
      .string()
      .regex(ISO_DATE, {
        message: "recommendedAt must be an ISO date (YYYY-MM-DD)",
      })
      .nullable(),
    status: z.enum(["active", "archived"]),
  })
  .strict();
export type Listing = z.infer<typeof listingSchema>;
