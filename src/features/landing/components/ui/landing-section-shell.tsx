import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LandingSectionShellProps = {
  id: string;
  ariaLabel: string;
  landmark?: "banner" | "region" | "complementary" | "contentinfo";
  className?: string;
  containerClassName?: string;
  children: ReactNode;
  dataSectionType?: string;
};

export function LandingSectionShell({
  id,
  ariaLabel,
  landmark = "region",
  className,
  containerClassName,
  children,
  dataSectionType,
}: LandingSectionShellProps) {
  const Tag = landmark === "banner" ? "header" : landmark === "contentinfo" ? "footer" : "section";

  return (
    <Tag
      id={id}
      aria-label={ariaLabel}
      data-section-type={dataSectionType}
      data-landing-section
      className={cn("landing-section scroll-mt-4", className)}
    >
      <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", containerClassName)}>
        {children}
      </div>
    </Tag>
  );
}
