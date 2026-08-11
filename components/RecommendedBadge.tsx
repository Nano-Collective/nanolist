import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendedBadgeProps {
  className?: string;
}

export function RecommendedBadge({ className }: RecommendedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 bg-[#0000EE] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white dark:bg-[#A1A1AA] dark:text-black",
        className,
      )}
    >
      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
      Recommended
    </span>
  );
}
