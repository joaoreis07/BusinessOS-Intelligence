import "server-only";

import { requirePlatformAdmin, requireUser } from "@/lib/auth/guards";
import { AppError } from "@/lib/errors/app-error";
import {
  hasCompanyPermission,
  type CompanyPermission,
} from "@/lib/permissions/company-permissions";
import { createClient } from "@/lib/supabase/server";
import { requireCompanyContext } from "@/lib/tenancy/context";
export type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export async function authenticatedContext(permission?: CompanyPermission) {
  const [user, company, supabase] = await Promise.all([
    requireUser(),
    requireCompanyContext(),
    createClient(),
  ]);
  if (permission && !hasCompanyPermission(company.role, permission)) {
    throw new AppError("FORBIDDEN", "Você não possui permissão para esta ação.", 403);
  }

  return { user, companyId: company.companyId, role: company.role, supabase, timezone: company.company.timezone, companySlug: company.company.slug };
}

export async function platformAdminContext() {
  const [admin, supabase] = await Promise.all([
    requirePlatformAdmin(),
    createClient(),
  ]);
  return { user: admin.user, platformRole: admin.role, supabase };
}

export function unwrap<T>(
  result: { data: T; error: { message: string } | null },
  fallback = "Não foi possível concluir a operação.",
): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null || result.data === undefined) throw new Error(fallback);
  return result.data as NonNullable<T>;
}

export function sanitizeSearchTerm(term: string) {
  return term.trim().replace(/[,%()*]/g, "");
}
