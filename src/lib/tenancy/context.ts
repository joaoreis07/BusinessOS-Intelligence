import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { AppError } from "@/lib/errors/app-error";
import { getCurrentUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export type CompanyRole =
  | "owner"
  | "admin"
  | "manager"
  | "member"
  | "employee"
  | "viewer";

export type CompanyContext = {
  userId: string;
  companyId: string;
  role: CompanyRole;
  company: {
    id: string;
    name: string;
    slug: string;
    status: string;
    timezone: string;
  };
};

export const getCompanyContext = cache(async (): Promise<CompanyContext | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const cookieStore = await cookies();
  const requestedCompanyId = cookieStore.get("businessos_company")?.value;

  let membershipQuery = supabase
    .from("company_memberships")
    .select("company_id, role")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .is("deleted_at", null);

  if (requestedCompanyId) {
    membershipQuery = membershipQuery.eq("company_id", requestedCompanyId);
  }

  const firstResult = await membershipQuery.order("created_at").limit(1);
  let membership = firstResult.data?.[0] ?? null;
  if ((!membership || firstResult.error) && requestedCompanyId) {
    const fallbackResult = await supabase
      .from("company_memberships")
      .select("company_id, role")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .is("deleted_at", null)
      .order("created_at")
      .limit(1);
    membership = fallbackResult.data?.[0] ?? null;
  }
  if (!membership) return null;

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, slug, status, active")
    .eq("id", membership.company_id)
    .maybeSingle();

  if (
    companyError ||
    !company ||
    !company.active ||
    !["trial", "active"].includes(company.status)
  ) {
    return null;
  }
  const { data: settings } = await supabase
    .from("company_settings")
    .select("timezone")
    .eq("company_id", membership.company_id)
    .maybeSingle();

  return {
    userId: user.id,
    companyId: membership.company_id,
    role: membership.role as CompanyRole,
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      status: company.status,
      timezone: settings?.timezone ?? "America/Sao_Paulo",
    },
  };
});

export async function requireCompanyContext(
  allowedRoles?: readonly CompanyRole[],
) {
  const context = await getCompanyContext();
  if (!context) {
    throw new AppError("FORBIDDEN", "Você não possui acesso a uma empresa.", 403);
  }

  if (allowedRoles && !allowedRoles.includes(context.role)) {
    throw new AppError("FORBIDDEN", "Você não possui permissão para esta ação.", 403);
  }

  return context;
}
