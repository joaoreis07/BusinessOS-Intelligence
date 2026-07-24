import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type LandingButtonVariant = "primary" | "secondary" | "ghost" | "inverse";

const variantClasses: Record<LandingButtonVariant, string> = {
  primary:
    "bg-[var(--landing-primary)] text-white hover:brightness-110 border-transparent",
  secondary:
    "bg-[var(--landing-surface)] text-[var(--landing-foreground)] border-[var(--landing-muted)]/30 hover:bg-[var(--landing-surface-subtle)]",
  ghost:
    "bg-transparent text-[var(--landing-foreground)] border-transparent hover:bg-[var(--landing-surface-subtle)]",
  inverse:
    "bg-[var(--landing-surface)] text-[var(--landing-primary)] hover:brightness-95 border-transparent",
};

type BaseProps = {
  variant?: LandingButtonVariant;
  className?: string;
};

export type LandingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & BaseProps;

export function LandingButton({
  variant = "primary",
  className,
  type = "button",
  ...props
}: LandingButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-[filter,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-primary)] disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export type LandingLinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & BaseProps;

export function LandingLinkButton({
  variant = "primary",
  className,
  ...props
}: LandingLinkButtonProps) {
  return (
    <a
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-[filter,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-primary)]",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
