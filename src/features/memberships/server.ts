"use server";

import "server-only";

import { authenticatedContext, unwrap } from "../_shared/server";
import {
  membershipIdSchema,
  updateMembershipRoleSchema,
} from "./schemas";

export async function listMemberships() {
  const { companyId, supabase } = await authenticatedContext("company:read");
  return unwrap(
    await supabase
      .from("company_memberships")
      .select("id, user_id, role, accepted_at, profiles(id, full_name, phone)")
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at"),
  );
}

export async function updateMembershipRole(input: unknown) {
  const payload = updateMembershipRoleSchema.parse(input);
  const { companyId, role, supabase } = await authenticatedContext("company:update");
  if (role !== "owner" && payload.role === "owner") {
    throw new Error("Apenas o owner pode promover outro usuário para owner.");
  }
  return unwrap(
    await supabase
      .from("company_memberships")
      .update({ role: payload.role })
      .eq("id", payload.membershipId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .select()
      .single(),
  );
}

export async function removeMembership(membershipIdInput: unknown) {
  const membershipId = membershipIdSchema.parse(membershipIdInput);
  const { companyId, supabase } = await authenticatedContext("company:update");
  return unwrap(
    await supabase
      .from("company_memberships")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", membershipId)
      .eq("company_id", companyId)
      .neq("role", "owner")
      .select("id")
      .single(),
  );
}
