"use server";

import { redirect } from "next/navigation";
import { toSafeError } from "@/lib/errors/app-error";
import {
  requestPasswordReset,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from "@/features/auth";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await signIn({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    const nextPath = String(formData.get("next") ?? "/dashboard");
    redirect(
      nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : "/dashboard",
    );
  } catch {
    return { error: "E-mail ou senha inválidos." };
  }
}

export async function signUpAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const result = await signUp({
      fullName: String(formData.get("fullName") ?? ""),
      companyName: String(formData.get("companyName") ?? ""),
      businessType: String(formData.get("businessType") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      acceptedTerms: String(formData.get("acceptedTerms") ?? ""),
    });
    if (result.hasSession) redirect("/onboarding");
    return { success: "Conta criada. Confirme seu e-mail para continuar." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function recoverPasswordAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await requestPasswordReset({ email: String(formData.get("email") ?? "") });
    return {
      success: "Se o e-mail estiver cadastrado, enviaremos as instruções.",
    };
  } catch {
    return { error: "Informe um e-mail válido." };
  }
}

export async function updatePasswordAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await updatePassword({ password: String(formData.get("password") ?? "") });
    redirect("/dashboard");
  } catch {
    return { error: "O link expirou. Solicite uma nova recuperação." };
  }
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}
