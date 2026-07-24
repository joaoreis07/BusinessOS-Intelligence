import type { PreviewLandingDTO, PublicLandingDTO } from "../types";
import { buildLandingIntegrationsContext } from "../integrations/resolve";
import type { LandingRenderContext } from "./types";

export function toLandingRenderContext(
  landing: PublicLandingDTO | PreviewLandingDTO,
): LandingRenderContext {
  return {
    mode: landing.mode,
    slug: landing.slug,
    companyName: landing.companyName,
    professionalName: landing.professionalName,
    specialty: landing.specialty,
    description: landing.description,
    biography: landing.biography,
    branding: landing.branding,
    contacts: landing.contacts,
    social: landing.social,
    bookingHref: landing.bookingHref,
    integrations: buildLandingIntegrationsContext(landing),
  };
}
