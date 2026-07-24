import "server-only";

import { platformAdminContext, sanitizeSearchTerm, unwrap } from "@/features/_shared/server";
import {
  mapPlatformActivityLog,
  mapPlatformCompany,
  mapPlatformMetrics,
  mapPlatformSubscription,
  mapPlatformUser,
} from "./mappers";
import {
  adminCompaniesQuerySchema,
  adminListSchema,
  adminLogsQuerySchema,
  adminSubscriptionsQuerySchema,
  updateCompanyStatusSchema,
} from "./schemas";
import type {
  PaginatedPlatformCompaniesDTO,
  PaginatedPlatformLogsDTO,
  PaginatedPlatformSubscriptionsDTO,
  PaginatedPlatformUsersDTO,
  PlatformMetricsDTO,
  PlatformOverviewDTO,
} from "./types";

export async function getPlatformMetrics(): Promise<PlatformMetricsDTO> {
  const { supabase } = await platformAdminContext();
  const rows = unwrap(await supabase.rpc("get_platform_overview"));
  return mapPlatformMetrics(rows[0] ?? {});
}

export async function getPlatformOverview(): Promise<PlatformOverviewDTO> {
  const [metrics, companies] = await Promise.all([
    getPlatformMetrics(),
    listPlatformCompaniesPaginated({ page: 1, pageSize: 8 }),
  ]);
  return { metrics, recentCompanies: companies.items };
}

export async function listPlatformCompaniesPaginated(
  input: unknown,
): Promise<PaginatedPlatformCompaniesDTO> {
  const query = adminCompaniesQuerySchema.parse(input);
  const { supabase } = await platformAdminContext();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let dbQuery = supabase
    .from("companies")
    .select("id, name, slug, status, active, created_at", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (query.status) dbQuery = dbQuery.eq("status", query.status);
  if (query.search) {
    const term = sanitizeSearchTerm(query.search);
    if (term) dbQuery = dbQuery.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  const { data, error, count } = await dbQuery.range(from, to);
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return {
    items: (data ?? []).map(mapPlatformCompany),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
  };
}

export async function listPlatformUsersPaginated(
  input: unknown,
): Promise<PaginatedPlatformUsersDTO> {
  const query = adminListSchema.parse(input);
  const { supabase } = await platformAdminContext();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let dbQuery = supabase
    .from("profiles")
    .select("id, full_name, phone, created_at", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (query.search) {
    const term = sanitizeSearchTerm(query.search);
    if (term) dbQuery = dbQuery.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data, error, count } = await dbQuery.range(from, to);
  if (error) throw new Error(error.message);

  const userIds = (data ?? []).map((row) => row.id);
  const rolesByUser = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: roles } = await supabase
      .from("platform_roles")
      .select("user_id, role")
      .in("user_id", userIds)
      .is("revoked_at", null);

    for (const role of roles ?? []) {
      rolesByUser.set(role.user_id, role.role);
    }
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return {
    items: (data ?? []).map((row) => mapPlatformUser(row, rolesByUser.get(row.id) ?? null)),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
  };
}

export async function listPlatformSubscriptionsPaginated(
  input: unknown,
): Promise<PaginatedPlatformSubscriptionsDTO> {
  const query = adminSubscriptionsQuerySchema.parse(input);
  const { supabase } = await platformAdminContext();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let companyIds: string[] | null = null;
  if (query.search) {
    const term = sanitizeSearchTerm(query.search);
    if (term) {
      const { data: companies, error: companiesError } = await supabase
        .from("companies")
        .select("id")
        .is("deleted_at", null)
        .or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
      if (companiesError) throw new Error(companiesError.message);
      companyIds = (companies ?? []).map((company) => company.id);
      if (companyIds.length === 0) {
        return {
          items: [],
          page: query.page,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 1,
        };
      }
    }
  }

  let dbQuery = supabase
    .from("subscriptions")
    .select(
      "id, status, company_id, plan_id, current_period_ends_at, next_payment_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (query.status) dbQuery = dbQuery.eq("status", query.status);
  if (companyIds) dbQuery = dbQuery.in("company_id", companyIds);

  const { data, error, count } = await dbQuery.range(from, to);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const companyIdSet = [...new Set(rows.map((row) => row.company_id))];
  const planIdSet = [...new Set(rows.map((row) => row.plan_id))];

  const companiesById = new Map<string, { name: string; slug: string }>();
  const plansById = new Map<string, { name: string }>();

  if (companyIdSet.length > 0) {
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name, slug")
      .in("id", companyIdSet);
    for (const company of companies ?? []) {
      companiesById.set(company.id, { name: company.name, slug: company.slug });
    }
  }

  if (planIdSet.length > 0) {
    const { data: plans } = await supabase.from("plans").select("id, name").in("id", planIdSet);
    for (const plan of plans ?? []) {
      plansById.set(plan.id, { name: plan.name });
    }
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return {
    items: rows.map((row) =>
      mapPlatformSubscription({
        id: row.id,
        status: row.status,
        company_id: row.company_id,
        current_period_ends_at: row.current_period_ends_at,
        next_payment_at: row.next_payment_at,
        companies: companiesById.get(row.company_id) ?? null,
        plans: plansById.get(row.plan_id) ?? null,
      }),
    ),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
  };
}

export async function listPlatformActivityLogsPaginated(
  input: unknown,
): Promise<PaginatedPlatformLogsDTO> {
  const query = adminLogsQuerySchema.parse(input);
  const { supabase } = await platformAdminContext();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let dbQuery = supabase
    .from("activity_logs")
    .select(
      "id, company_id, actor_user_id, action, module, entity_type, entity_id, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (query.module) dbQuery = dbQuery.eq("module", query.module);
  if (query.search) {
    const term = sanitizeSearchTerm(query.search);
    if (term) {
      dbQuery = dbQuery.or(
        `action.ilike.%${term}%,module.ilike.%${term}%,entity_type.ilike.%${term}%`,
      );
    }
  }

  const { data, error, count } = await dbQuery.range(from, to);
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return {
    items: (data ?? []).map(mapPlatformActivityLog),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
  };
}

/** @deprecated Use listPlatformCompaniesPaginated */
export async function listPlatformCompanies(input: unknown) {
  return listPlatformCompaniesPaginated(input);
}

export async function updatePlatformCompanyStatus(input: unknown) {
  const payload = updateCompanyStatusSchema.parse(input);
  const { supabase } = await platformAdminContext();

  const update: { status: typeof payload.status; active?: boolean } = {
    status: payload.status,
  };
  if (payload.active !== undefined) update.active = payload.active;
  else if (payload.status === "active") update.active = true;
  else if (payload.status === "blocked" || payload.status === "cancelled") update.active = false;

  const { error } = await supabase
    .from("companies")
    .update(update)
    .eq("id", payload.companyId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
}
