import { Github } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Directory" },
  { href: "/submit", label: "Submit" },
];

export default function Navbar() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-primary dark:hover:text-[#A1A1AA]"
        >
          <span className="font-mono font-bold text-[#0000EE] dark:text-[#A1A1AA]">
            &gt;
          </span>
          <span className="text-lg">Nanolist</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-4 sm:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary dark:hover:text-[#A1A1AA]",
                  router.pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/Nano-Collective/nanolist"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-all duration-300 hover:border-border hover:bg-muted/50 hover:text-foreground"
              aria-label="Nanolist on GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
