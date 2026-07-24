"use server";

import { redirect } from "next/navigation";
import { completeOnboarding } from "@/features/onboarding";
import { toSafeError } from "@/lib/errors/app-error";

export type OnboardingActionState = {
  error?: string;
};

export async function completeOnboardingAction(
  _: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  try {
    await completeOnboarding({
      companyName: String(formData.get("companyName") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      businessType: String(formData.get("businessType") ?? ""),
      timezone: String(formData.get("timezone") ?? "America/Sao_Paulo"),
      locale: String(formData.get("locale") ?? "pt-BR"),
      countryCode: String(formData.get("countryCode") ?? "BR"),
      currency: String(formData.get("currency") ?? "BRL"),
      logoPath: String(formData.get("logoPath") ?? "") || null,
      primaryColor: String(formData.get("primaryColor") ?? "#18181B"),
    });
    redirect("/dashboard");
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}
