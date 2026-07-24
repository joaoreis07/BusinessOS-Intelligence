import "server-only";

import { createClient } from "@/lib/supabase/server";

import { listPublicServices } from "../../services/server";
import { publicSlugSchema } from "../../landing/schemas";
import {
  mapPublicBookingScheduling,
  mapPublicBookingWizard,
} from "../mappers";
import type { PublicBookingPageDTO, PublicBookingWizardDTO } from "../types";

export async function resolvePublicBookingPage(
  slugInput: unknown,
): Promise<PublicBookingPageDTO | null> {
  const wizard = await resolvePublicBookingWizard(slugInput);
  if (!wizard) return null;
  return {
    company: wizard.company,
    services: wizard.services,
  };
}

export async function resolvePublicBookingWizard(
  slugInput: unknown,
): Promise<PublicBookingWizardDTO | null> {
  const slug = publicSlugSchema.parse(slugInput);
  const supabase = await createClient();
  const [{ data: company }, schedulingRaw] = await Promise.all([
    supabase
      .from("public_landing_pages")
      .select("name, slug, address, primary_color")
      .eq("slug", slug)
      .maybeSingle(),
    supabase.rpc("get_public_booking_wizard_context", { company_slug: slug }),
  ]);

  if (!company) return null;

  const scheduling = mapPublicBookingScheduling(schedulingRaw.data);
  if (!scheduling) return null;

  const services = await listPublicServices(slug);
  return mapPublicBookingWizard({ company, services, scheduling });
}
