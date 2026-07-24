import type { CSSProperties, ReactNode } from "react";
import type { LandingBrandingDTO } from "../../types";

export type LandingThemeProps = {
  branding: LandingBrandingDTO;
  children: ReactNode;
  className?: string;
};

export function brandingToCssVars(branding: LandingBrandingDTO): CSSProperties {
  const isDark = branding.theme === "dark";
  return {
    "--landing-primary": branding.primaryColor,
    "--landing-secondary": branding.secondaryColor,
    "--landing-accent": branding.accentColor,
    "--landing-background": branding.backgroundColor,
    "--landing-foreground": isDark ? "#f8fafc" : "#0f172a",
    "--landing-muted": isDark ? "#94a3b8" : "#64748b",
    "--landing-surface": isDark ? "#1e293b" : "#ffffff",
    "--landing-surface-subtle": isDark ? "#334155" : "#f8fafc",
    "--landing-radius": "0.75rem",
  } as CSSProperties;
}

export function LandingTheme({ branding, children, className }: LandingThemeProps) {
  const isDark = branding.theme === "dark";
  return (
    <div
      data-landing-theme={branding.theme}
      data-landing-template="default"
      style={brandingToCssVars(branding)}
      className={[
        "landing-theme min-h-full bg-[var(--landing-background)] text-[var(--landing-foreground)]",
        isDark ? "landing-theme-dark" : "landing-theme-light",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
