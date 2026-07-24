"use server";

import "server-only";

import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneToE164 } from "@/lib/utils";

import { authenticatedContext, unwrap } from "../_shared/server";
import { companySchema, updateCompanySchema } from "./schemas";

function assertCompanyManager(role: string | null | undefined) {
  if (role !== "owner" && role !== "admin" && role !== "manager") {
    throw new Error("Apenas administradores podem alterar a empresa.");
  }
}

export async function listCompanies() {
  const user = await requireUser();
  const supabase = await createClient();
  const result = await supabase
    .from("company_memberships")
    .select("role, companies(id, name, slug, status, company_settings(timezone))")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at");
  return unwrap(result);
}

export async function getActiveCompany() {
  const { companyId, supabase } = await authenticatedContext("company:read");
  return unwrap(
    await supabase.from("companies").select("*").eq("id", companyId).single(),
    "Empresa não encontrada.",
  );
}

export async function getCompanySettings() {
  const { companyId, supabase } = await authenticatedContext("company:read");
  return unwrap(
    await supabase
      .from("company_settings")
      .select("*")
      .eq("company_id", companyId)
      .single(),
    "Configurações da empresa não encontradas.",
  );
}

export async function createCompany(input: unknown) {
  const payload = companySchema.parse(input);
  await requireUser();
  const supabase = await createClient();
  return unwrap(
    await supabase.rpc("create_company", {
      company_name: payload.name,
      requested_slug: payload.slug,
      business_type: payload.businessType ?? null,
    }),
  );
}

export async function updateActiveCompany(input: unknown) {
  const payload = updateCompanySchema.parse(input);
  const { companyId, role, supabase } = await authenticatedContext("company:update");
  assertCompanyManager(role);
  const current = unwrap(
    await supabase.from("companies").select("address").eq("id", companyId).single(),
    "Empresa não encontrada.",
  );
  const currentAddress = (current.address ?? {}) as Record<string, unknown>;
  const update = {
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.slug !== undefined && { slug: payload.slug }),
    ...(payload.businessType !== undefined && { business_type: payload.businessType }),
    ...(payload.legalName !== undefined && { legal_name: payload.legalName }),
    ...(payload.taxId !== undefined && { tax_id: payload.taxId }),
    ...(payload.email !== undefined && { email: payload.email }),
    ...(payload.phone !== undefined && {
      phone: payload.phone ? normalizePhoneToE164(payload.phone) : null,
    }),
    ...(payload.whatsapp !== undefined && {
      whatsapp: payload.whatsapp ? normalizePhoneToE164(payload.whatsapp) : null,
    }),
    ...(payload.description !== undefined && { description: payload.description }),
    ...((payload.city !== undefined || payload.state !== undefined) && {
      address: {
        ...currentAddress,
        ...(payload.city !== undefined && { city: payload.city }),
        ...(payload.state !== undefined && {
          state: payload.state ? payload.state.toUpperCase() : null,
        }),
      },
    }),
  };
  return unwrap(
    await supabase
      .from("companies")
      .update(update)
      .eq("id", companyId)
      .select()
      .single(),
  );
}

export async function deleteActiveCompany() {
  const { companyId, role, supabase } = await authenticatedContext("company:update");
  if (role !== "owner") throw new Error("Apenas o proprietário pode excluir a empresa.");
  return unwrap(
    await supabase.from("companies").delete().eq("id", companyId).select("id").single(),
  );
}
