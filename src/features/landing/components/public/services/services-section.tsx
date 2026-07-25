import { Clock3 } from "lucide-react";
import type { ServicesSectionDTO } from "../../../types";
import { resolveBookingAction } from "../../../integrations/scheduling";
import type { SectionComponentProps } from "../../../registry/types";
import { BookingActionButton } from "../../ui/booking-action-button";
import { LandingBadge } from "../../ui/landing-badge";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type ServicesSectionProps = SectionComponentProps<ServicesSectionDTO>;

export function ServicesSection({ section, context }: ServicesSectionProps) {
  if (!section.items.length) return null;

  return (
    <LandingSectionShell
      id="landing-services"
      ariaLabel="Serviços"
      dataSectionType="services"
      className="py-16 sm:py-24"
      data-business-module="scheduling"
    >
      <div className="mx-auto max-w-3xl text-center">
        <LandingBadge>Serviços</LandingBadge>
        {section.title ? (
          <h2 className="mt-4 font-serif text-3xl font-semibold sm:text-4xl lg:text-5xl">
            {section.title}
          </h2>
        ) : null}
        <p className="mt-4 text-base leading-7 text-[var(--landing-muted)] sm:text-lg">
          Escolha o atendimento ideal e agende online em poucos minutos.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:mt-12 lg:grid-cols-2">
        {section.items.map((service) => {
          const bookingAction = resolveBookingAction(context, {
            label: "Agendar este serviço",
            serviceId: service.id,
            fallbackHref: service.bookingHref,
          });

          return (
            <article
              key={service.id}
              className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[var(--landing-primary)]/10 bg-white shadow-[0_16px_40px_rgba(24,57,43,0.08)] transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="h-1.5 bg-[linear-gradient(90deg,var(--landing-primary),var(--landing-accent))]" />
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h3 className="font-serif text-2xl font-semibold text-[var(--landing-foreground)]">
                  {service.name}
                </h3>
                {service.description ? (
                  <p className="mt-3 flex-1 text-sm leading-7 text-[var(--landing-muted)] sm:text-base">
                    {service.description}
                  </p>
                ) : (
                  <div className="flex-1" />
                )}
                <div className="mt-6 flex items-center justify-between border-t border-[var(--landing-primary)]/10 pt-5">
                  <span className="text-2xl font-semibold text-[var(--landing-primary)]">
                    {service.priceLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--landing-accent)]/40 px-3 py-1 text-sm text-[var(--landing-primary)]">
                    <Clock3 size={15} aria-hidden />
                    {service.durationMinutes} min
                  </span>
                </div>
                <BookingActionButton
                  action={bookingAction}
                  variant="primary"
                  className="mt-5 h-12 w-full justify-center text-base"
                />
              </div>
            </article>
          );
        })}
      </div>
    </LandingSectionShell>
  );
}
