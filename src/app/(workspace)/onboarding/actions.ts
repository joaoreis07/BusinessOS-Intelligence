"use server";

import { redirect } from "next/navigation";
import { completeOnboarding, parseOnboardingInput } from "@/features/onboarding";
import { toSafeError } from "@/lib/errors/app-error";

export type OnboardingActionState = {
  error?: string;
};

export async function completeOnboardingAction(
  _: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  try {
    const payload = parseOnboardingInput({
      companyName: String(formData.get("companyName") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      businessType: String(formData.get("businessType") ?? ""),
    });
    await completeOnboarding(payload);
    redirect("/dashboard");
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}
