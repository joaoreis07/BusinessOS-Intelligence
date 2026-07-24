import Image from "next/image";
import type { AboutSectionDTO } from "../../../types";
import type { SectionComponentProps } from "../../../registry/types";
import { LandingBadge } from "../../ui/landing-badge";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type AboutSectionProps = SectionComponentProps<AboutSectionDTO>;

export function AboutSection({ section, context }: AboutSectionProps) {
  const title =
    section.title ?? `Conheça ${context.professionalName ?? context.companyName}`;
  const body = section.body ?? context.biography ?? context.description;

  if (!title && !body && !section.imageUrl) return null;

  return (
    <LandingSectionShell
      id="landing-about"
      ariaLabel="Sobre"
      dataSectionType="about"
      className="py-16 sm:py-20"
      containerClassName="max-w-5xl"
    >
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_280px]">
        <div className="text-center lg:text-left">
          <LandingBadge>Sobre</LandingBadge>
          {title ? (
            <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">{title}</h2>
          ) : null}
          {body ? (
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[var(--landing-muted)] sm:text-lg lg:mx-0">
              {body}
            </p>
          ) : null}
        </div>
        {section.imageUrl ? (
          <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-3xl">
            <Image
              src={section.imageUrl}
              alt={title ?? context.companyName}
              fill
              unoptimized
              className="object-cover"
              sizes="280px"
            />
          </div>
        ) : null}
      </div>
    </LandingSectionShell>
  );
}
