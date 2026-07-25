import { Leaf, Smartphone, Target } from "lucide-react";
import type { DifferentialsSectionDTO } from "../../../types";
import type { SectionComponentProps } from "../../../registry/types";
import { LandingBadge } from "../../ui/landing-badge";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type DifferentialsSectionProps = SectionComponentProps<DifferentialsSectionDTO>;

const ICONS = [Leaf, Target, Smartphone];

export function DifferentialsSection({ section }: DifferentialsSectionProps) {
  if (!section.items.length) return null;

  return (
    <LandingSectionShell
      id="landing-differentials"
      ariaLabel="Diferenciais"
      dataSectionType="differentials"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-3xl text-center">
        <LandingBadge>Diferenciais</LandingBadge>
        {section.title ? (
          <h2 className="mt-4 font-serif text-3xl font-semibold sm:text-4xl lg:text-5xl">
            {section.title}
          </h2>
        ) : null}
      </div>
      <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-3">
        {section.items.map((item, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <article
              key={`${item.title}-${index}`}
              className="rounded-[1.75rem] border border-[var(--landing-primary)]/10 bg-white p-6 text-center shadow-sm"
            >
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--landing-accent)]/50 text-[var(--landing-primary)]">
                <Icon size={22} aria-hidden />
              </span>
              <h3 className="mt-4 font-serif text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--landing-muted)] sm:text-base">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>
    </LandingSectionShell>
  );
}
