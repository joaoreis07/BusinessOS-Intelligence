import type { CtaSectionDTO } from "../../../types";
import { resolveBookingAction } from "../../../integrations/scheduling";
import type { SectionComponentProps } from "../../../registry/types";
import { BookingActionButton } from "../../ui/booking-action-button";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type CtaSectionProps = SectionComponentProps<CtaSectionDTO>;

export function CtaSection({ section, context }: CtaSectionProps) {
  const bookingAction = resolveBookingAction(context, {
    label: section.buttonLabel,
    fallbackHref: section.buttonHref,
  });

  return (
    <LandingSectionShell
      id="landing-cta"
      ariaLabel="Chamada para ação"
      dataSectionType="booking"
      className="bg-[var(--landing-primary)] py-16 text-white sm:py-20"
      containerClassName="max-w-3xl text-center"
    >
      {section.title ? (
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">{section.title}</h2>
      ) : null}
      {section.subtitle ? (
        <p className="mt-4 text-base text-white/80 sm:text-lg">{section.subtitle}</p>
      ) : null}
      <BookingActionButton action={bookingAction} variant="inverse" className="mt-8" />
    </LandingSectionShell>
  );
}
