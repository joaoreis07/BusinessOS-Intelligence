import { resolveSchedulingEnabled } from "@/features/scheduling/integrations/landing-bridge";
import type { PreviewLandingDTO, PublicLandingDTO } from "../types";
import { resolveContactChannels } from "./contact";
import type { LandingIntegrationsContext } from "./types";

export function buildLandingIntegrationsContext(
  landing: PublicLandingDTO | PreviewLandingDTO,
): LandingIntegrationsContext {
  const servicesSection = landing.sections.find((section) => section.type === "services");
  const publiclyVisibleServices =
    servicesSection?.type === "services" ? servicesSection.items.length : 0;

  const formEnabled = false;

  return {
    scheduling: {
      module: "scheduling",
      enabled: resolveSchedulingEnabled({
        bookingHref: landing.bookingHref,
        bookingEnabled: landing.bookingEnabled,
        publiclyVisibleServices,
      }),
      bookingHref: landing.bookingHref,
      publiclyVisibleServices,
    },
    crm: {
      module: "crm",
      enabled: true,
      testimonialsSource: "landing",
      syncReviewsEnabled: false,
    },
    contact: {
      module: "contact",
      enabled: true,
      channels: resolveContactChannels({
        slug: landing.slug,
        contacts: landing.contacts,
        social: landing.social,
        formEnabled,
      }),
      formActionHref: `/${landing.slug}/contato`,
      formEnabled,
    },
  };
}
