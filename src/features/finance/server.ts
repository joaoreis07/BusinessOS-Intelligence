"use server";

import "server-only";

import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import type { CompanyRole } from "@/lib/tenancy/context";

import { authenticatedContext, sanitizeSearchTerm, unwrap } from "../_shared/server";
import {
  buildFinancialSummary,
  mapFinancialCategory,
  mapFinancialEntryListItem,
} from "./mappers";
import {
  financePeriodSchema,
  financialEntryIdSchema,
  financialEntrySchema,
  financialEntryUpdateSchema,
  financialKindSchema,
  listFinancialEntriesQuerySchema,
} from "./schemas";
import type {
  FinancePanelCapabilitiesDTO,
  FinancialCategoryDTO,
  FinancialDashboardSummaryDTO,
  FinancialEntryDetailDTO,
  PaginatedFinancialEntriesDTO,
} from "./types";

const FINANCIAL_LIST_SELECT =
  "*, financial_categories(name), customers(full_name)";

export function resolveFinancePanelCapabilities(
  role: CompanyRole,
): FinancePanelCapabilitiesDTO {
  return {
    canRead: hasCompanyPermission(role, "finance:read"),
    canManage: hasCompanyPermission(role, "finance:manage"),
  };
}

function applyFinancialListFilters(
  query: any,
  input: ReturnType<typeof listFinancialEntriesQuerySchema.parse>,
) {
  query = query.gte("due_date", input.from).lte("due_date", input.to);

  if (input.kind) query = query.eq("transaction_type", input.kind);
  if (input.status) query = query.eq("status", input.status);

  if (input.q) {
    const term = sanitizeSearchTerm(input.q);
    if (term) query = query.ilike("description", `%${term}%`);
  }

  if (input.sort === "due_date_asc") {
    query = query.order("due_date", { ascending: true });
  } else if (input.sort === "created_at_desc") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("due_date", { ascending: false });
  }

  return query;
}

export async function listFinancialEntriesPaginated(
  input: unknown,
): Promise<PaginatedFinancialEntriesDTO> {
  const value = listFinancialEntriesQuerySchema.parse(input ?? {});
  const { companyId, supabase } = await authenticatedContext("finance:read");

  const from = (value.page - 1) * value.pageSize;
  const to = from + value.pageSize - 1;

  let query = supabase
    .from("financial_transactions")
    .select(FINANCIAL_LIST_SELECT, { count: "exact" })
    .eq("company_id", companyId)
    .is("deleted_at", null);

  query = applyFinancialListFilters(query, value);

  const result = await query.range(from, to);
  if (result.error) throw new Error(result.error.message);

  const rows = result.data ?? [];
  const total = result.count ?? rows.length;

  const summaryRows = unwrap(
    await supabase
      .from("financial_transactions")
      .select("transaction_type, amount, status")
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .gte("due_date", value.from)
      .lte("due_date", value.to),
  );

  return {
    items: rows.map(mapFinancialEntryListItem),
    page: value.page,
    pageSize: value.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / value.pageSize)),
    summary: buildFinancialSummary(summaryRows),
  };
}

/** @deprecated Prefer listFinancialEntriesPaginated */
export async function listFinancialEntries(periodInput: unknown) {
  const period = financePeriodSchema.parse(periodInput);
  const result = await listFinancialEntriesPaginated({
    ...period,
    page: 1,
    pageSize: 100,
    sort: "due_date_desc",
  });
  return result.items.map((item) => ({
    id: item.id,
    transaction_type: item.kind,
    description: item.description,
    amount: item.amountCents / 100,
    status: item.status,
    due_date: item.dueDate,
    paid_at: item.paidAt,
    customer_id: item.customerId,
    customers: item.customerName ? { full_name: item.customerName } : null,
  }));
}

export async function getFinancialEntry(idInput: unknown): Promise<FinancialEntryDetailDTO | null> {
  const id = financialEntryIdSchema.parse(idInput);
  const { companyId, supabase } = await authenticatedContext("finance:read");

  const { data, error } = await supabase
    .from("financial_transactions")
    .select(FINANCIAL_LIST_SELECT)
    .eq("company_id", companyId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapFinancialEntryListItem(data) : null;
}

export async function getFinancialSummary(periodInput: unknown): Promise<FinancialDashboardSummaryDTO> {
  const period = financePeriodSchema.parse(periodInput);
  const result = await listFinancialEntriesPaginated({
    ...period,
    page: 1,
    pageSize: 1,
  });
  return result.summary;
}

export async function listFinancialCategories(kindInput?: unknown): Promise<FinancialCategoryDTO[]> {
  const kind = kindInput ? financialKindSchema.parse(kindInput) : undefined;
  const { companyId, supabase } = await authenticatedContext("finance:read");
  let query = supabase
    .from("financial_categories")
    .select("id, name, transaction_type")
    .eq("company_id", companyId)
    .eq("active", true)
    .is("deleted_at", null)
    .order("name");

  if (kind) query = query.eq("transaction_type", kind);

  return unwrap(await query).map(mapFinancialCategory);
}

async function resolveDefaultCategoryId(
  companyId: string,
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  kind: "income" | "expense",
) {
  const category = unwrap(
    await supabase
      .from("financial_categories")
      .select("id")
      .eq("company_id", companyId)
      .eq("transaction_type", kind)
      .eq("active", true)
      .is("deleted_at", null)
      .order("created_at")
      .limit(1)
      .single(),
    "Cadastre uma categoria financeira antes de registrar a movimentação.",
  );
  return category.id;
}

export async function createFinancialEntry(input: unknown) {
  const value = financialEntrySchema.parse(input);
  const { companyId, supabase } = await authenticatedContext("finance:manage");
  const row = unwrap(
    await supabase
      .from("financial_transactions")
      .insert({
        company_id: companyId,
        transaction_type: value.kind,
        description: value.description,
        amount: value.amountCents / 100,
        due_date: value.dueDate,
        paid_at: value.paidAt,
        status: value.status,
        category_id: value.categoryId,
        customer_id: value.customerId ?? null,
        service_id: value.serviceId ?? null,
        appointment_id: value.appointmentId ?? null,
      })
      .select(FINANCIAL_LIST_SELECT)
      .single(),
  );
  return mapFinancialEntryListItem(row);
}

export async function updateFinancialEntry(idInput: unknown, input: unknown) {
  const id = financialEntryIdSchema.parse(idInput);
  const value = financialEntryUpdateSchema.parse(input);
  const { companyId, supabase } = await authenticatedContext("finance:manage");
  const payload = {
    ...(value.kind !== undefined && { transaction_type: value.kind }),
    ...(value.description !== undefined && { description: value.description }),
    ...(value.amountCents !== undefined && { amount: value.amountCents / 100 }),
    ...(value.dueDate !== undefined && { due_date: value.dueDate }),
    ...(value.paidAt !== undefined && { paid_at: value.paidAt }),
    ...(value.status !== undefined && { status: value.status }),
    ...(value.categoryId !== undefined && { category_id: value.categoryId }),
    ...(value.customerId !== undefined && { customer_id: value.customerId }),
    ...(value.serviceId !== undefined && { service_id: value.serviceId }),
    ...(value.appointmentId !== undefined && { appointment_id: value.appointmentId }),
  };
  const row = unwrap(
    await supabase
      .from("financial_transactions")
      .update(payload)
      .eq("company_id", companyId)
      .eq("id", id)
      .is("deleted_at", null)
      .select(FINANCIAL_LIST_SELECT)
      .single(),
  );
  return mapFinancialEntryListItem(row);
}

export async function markFinancialEntryPaid(idInput: unknown, paidAt = new Date().toISOString()) {
  return updateFinancialEntry(idInput, { status: "paid", paidAt });
}

export async function createQuickFinancialEntry(input: {
  type: "income" | "expense";
  description: string;
  amount: number;
  status: "pending" | "paid";
}) {
  const { companyId, supabase } = await authenticatedContext("finance:manage");
  const categoryId = await resolveDefaultCategoryId(companyId, supabase, input.type);
  const now = new Date();
  return createFinancialEntry({
    kind: input.type,
    description: input.description,
    amountCents: Math.round(input.amount * 100),
    dueDate: now.toISOString().slice(0, 10),
    paidAt: input.status === "paid" ? now.toISOString() : null,
    status: input.status,
    categoryId,
    customerId: null,
    serviceId: null,
    appointmentId: null,
  });
}

export async function deleteFinancialEntry(idInput: unknown): Promise<{ id: string }> {
  const id = financialEntryIdSchema.parse(idInput);
  const { companyId, supabase } = await authenticatedContext("finance:manage");
  const row = unwrap(
    await supabase
      .from("financial_transactions")
      .update({ deleted_at: new Date().toISOString(), status: "cancelled" })
      .eq("company_id", companyId)
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .single(),
  );
  return { id: row.id };
}
