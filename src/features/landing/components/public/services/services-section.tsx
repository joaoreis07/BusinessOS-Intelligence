import { Clock3 } from "lucide-react";
import type { ServicesSectionDTO } from "../../../types";
import { resolveBookingAction } from "../../../integrations/scheduling";
import type { SectionComponentProps } from "../../../registry/types";
import { BookingActionButton } from "../../ui/booking-action-button";
import { LandingCard } from "../../ui/landing-card";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type ServicesSectionProps = SectionComponentProps<ServicesSectionDTO>;

export function ServicesSection({ section, context }: ServicesSectionProps) {
  if (!section.items.length) return null;

  return (
    <LandingSectionShell
      id="landing-services"
      ariaLabel="Serviços"
      dataSectionType="services"
      className="bg-[var(--landing-surface-subtle)] py-16 sm:py-20"
      data-business-module="scheduling"
    >
      {section.title ? (
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">{section.title}</h2>
      ) : null}
      <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((service) => {
          const bookingAction = resolveBookingAction(context, {
            label: "Escolher este serviço",
            serviceId: service.id,
            fallbackHref: service.bookingHref,
          });

          return (
            <LandingCard key={service.id} className="flex h-full flex-col">
              <h3 className="text-lg font-semibold sm:text-xl">{service.name}</h3>
              {service.description ? (
                <p className="mt-3 min-h-12 flex-1 text-sm leading-6 text-[var(--landing-muted)]">
                  {service.description}
                </p>
              ) : (
                <div className="flex-1" />
              )}
              <div className="mt-6 flex items-center justify-between border-t border-[var(--landing-muted)]/20 pt-4">
                <span className="font-semibold text-[var(--landing-primary)]">
                  {service.priceLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-sm text-[var(--landing-muted)]">
                  <Clock3 size={15} aria-hidden />
                  {service.durationMinutes} min
                </span>
              </div>
              <BookingActionButton
                action={bookingAction}
                variant="ghost"
                className="mt-4 h-auto justify-start px-0 text-[var(--landing-primary)] hover:bg-transparent"
              />
            </LandingCard>
          );
        })}
      </div>
    </LandingSectionShell>
  );
}
