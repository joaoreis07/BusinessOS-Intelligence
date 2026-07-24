import type { LandingRenderContext } from "../registry/types";
import type { BookingActionDTO } from "./types";

export function resolveServiceBookingHref(slug: string, serviceId: string) {
  return `/${slug}/agendar?service=${serviceId}`;
}

export function resolveBookingAction(
  context: LandingRenderContext,
  input: {
    label: string;
    serviceId?: string;
    fallbackHref?: string | null;
  },
): BookingActionDTO {
  const href = input.serviceId
    ? resolveServiceBookingHref(context.slug, input.serviceId)
    : input.fallbackHref ?? context.integrations.scheduling.bookingHref;

  return {
    module: "scheduling",
    kind: input.serviceId ? "service" : "general",
    label: input.label,
    href,
    enabled: context.integrations.scheduling.enabled,
    serviceId: input.serviceId,
  };
}
