import {
  ATTRIBUTE_LABELS,
  type AttributeKey,
} from "@/components/AttributeBadges";
import type { Category, Listing } from "@/lib/schema";
import { cn } from "@/lib/utils";

export type SortKey = "recommended" | "newest" | "az";

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "az", label: "A–Z" },
];

export const PRICING_OPTIONS: ReadonlyArray<{
  value: Listing["pricing"];
  label: string;
}> = [
  { value: "open-source", label: "Open source" },
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "paid", label: "Paid" },
];

interface FilterBarProps {
  categories: Category[];
  category: string;
  onCategoryChange: (value: string) => void;
  attributes: Record<AttributeKey, boolean>;
  onAttributeToggle: (key: AttributeKey) => void;
  pricing: string;
  onPricingChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  id?: string;
  className?: string;
}

const selectClasses =
  "h-9 max-w-full border border-foreground/20 bg-background px-2 font-mono text-xs text-foreground transition-colors hover:border-foreground/40 focus-visible:border-[#0000EE] focus-visible:outline-none dark:focus-visible:border-[#A1A1AA]";

export function FilterBar({
  categories,
  category,
  onCategoryChange,
  attributes,
  onAttributeToggle,
  pricing,
  onPricingChange,
  sort,
  onSortChange,
  id,
  className,
}: FilterBarProps) {
  // Group categories by their `group` field, preserving file order.
  const groups: Array<[string, Category[]]> = [];
  for (const item of categories) {
    const existing = groups.find(([name]) => name === item.group);
    if (existing) {
      existing[1].push(item);
    } else {
      groups.push([item.group, [item]]);
    }
  }

  return (
    // On md+ the wrapper dissolves (`contents`) so each control sits directly
    // in the toolbar's flex row beside the search input; on mobile it renders
    // as a stacked panel toggled by the Filters button.
    <div id={id} className={cn("w-full flex-col gap-2 md:contents", className)}>
      <label htmlFor="filter-category" className="sr-only">
        Filter by category
      </label>
      <select
        id="filter-category"
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        className={cn(selectClasses, "w-full md:w-auto")}
      >
        <option value="">All categories</option>
        {groups.map(([groupName, items]) => (
          <optgroup key={groupName} label={groupName}>
            {items.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <label htmlFor="filter-pricing" className="sr-only">
        Filter by pricing
      </label>
      <select
        id="filter-pricing"
        value={pricing}
        onChange={(event) => onPricingChange(event.target.value)}
        className={cn(selectClasses, "w-full md:w-auto")}
      >
        <option value="">All pricing</option>
        {PRICING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Filter by attribute</legend>
        {ATTRIBUTE_LABELS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={attributes[key]}
            onClick={() => onAttributeToggle(key)}
            className={cn(
              "h-9 border px-2.5 font-mono text-xs uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              attributes[key]
                ? "border-[#0000EE] bg-[#0000EE] font-bold text-white dark:border-[#A1A1AA] dark:bg-[#A1A1AA] dark:text-black"
                : "border-foreground/20 bg-background text-foreground/70 hover:border-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </fieldset>

      <div className="flex items-center gap-2 md:ml-auto">
        <label
          htmlFor="filter-sort"
          className="font-mono text-xs uppercase tracking-wide text-muted-foreground"
        >
          Sort
        </label>
        <select
          id="filter-sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          className={cn(selectClasses, "flex-1 md:flex-none")}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
