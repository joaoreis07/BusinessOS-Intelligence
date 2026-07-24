import type { DifferentialsSectionDTO } from "../../../types";
import type { SectionComponentProps } from "../../../registry/types";
import { LandingCard } from "../../ui/landing-card";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type DifferentialsSectionProps = SectionComponentProps<DifferentialsSectionDTO>;

export function DifferentialsSection({ section }: DifferentialsSectionProps) {
  if (!section.items.length) return null;

  return (
    <LandingSectionShell
      id="landing-differentials"
      ariaLabel="Diferenciais"
      dataSectionType="differentials"
      className="py-16 sm:py-20"
    >
      {section.title ? (
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">{section.title}</h2>
      ) : null}
      <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item, index) => (
          <LandingCard key={`${item.title}-${index}`}>
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--landing-muted)]">
              {item.description}
            </p>
          </LandingCard>
        ))}
      </div>
    </LandingSectionShell>
  );
}
