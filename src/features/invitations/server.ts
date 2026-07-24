"use server";

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { authenticatedContext, unwrap } from "../_shared/server";
import {
  createInvitationSchema,
  invitationIdSchema,
  invitationTokenSchema,
} from "./schemas";

export async function listCompanyInvitations() {
  const { companyId, supabase } = await authenticatedContext("company:read");
  return unwrap(
    await supabase
      .from("company_invitations")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
  );
}

export async function createInvitation(input: unknown) {
  const payload = createInvitationSchema.parse(input);
  const { companyId, user, supabase } = await authenticatedContext("company:update");
  const normalizedEmail = payload.email.trim().toLowerCase();

  const duplicated = await supabase
    .from("company_invitations")
    .select("id")
    .eq("company_id", companyId)
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();
  if (duplicated.error) throw new Error(duplicated.error.message);
  if (duplicated.data?.id) {
    throw new Error("Já existe um convite pendente para este e-mail.");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + payload.expiresInDays);
  return unwrap(
    await supabase
      .from("company_invitations")
      .insert({
        company_id: companyId,
        email: normalizedEmail,
        role: payload.role,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single(),
  );
}

export async function resendInvitation(idInput: unknown) {
  const id = invitationIdSchema.parse(idInput);
  const { companyId, supabase } = await authenticatedContext("company:update");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return unwrap(
    await supabase
      .from("company_invitations")
      .update({
        status: "pending",
        last_sent_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("status", "pending")
      .select()
      .single(),
  );
}

export async function cancelInvitation(idInput: unknown) {
  const id = invitationIdSchema.parse(idInput);
  const { companyId, supabase } = await authenticatedContext("company:update");
  return unwrap(
    await supabase
      .from("company_invitations")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("status", "pending")
      .select()
      .single(),
  );
}

export async function acceptInvitation(tokenInput: unknown) {
  const token = invitationTokenSchema.parse(tokenInput);
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_company_invitation", {
    invitation_token: token,
  });
  if (error) throw new Error(error.message);
  return data;
}
