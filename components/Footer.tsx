import Link from "next/link";

const footerLinks = [
  { href: "https://nanocollective.org", label: "Nano Collective" },
  { href: "https://discord.gg/ktPDV6rekE", label: "Discord" },
  { href: "https://github.com/Nano-Collective/nanolist", label: "GitHub" },
  {
    href: "https://github.com/Nano-Collective/nanolist/blob/main/LICENSE.md",
    label: "MIT License",
  },
];

export function Footer() {
  return (
    <footer className="border-t-2 border-foreground/20 bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-sm">
            <Link
              href="/"
              className="font-bold text-2xl tracking-tight flex items-center gap-2 text-foreground mb-4"
            >
              Nanolist
            </Link>
            <p className="text-sm text-foreground/70 font-mono leading-relaxed">
              A community-curated directory of AI tools by the Nano Collective.
              Biased toward open-source, local-first, privacy-respecting
              software.
            </p>
          </div>
          <div className="min-w-[180px]">
            <h4 className="font-bold text-sm text-foreground mb-4 font-mono tracking-wide uppercase border-b border-foreground/20 pb-2 inline-block">
              Links
            </h4>
            <ul className="space-y-3 font-mono text-sm text-foreground/70">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-foreground/60 font-mono">
          <p>
            © {new Date().getFullYear()} Nano Collective. Released under the MIT
            license.
          </p>
          <p>[ curated by humans ]</p>
        </div>
      </div>
    </footer>
  );
}
