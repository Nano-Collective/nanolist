import { Check, X } from "lucide-react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import { Footer } from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { RecommendedBadge } from "@/components/RecommendedBadge";
import { SubmitForm } from "@/components/SubmitForm";
import { getCategoryCounts } from "@/lib/listings";

const GITHUB_FORM_URL =
  "https://github.com/Nano-Collective/nanolist/issues/new?template=submit-listing.yml";

const ACCEPTED = [
  "Real, working AI tools — products, frameworks, libraries, models",
  "Live and publicly accessible",
  "Honestly described",
];

const NOT_ACCEPTED = [
  "Affiliate or tracking links",
  "Self-promotional spam or duplicates",
  "Vaporware or misrepresented tools",
];

const FLOW_STEPS = [
  {
    title: "Fill in the form",
    body: "It validates your listing as you type, then opens a prefilled GitHub issue — you review it there and press Submit.",
  },
  {
    title: "Automatic validation",
    body: "A bot checks your submission and comments on the issue if anything needs fixing.",
  },
  {
    title: "Maintainer approval",
    body: "A maintainer reviews the listing and approves it with /approve, which creates a pull request automatically.",
  },
  {
    title: "Review and merge",
    body: "Once the pull request is reviewed and merged, the site republishes with your listing included.",
  },
];

const STEPPER_LABELS = [
  "Fill in the form",
  "Bot validates",
  "Maintainer approves",
  "Live on the site",
];

interface SubmitPageProps {
  categoryCounts: Record<string, number>;
}

export default function SubmitPage({ categoryCounts }: SubmitPageProps) {
  return (
    <>
      <Head>
        <title>Submit a listing — Nanolist</title>
        <meta
          name="description"
          content="Suggest an AI tool for the Nanolist directory. Fill in the submission form and it opens a prefilled GitHub issue for maintainer review."
        />
        <meta property="og:title" content="Submit a listing — Nanolist" />
        <meta
          property="og:description"
          content="Suggest an AI tool for the Nanolist directory. Fill in the submission form and it opens a prefilled GitHub issue for maintainer review."
        />
      </Head>
      <div className="min-h-screen bg-background font-sans">
        <Navbar categoryCounts={categoryCounts} />
        <main className="container mx-auto max-w-3xl px-4 md:px-6 py-12">
          <div className="flex items-center gap-2 text-xs font-semibold font-mono text-muted-foreground uppercase tracking-widest border-b border-foreground/20 pb-2 max-w-[220px]">
            <span className="text-[#0000EE] dark:text-[#A1A1AA] font-bold">
              &gt;
            </span>
            Contribute
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Submit a listing
          </h1>

          <p className="mt-4 text-base sm:text-lg leading-relaxed text-foreground/80">
            Suggest any real AI tool — product, framework, library, or model —
            for the directory. It takes about two minutes.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-foreground border-b border-foreground/20 pb-2">
                Accepted
              </h2>
              <ul className="mt-3 space-y-2">
                {ACCEPTED.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-relaxed text-foreground/80"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#0000EE] dark:text-[#A1A1AA]"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-foreground border-b border-foreground/20 pb-2">
                Not accepted
              </h2>
              <ul className="mt-3 space-y-2">
                {NOT_ACCEPTED.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-relaxed text-foreground/80"
                  >
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-8 border-l-2 border-[#0000EE] dark:border-[#A1A1AA] bg-muted px-4 py-3 text-sm leading-relaxed text-foreground/80">
            Open source, local-first, or privacy-respecting? Your tool may earn
            a <RecommendedBadge /> badge from our curators.
          </p>

          <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-foreground/80">
            {STEPPER_LABELS.map((label, index) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="font-bold text-[#0000EE] dark:text-[#A1A1AA]">
                    [{index + 1}]
                  </span>
                  {label}
                </span>
                {index < STEPPER_LABELS.length - 1 && (
                  <span aria-hidden="true" className="text-muted-foreground">
                    &rarr;
                  </span>
                )}
              </li>
            ))}
          </ol>

          <details className="mt-3">
            <summary className="cursor-pointer font-mono text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground">
              What happens after I submit?
            </summary>
            <ol className="mt-4 space-y-4">
              {FLOW_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-4 border border-foreground/20 bg-background p-4"
                >
                  <span className="font-mono text-sm font-bold text-[#0000EE] dark:text-[#A1A1AA]">
                    [{index + 1}]
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </details>

          <section className="mt-10 border-2 border-[#0000EE] dark:border-[#A1A1AA] bg-background shadow-[4px_4px_0px_0px_rgba(0,0,238,1)] dark:shadow-[4px_4px_0px_0px_#A1A1AA]">
            <div className="flex items-baseline justify-between gap-4 bg-[#0000EE] px-6 py-3 dark:bg-[#A1A1AA]">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white dark:text-black">
                Your listing
              </h2>
              <span className="font-mono text-xs text-white/80 dark:text-black/70">
                ~2 minutes
              </span>
            </div>
            <div className="p-6">
              <SubmitForm />
            </div>
          </section>

          <p className="mt-10 border-t border-foreground/20 pt-6 text-sm text-foreground/70">
            Prefer GitHub directly? Use the{" "}
            <a
              href={GITHUB_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0000EE] underline dark:text-[#A1A1AA]"
            >
              Submit a listing issue form
            </a>{" "}
            instead — it collects the same information.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<SubmitPageProps> = async () => {
  return { props: { categoryCounts: getCategoryCounts() } };
};
