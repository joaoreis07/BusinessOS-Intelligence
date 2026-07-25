import Image from "next/image";
import { GraduationCap, HeartHandshake, Sparkles } from "lucide-react";
import type { AboutSectionDTO } from "../../../types";
import type { SectionComponentProps } from "../../../registry/types";
import { LandingBadge } from "../../ui/landing-badge";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type AboutSectionProps = SectionComponentProps<AboutSectionDTO>;

const HIGHLIGHTS = [
  { icon: GraduationCap, label: "CRN ativo e formação contínua" },
  { icon: HeartHandshake, label: "Atendimento acolhedor e personalizado" },
  { icon: Sparkles, label: "Planos práticos para a rotina real" },
];

export function AboutSection({ section, context }: AboutSectionProps) {
  const title =
    section.title ?? `Conheça ${context.professionalName ?? context.companyName}`;
  const body = section.body ?? context.biography ?? context.description;
  const imageSrc = section.imageUrl ?? "/landing/vitta-demo/portrait.jpg";

  if (!title && !body && !section.imageUrl) return null;

  return (
    <LandingSectionShell
      id="landing-about"
      ariaLabel="Sobre"
      dataSectionType="about"
      className="bg-[var(--landing-surface-subtle)] py-16 sm:py-24"
      containerClassName="max-w-6xl"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative mx-auto w-full max-w-md lg:mx-0">
          <div className="absolute -left-3 top-6 h-full w-full rounded-[2rem] bg-[var(--landing-accent)]/50" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-4 border-white shadow-[0_20px_50px_rgba(24,57,43,0.12)]">
            <Image
              src={imageSrc}
              alt={title ?? context.companyName}
              fill
              unoptimized={imageSrc.startsWith("http")}
              className="object-cover"
              sizes="(max-width: 1024px) 90vw, 420px"
            />
          </div>
        </div>

        <div>
          <LandingBadge>Sobre</LandingBadge>
          {title ? (
            <h2 className="mt-4 font-serif text-3xl font-semibold sm:text-4xl lg:text-5xl">
              {title}
            </h2>
          ) : null}
          {body ? (
            <p className="mt-6 text-base leading-8 text-[var(--landing-muted)] sm:text-lg">
              {body}
            </p>
          ) : null}
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-2xl border border-[var(--landing-primary)]/10 bg-white/80 px-4 py-3"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--landing-accent)] text-[var(--landing-primary)]">
                  <Icon size={18} aria-hidden />
                </span>
                <span className="text-sm leading-6 text-[var(--landing-foreground)] sm:text-base">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </LandingSectionShell>
  );
}
