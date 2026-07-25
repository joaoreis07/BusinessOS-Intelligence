import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
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
      className="border-t border-[var(--landing-primary)]/10 bg-[var(--landing-primary)] py-12 text-white/80"
      containerClassName="max-w-6xl"
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-serif text-2xl font-semibold text-white">{section.companyName}</p>
          <p className="mt-2 max-w-md text-sm leading-7 text-white/70">
            Atendimento nutricional personalizado com foco em resultados sustentáveis.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          {section.contacts.email ? (
            <p className="inline-flex items-center gap-2">
              <Mail size={16} aria-hidden />
              {section.contacts.email}
            </p>
          ) : null}
          {section.contacts.phone ? (
            <p className="inline-flex items-center gap-2">
              <Phone size={16} aria-hidden />
              {section.contacts.phone}
            </p>
          ) : null}
          {city ? (
            <p className="inline-flex items-center gap-2">
              <MapPin size={16} aria-hidden />
              {city}
              {state ? ` - ${state}` : ""}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} {section.companyName}. Todos os direitos reservados.</p>
        <Link href="/" className="text-white/70 transition-colors hover:text-white">
          Criado com BusinessOS
        </Link>
      </div>
    </LandingSectionShell>
  );
}
