"use server";

import "server-only";

import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { authenticatedContext, unwrap } from "../_shared/server";
import {
  switchCompanySchema,
  workspacePreferencesSchema,
} from "./schemas";

export async function listMyWorkspaces() {
  const user = await requireUser();
  const supabase = await createClient();
  const memberships = unwrap(
    await supabase
      .from("company_memberships")
      .select("company_id, role")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .is("deleted_at", null)
      .order("created_at"),
  );
  if (!memberships.length) return [];
  const companyIds = memberships.map((item) => item.company_id);
  const companies = unwrap(
    await supabase
      .from("companies")
      .select("id, name, slug, status, active")
      .in("id", companyIds),
  );
  const companiesById = new Map(companies.map((company) => [company.id, company]));
  return memberships.map((membership) => ({
    company_id: membership.company_id,
    role: membership.role,
    companies: companiesById.get(membership.company_id) ?? null,
  }));
}

export async function switchWorkspace(input: unknown) {
  const payload = switchCompanySchema.parse(input);
  const user = await requireUser();
  const supabase = await createClient();
  const membership = unwrap(
    await supabase
      .from("company_memberships")
      .select("id")
      .eq("company_id", payload.companyId)
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .is("deleted_at", null)
      .single(),
    "Você não possui acesso a esta empresa.",
  );
  if (!membership?.id) throw new Error("Acesso inválido.");
  const cookieStore = await cookies();
  cookieStore.set("businessos_company", payload.companyId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getWorkspacePreferences() {
  const { user, companyId, supabase } = await authenticatedContext("company:read");
  const result = await supabase
    .from("workspace_preferences")
    .select("*")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function saveWorkspacePreferences(input: unknown) {
  const payload = workspacePreferencesSchema.parse(input);
  const { user, companyId, supabase } = await authenticatedContext("company:read");
  return unwrap(
    await supabase
      .from("workspace_preferences")
      .upsert(
        {
          company_id: companyId,
          user_id: user.id,
          locale: payload.locale,
          timezone: payload.timezone,
          date_format: payload.dateFormat,
          time_format: payload.timeFormat,
        },
        { onConflict: "company_id,user_id" },
      )
      .select()
      .single(),
  );
}
