import type { GetStaticProps } from "next";
import Head from "next/head";
import { Footer } from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { RecommendedBadge } from "@/components/RecommendedBadge";
import { SubmitForm } from "@/components/SubmitForm";
import { getCategoryCounts } from "@/lib/listings";

const GITHUB_FORM_URL =
  "https://github.com/Nano-Collective/nanolist/issues/new?template=submit-listing.yml";

const FLOW_STEPS = [
  {
    title: "Fill in the form below",
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

          <p className="mt-6 text-base sm:text-lg leading-relaxed text-foreground/80">
            Nanolist accepts any real AI tool — product, framework, library, or
            model. Listings must be live, publicly accessible, and honestly
            described.
          </p>

          <div className="mt-8 border-2 border-[#0000EE] dark:border-[#A1A1AA] bg-muted p-6 shadow-[4px_4px_0px_0px_rgba(0,0,238,1)] dark:shadow-[4px_4px_0px_0px_#A1A1AA]">
            <p className="text-sm sm:text-base leading-relaxed text-foreground/80">
              We especially welcome tools that align with the Nano
              Collective&apos;s values:{" "}
              <strong className="text-foreground">open source</strong>,{" "}
              <strong className="text-foreground">local-first</strong>, and{" "}
              <strong className="text-foreground">privacy-respecting</strong> —
              those are eligible for a <RecommendedBadge /> badge from our
              curators.
            </p>
          </div>

          <section className="mt-10">
            <h2 className="font-bold text-sm text-foreground mb-4 font-mono tracking-wide uppercase border-b border-foreground/20 pb-2 inline-block">
              Not accepted
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-foreground/70">
              Affiliate or tracking links, self-promotional spam, duplicates,
              vaporware, or listings that misrepresent what a tool does.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="font-bold text-sm text-foreground mb-6 font-mono tracking-wide uppercase border-b border-foreground/20 pb-2 inline-block">
              How it works
            </h2>
            <ol className="space-y-4">
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
          </section>

          <section className="mt-10">
            <h2 className="font-bold text-sm text-foreground mb-6 font-mono tracking-wide uppercase border-b border-foreground/20 pb-2 inline-block">
              Your listing
            </h2>
            <SubmitForm />
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
