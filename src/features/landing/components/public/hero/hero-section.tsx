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
      className="landing-hero relative overflow-hidden bg-[var(--landing-background)]"
      containerClassName="max-w-none px-0 sm:px-0"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--landing-accent),transparent_55%),radial-gradient(circle_at_bottom_left,color-mix(in_srgb,var(--landing-primary)_12%,transparent),transparent_50%)]"
      />
      <div className="relative mx-auto grid min-h-[min(720px,92vh)] max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-24">
        <div className="reveal-up order-2 lg:order-1">
          <LandingBadge className="border border-[var(--landing-primary)]/15 bg-[var(--landing-accent)]/50 text-[var(--landing-primary)]">
            {context.specialty ?? context.companyName}
          </LandingBadge>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] text-[var(--landing-foreground)] sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--landing-muted)] sm:text-lg">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <BookingActionButton
              action={bookingAction}
              variant="primary"
              className="h-12 px-6 text-base shadow-md"
            />
            {whatsappChannel?.href ? (
              <LandingLinkButton
                href={whatsappChannel.href}
                target="_blank"
                rel="noreferrer"
                variant="secondary"
                className="h-12 border-[var(--landing-primary)]/15 bg-white px-6 text-base text-[var(--landing-primary)] hover:bg-[var(--landing-accent)]/30"
                aria-label="Conversar pelo WhatsApp"
                data-business-module="contact"
                data-contact-channel="whatsapp"
              >
                WhatsApp
              </LandingLinkButton>
            ) : null}
          </div>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 text-center sm:gap-4">
            {[
              { value: "500+", label: "Pacientes" },
              { value: "10+", label: "Anos" },
              { value: "100%", label: "Online" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[var(--landing-primary)]/10 bg-white/70 px-3 py-4 backdrop-blur-sm"
              >
                <p className="font-serif text-2xl font-semibold text-[var(--landing-primary)]">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--landing-muted)]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <HeroImage
            imageUrl={section.imageUrl}
            alt={`Atendimento de ${context.companyName}`}
          />
        </div>
      </div>
    </LandingSectionShell>
  );
}
