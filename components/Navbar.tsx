import { ChevronDown, Github, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import taxonomy from "@/data/taxonomy.json";
import { cn } from "@/lib/utils";

type TaxonomyCategory = (typeof taxonomy.categories)[number];

// Categories grouped by their `group` field, preserving file order.
const categoryGroups: Array<[string, TaxonomyCategory[]]> = [];
for (const category of taxonomy.categories) {
  const existing = categoryGroups.find(([name]) => name === category.group);
  if (existing) {
    existing[1].push(category);
  } else {
    categoryGroups.push([category.group, [category]]);
  }
}

interface GroupColors {
  heading: string;
  dot: string;
  hover: string;
}

const GROUP_COLORS: Record<string, GroupColors> = {
  "Assistants & Chat": {
    heading: "text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
    hover: "hover:bg-violet-500/10",
  },
  "Media Generation": {
    heading: "text-fuchsia-700 dark:text-fuchsia-400",
    dot: "bg-fuchsia-500",
    hover: "hover:bg-fuchsia-500/10",
  },
  "Writing & Productivity": {
    heading: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    hover: "hover:bg-amber-500/10",
  },
  "Search & Knowledge": {
    heading: "text-cyan-700 dark:text-cyan-400",
    dot: "bg-cyan-500",
    hover: "hover:bg-cyan-500/10",
  },
  "Coding & Agents": {
    heading: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    hover: "hover:bg-emerald-500/10",
  },
  "Models & Runtimes": {
    heading: "text-indigo-700 dark:text-indigo-400",
    dot: "bg-indigo-500",
    hover: "hover:bg-indigo-500/10",
  },
  "Developer Libraries": {
    heading: "text-teal-700 dark:text-teal-400",
    dot: "bg-teal-500",
    hover: "hover:bg-teal-500/10",
  },
  Infrastructure: {
    heading: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
    hover: "hover:bg-orange-500/10",
  },
  "Learning & Resources": {
    heading: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
    hover: "hover:bg-rose-500/10",
  },
};

const DEFAULT_GROUP_COLORS: GroupColors = {
  heading: "text-muted-foreground",
  dot: "bg-muted-foreground",
  hover: "hover:bg-muted",
};

function groupColors(group: string): GroupColors {
  return GROUP_COLORS[group] ?? DEFAULT_GROUP_COLORS;
}

interface CategoryLinkProps {
  category: TaxonomyCategory;
  count: number;
  showDescription: boolean;
  onNavigate: () => void;
}

function CategoryLink({
  category,
  count,
  showDescription,
  onNavigate,
}: CategoryLinkProps) {
  const colors = groupColors(category.group);
  return (
    <Link
      href={{ pathname: "/", query: { category: category.key } }}
      onClick={onNavigate}
      className={cn(
        "flex items-start gap-2.5 p-2 transition-colors",
        colors.hover,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("mt-1.5 h-2 w-2 shrink-0", colors.dot)}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-foreground">
          {category.name}
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {count}
          </span>
        </span>
        {showDescription && (
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
            {category.description}
          </span>
        )}
      </span>
    </Link>
  );
}

const navLinkClasses = (active: boolean) =>
  cn(
    "text-sm font-medium transition-colors hover:text-primary dark:hover:text-[#A1A1AA]",
    active ? "text-foreground" : "text-muted-foreground",
  );

interface NavbarProps {
  /** Active-listing count per category key, from getCategoryCounts(). */
  categoryCounts: Record<string, number>;
}

export default function Navbar({ categoryCounts }: NavbarProps) {
  const router = useRouter();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const closeMenus = useCallback(() => {
    setCategoriesOpen(false);
    setMobileOpen(false);
  }, []);

  // Close on navigation, including shallow category-filter changes.
  useEffect(() => {
    router.events.on("routeChangeComplete", closeMenus);
    return () => router.events.off("routeChangeComplete", closeMenus);
  }, [router.events, closeMenus]);

  // Close on Escape or on any press outside the header.
  useEffect(() => {
    if (!categoriesOpen && !mobileOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) closeMenus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [categoriesOpen, mobileOpen, closeMenus]);

  const categoryFilterActive =
    router.pathname === "/" && typeof router.query.category === "string";

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md"
    >
      <div className="container relative mx-auto flex h-14 items-center justify-between px-4 md:px-6">
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
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className={navLinkClasses(router.pathname === "/")}>
              Directory
            </Link>
            <button
              type="button"
              aria-expanded={categoriesOpen}
              aria-controls="categories-menu"
              onClick={() => setCategoriesOpen((open) => !open)}
              className={cn(
                "flex items-center gap-1",
                navLinkClasses(categoriesOpen || categoryFilterActive),
              )}
            >
              Categories
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  categoriesOpen && "rotate-180",
                )}
              />
            </button>
            <Link
              href="/submit"
              className={navLinkClasses(router.pathname === "/submit")}
            >
              Submit
            </Link>
          </nav>
          <div className="hidden w-px h-4 bg-border md:block" />
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
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-all duration-300 hover:border-border hover:bg-muted/50 hover:text-foreground md:hidden"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop mega dropdown: all categories, grouped and colour-coded. */}
      {categoriesOpen && (
        <div
          id="categories-menu"
          className="absolute inset-x-0 top-full hidden max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-b border-foreground/20 bg-background shadow-lg md:block"
        >
          <div className="container mx-auto grid gap-x-8 gap-y-7 px-4 py-7 md:grid-cols-3 md:px-6 xl:grid-cols-5">
            {categoryGroups.map(([groupName, items]) => (
              <div key={groupName}>
                <p
                  className={cn(
                    "mb-2 border-b border-foreground/10 pb-2 font-mono text-xs font-semibold uppercase tracking-widest",
                    groupColors(groupName).heading,
                  )}
                >
                  {groupName}
                </p>
                <ul>
                  {items.map((category) => (
                    <li key={category.key}>
                      <CategoryLink
                        category={category}
                        count={categoryCounts[category.key] ?? 0}
                        showDescription
                        onNavigate={closeMenus}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile menu: nav links plus the full category list. */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-b border-foreground/20 bg-background shadow-lg md:hidden"
        >
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            <Link
              href="/"
              onClick={closeMenus}
              className={cn("p-2", navLinkClasses(router.pathname === "/"))}
            >
              Directory
            </Link>
            <Link
              href="/submit"
              onClick={closeMenus}
              className={cn(
                "p-2",
                navLinkClasses(router.pathname === "/submit"),
              )}
            >
              Submit
            </Link>
            {categoryGroups.map(([groupName, items]) => (
              <div key={groupName} className="mt-3">
                <p
                  className={cn(
                    "mb-1 px-2 font-mono text-xs font-semibold uppercase tracking-widest",
                    groupColors(groupName).heading,
                  )}
                >
                  {groupName}
                </p>
                <ul>
                  {items.map((category) => (
                    <li key={category.key}>
                      <CategoryLink
                        category={category}
                        count={categoryCounts[category.key] ?? 0}
                        showDescription={false}
                        onNavigate={closeMenus}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
