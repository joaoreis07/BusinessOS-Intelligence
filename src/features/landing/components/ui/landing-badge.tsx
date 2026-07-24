import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function LandingBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--landing-accent)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--landing-primary)]",
        className,
      )}
      {...props}
    />
  );
}
