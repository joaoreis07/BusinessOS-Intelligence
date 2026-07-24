"use server";

import "server-only";

import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "./schemas";

export async function hasCompletedOnboarding() {
  const user = await requireUser();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("company_memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function completeOnboarding(input: unknown) {
  const payload = onboardingSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_company_onboarding", {
    company_name: payload.companyName,
    requested_slug: payload.slug,
    business_type: payload.businessType,
    selected_timezone: payload.timezone,
    selected_locale: payload.locale,
    selected_country_code: payload.countryCode.toUpperCase(),
    selected_currency: payload.currency.toUpperCase(),
    selected_logo_path: payload.logoPath ?? null,
    selected_primary_color: payload.primaryColor,
  });
  if (error) throw new Error(error.message);
  return data;
}
