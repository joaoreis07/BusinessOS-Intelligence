import type { HeroSectionDTO } from "../../../types";
import { resolveBookingAction } from "../../../integrations/scheduling";
import { findContactChannel } from "../../../integrations/contact";
import type { SectionComponentProps } from "../../../registry/types";
import { LandingBadge } from "../../ui/landing-badge";
import { BookingActionButton } from "../../ui/booking-action-button";
import { LandingLinkButton } from "../../ui/landing-button";
import { LandingSectionShell } from "../../ui/landing-section-shell";
import { HeroImage } from "./hero-image";

export type HeroSectionProps = SectionComponentProps<HeroSectionDTO>;

export function HeroSection({ section, context }: HeroSectionProps) {
  const title = section.title ?? context.companyName;
  const subtitle = section.subtitle ?? context.description;
  const bookingAction = resolveBookingAction(context, {
    label: section.ctaLabel,
    fallbackHref: section.ctaHref,
  });
  const whatsappChannel = findContactChannel(
    context.integrations.contact.channels,
    "whatsapp",
  );

  return (
    <LandingSectionShell
      id="landing-hero"
      ariaLabel="Apresentação"
      landmark="banner"
      dataSectionType="hero"
      className="bg-[var(--landing-foreground)] text-[var(--landing-surface)]"
      containerClassName="max-w-none px-0 sm:px-0"
    >
      <div className="mx-auto grid min-h-[min(680px,90vh)] max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-20">
        <div className="reveal-up">
          <LandingBadge className="bg-white/10 text-white/80">
            {context.specialty ?? context.companyName}
          </LandingBadge>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-6 max-w-xl text-base leading-8 text-white/75 sm:text-lg">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <BookingActionButton action={bookingAction} variant="primary" />
            {whatsappChannel?.href ? (
              <LandingLinkButton
                href={whatsappChannel.href}
                target="_blank"
                rel="noreferrer"
                variant="secondary"
                className="border-white/25 bg-transparent text-white hover:bg-white/10"
                aria-label="Conversar pelo WhatsApp"
                data-business-module="contact"
                data-contact-channel="whatsapp"
              >
                WhatsApp
              </LandingLinkButton>
            ) : null}
          </div>
        </div>
        <HeroImage
          imageUrl={section.imageUrl}
          alt={`Atendimento de ${context.companyName}`}
        />
      </div>
    </LandingSectionShell>
  );
}
