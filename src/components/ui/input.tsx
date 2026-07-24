import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border bg-white px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-2 focus:outline-offset-1 disabled:bg-[var(--surface-subtle)] disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
