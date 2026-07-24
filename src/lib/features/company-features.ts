import "server-only";

import { createClient } from "@/lib/supabase/server";

export const COMPANY_FEATURE_KEYS = {
  AI: "ai",
  AUTOMATIONS: "automations",
  ADVANCED_REPORTS: "advanced_reports",
} as const;

const ACTIVE_SUBSCRIPTION_STATUSES = ["trial", "active", "pending", "past_due"] as const;

export async function isCompanyFeatureEnabled(companyId: string, featureKey: string) {
  const supabase = await createClient();

  const { data: companyFeature, error: companyFeatureError } = await supabase
    .from("company_features")
    .select("enabled")
    .eq("company_id", companyId)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (companyFeatureError) throw new Error(companyFeatureError.message);
  if (companyFeature) return companyFeature.enabled;

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("company_id", companyId)
    .in("status", ACTIVE_SUBSCRIPTION_STATUSES)
    .maybeSingle();

  if (subscriptionError) throw new Error(subscriptionError.message);
  if (!subscription) return false;

  const { data: planFeature, error: planFeatureError } = await supabase
    .from("plan_features")
    .select("enabled")
    .eq("plan_id", subscription.plan_id)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (planFeatureError) throw new Error(planFeatureError.message);
  return planFeature?.enabled ?? false;
}
