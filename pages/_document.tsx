import { Head, Html, Main, NextScript } from "next/document";

// Pre-hydration theme script: reads localStorage "theme", falls back to
// prefers-color-scheme, and sets the `dark` class on <html> before hydration.
const themeScript = `
  (function() {
    let theme = null;
    try {
      theme = localStorage.getItem('theme');
    } catch (e) {}
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (theme !== 'light' && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  })();
`;

export default function Document() {
  return (
    <Html lang="en" className="scroll-smooth">
      <Head>
        {/* Icons / Manifest */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon-96x96.png"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* OpenGraph */}
        <meta property="og:site_name" content="Nanolist" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/og-image.png" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />

        {/* Feeds */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Nanolist RSS Feed"
          href="/feed.xml"
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          title="Nanolist Atom Feed"
          href="/feed.atom"
        />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Nanolist",
              description:
                "A browsable, community-curated directory of AI tools — with a bias toward open-source, local-first, privacy-respecting software. By the Nano Collective.",
              publisher: {
                "@type": "Organization",
                name: "Nano Collective",
                url: "https://nanocollective.org",
                sameAs: [
                  "https://github.com/Nano-Collective",
                  "https://discord.gg/ktPDV6rekE",
                ],
              },
            }),
          }}
        />
      </Head>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
