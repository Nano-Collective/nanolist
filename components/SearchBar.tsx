import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchBar({ value, onChange, className }: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor="listing-search" className="sr-only">
        Search tools
      </label>
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        id="listing-search"
        type="search"
        placeholder="Search tools, tags, authors..."
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full border border-foreground/20 bg-background pl-9 pr-3 font-mono text-sm text-foreground placeholder:text-muted-foreground transition-colors hover:border-foreground/40 focus-visible:border-[#0000EE] focus-visible:outline-none dark:focus-visible:border-[#A1A1AA]"
      />
    </div>
  );
}
