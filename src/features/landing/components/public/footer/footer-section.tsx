import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import type { FooterSectionDTO } from "../../../types";
import type { SectionComponentProps } from "../../../registry/types";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type FooterSectionProps = SectionComponentProps<FooterSectionDTO>;

export function FooterSection({ section }: FooterSectionProps) {
  const city = section.contacts.address.city;
  const state = section.contacts.address.state;

  return (
    <LandingSectionShell
      id="landing-footer"
      ariaLabel="Rodapé"
      landmark="contentinfo"
      dataSectionType="footer"
      className="border-t border-[var(--landing-muted)]/20 bg-[var(--landing-foreground)] py-10 text-[var(--landing-surface)]/70"
      containerClassName="max-w-6xl"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-[var(--landing-surface)]">{section.companyName}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            {section.contacts.email ? (
              <span className="inline-flex items-center gap-1.5">
                <Mail size={15} aria-hidden />
                {section.contacts.email}
              </span>
            ) : null}
            {city ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} aria-hidden />
                {city}
                {state ? ` - ${state}` : ""}
              </span>
            ) : null}
          </div>
        </div>
        <Link
          href="/"
          className="text-sm hover:text-[var(--landing-surface)] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Criado com BusinessOS
        </Link>
      </div>
    </LandingSectionShell>
  );
}
