"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cancelSubscription,
  createBillingPortal,
  createCheckout,
} from "@/features/subscriptions";
import { planKeySchema } from "@/features/subscriptions/schemas";
import { toSafeError } from "@/lib/errors/app-error";

export type SubscriptionActionState = {
  error?: string;
  success?: string;
};

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function createCheckoutAction(planInput: unknown) {
  try {
    const plan = planKeySchema.parse(planInput);
    const baseUrl = appBaseUrl();
    const result = await createCheckout({
      plan,
      successUrl: `${baseUrl}/dashboard/assinatura?checkout=success`,
      cancelUrl: `${baseUrl}/dashboard/assinatura?checkout=cancelled`,
    });
    redirect(result.url);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: toSafeError(error).message };
  }
}

export async function openBillingPortalAction() {
  try {
    const result = await createBillingPortal({
      returnUrl: `${appBaseUrl()}/dashboard/assinatura`,
    });
    redirect(result.url);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: toSafeError(error).message };
  }
}

export async function cancelSubscriptionAction(): Promise<SubscriptionActionState> {
  try {
    await cancelSubscription();
    revalidatePath("/dashboard/assinatura");
    return { success: "Assinatura cancelada ao final do período." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

function isRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest ?? "").startsWith("NEXT_REDIRECT")
  );
}
