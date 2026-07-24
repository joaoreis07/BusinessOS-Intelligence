"use server";

import "server-only";

import { createClient } from "@/lib/supabase/server";

import {
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "./schemas";

export async function signIn(input: unknown) {
  const credentials = signInSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw new Error(error.message);
  return { userId: data.user.id };
}

export async function signUp(input: unknown) {
  const payload = signUpSchema.parse(input);
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      data: {
        full_name: payload.fullName,
        company_name: payload.companyName,
        business_type: payload.businessType,
        phone: payload.phone,
        terms_accepted_at: new Date().toISOString(),
      },
    },
  });
  if (error) throw new Error(error.message);

  if (data.session && data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: payload.fullName,
    });
    if (profileError) throw new Error(profileError.message);
  }

  return {
    userId: data.user?.id ?? null,
    hasSession: Boolean(data.session),
    requiresEmailConfirmation: !data.session,
  };
}

export async function requestPasswordReset(input: unknown) {
  const { email } = resetPasswordSchema.parse(input);
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/redefinir-senha`,
  });
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updatePassword(input: unknown) {
  const { password } = updatePasswordSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function completeAuthCallback() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const fullName = String(user.user_metadata.full_name ?? "Usuário");
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
  });
  if (profileError) throw new Error(profileError.message);

  const { count, error: countError } = await supabase
    .from("company_memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .is("deleted_at", null);
  if (countError) throw new Error(countError.message);

  if ((count ?? 0) === 0) return;
}
