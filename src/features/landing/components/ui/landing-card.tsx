import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function LandingCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--landing-muted)]/20 bg-[var(--landing-surface)] p-5 shadow-sm transition-shadow duration-200 hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}
