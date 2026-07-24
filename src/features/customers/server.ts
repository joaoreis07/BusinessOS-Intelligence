import "server-only";

import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import type { CompanyRole } from "@/lib/tenancy/context";
import { normalizePhoneToE164 } from "@/lib/utils";

import {
  authenticatedContext,
  sanitizeSearchTerm,
  unwrap,
} from "../_shared/server";
import {
  mapCustomerDetail,
  mapCustomerListItem,
  mapCustomerNote,
} from "./mappers";
import {
  customerIdSchema,
  customerNoteSchema,
  customerSchema,
  customerSearchSchema,
  customerUpdateSchema,
  listCustomersQuerySchema,
} from "./schemas";
import type {
  CustomerDetailDTO,
  CustomerListItemDTO,
  CustomerPanelCapabilitiesDTO,
  PaginatedCustomersDTO,
} from "./types";

const CUSTOMER_DETAIL_SELECT =
  "*, customer_notes(id, content, created_at, deleted_at), appointments(id, starts_at, status, deleted_at, services(name)), financial_transactions(id, transaction_type, amount, status, due_date, description)";

export function resolveCustomerPanelCapabilities(
  role: CompanyRole,
): CustomerPanelCapabilitiesDTO {
  return {
    canRead: hasCompanyPermission(role, "customers:read"),
    canManage: hasCompanyPermission(role, "customers:manage"),
  };
}

function buildCustomerPayload(value: ReturnType<typeof customerSchema.parse>) {
  return {
    full_name: value.name,
    email: value.email ?? null,
    phone: normalizePhoneToE164(value.phone),
    whatsapp: value.whatsapp ? normalizePhoneToE164(value.whatsapp) : null,
    birth_date: value.birthDate ?? null,
    city: value.city ?? null,
    state: value.state ? value.state.toUpperCase() : null,
    profession: value.profession ?? null,
    acquisition_source: value.acquisitionSource ?? null,
    objectives: value.objectives ?? null,
    status: value.status,
  };
}

function applyCustomerListFilters(
  query: any,
  input: ReturnType<typeof listCustomersQuerySchema.parse>,
) {
  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.q) {
    const term = sanitizeSearchTerm(input.q);
    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,whatsapp.ilike.%${term}%`,
      );
    }
  }

  if (input.sort === "name_desc") {
    query = query.order("full_name", { ascending: false });
  } else if (input.sort === "created_at_desc") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("full_name", { ascending: true });
  }

  return query;
}

export async function listCustomersPaginated(
  input: unknown,
): Promise<PaginatedCustomersDTO> {
  const value = listCustomersQuerySchema.parse(input ?? {});
  const { companyId, supabase } = await authenticatedContext("customers:read");

  const from = (value.page - 1) * value.pageSize;
  const to = from + value.pageSize - 1;

  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .is("deleted_at", null);

  query = applyCustomerListFilters(query, value);

  const result = await query.range(from, to);
  if (result.error) throw new Error(result.error.message);

  const rows = result.data ?? [];
  const total = result.count ?? rows.length;

  return {
    items: rows.map(mapCustomerListItem),
    page: value.page,
    pageSize: value.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / value.pageSize)),
  };
}

/** @deprecated Prefer listCustomersPaginated */
export async function listCustomers(searchInput: unknown = ""): Promise<CustomerListItemDTO[]> {
  const search = sanitizeSearchTerm(customerSearchSchema.parse(searchInput));
  const result = await listCustomersPaginated({
    page: 1,
    pageSize: 100,
    q: search || undefined,
    sort: "name_asc",
  });
  return result.items;
}

export async function getCustomer(idInput: unknown): Promise<CustomerDetailDTO | null> {
  const id = customerIdSchema.parse(idInput);
  const { companyId, supabase } = await authenticatedContext("customers:read");

  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_DETAIL_SELECT)
    .eq("company_id", companyId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapCustomerDetail(data as unknown as Parameters<typeof mapCustomerDetail>[0]);
}

export async function createCustomer(input: unknown) {
  const value = customerSchema.parse(input);
  const { companyId, supabase } = await authenticatedContext("customers:manage");
  const row = unwrap(
    await supabase
      .from("customers")
      .insert({
        company_id: companyId,
        ...buildCustomerPayload(value),
      })
      .select()
      .single(),
  );
  return mapCustomerListItem(row);
}

export async function updateCustomer(idInput: unknown, input: unknown) {
  const id = customerIdSchema.parse(idInput);
  const value = customerUpdateSchema.parse(input);
  const { companyId, supabase } = await authenticatedContext("customers:manage");

  const payload = {
    ...(value.name !== undefined && { full_name: value.name }),
    ...(value.email !== undefined && { email: value.email }),
    ...(value.phone !== undefined && { phone: normalizePhoneToE164(value.phone) }),
    ...(value.whatsapp !== undefined && {
      whatsapp: value.whatsapp ? normalizePhoneToE164(value.whatsapp) : null,
    }),
    ...(value.birthDate !== undefined && { birth_date: value.birthDate }),
    ...(value.city !== undefined && { city: value.city }),
    ...(value.state !== undefined && {
      state: value.state ? value.state.toUpperCase() : null,
    }),
    ...(value.profession !== undefined && { profession: value.profession }),
    ...(value.acquisitionSource !== undefined && {
      acquisition_source: value.acquisitionSource,
    }),
    ...(value.objectives !== undefined && { objectives: value.objectives }),
    ...(value.status !== undefined && { status: value.status }),
  };

  const row = unwrap(
    await supabase
      .from("customers")
      .update(payload)
      .eq("company_id", companyId)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single(),
  );
  return mapCustomerListItem(row);
}

export async function deleteCustomer(idInput: unknown): Promise<{ id: string }> {
  const id = customerIdSchema.parse(idInput);
  const { companyId, supabase } = await authenticatedContext("customers:manage");
  const row = unwrap(
    await supabase
      .from("customers")
      .update({ deleted_at: new Date().toISOString(), status: "inactive" })
      .eq("company_id", companyId)
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .single(),
  );
  return { id: row.id };
}

export async function addCustomerNote(input: unknown) {
  const value = customerNoteSchema.parse(input);
  const { user, companyId, supabase } = await authenticatedContext("customers:manage");
  const row = unwrap(
    await supabase
      .from("customer_notes")
      .insert({
        company_id: companyId,
        customer_id: value.customerId,
        content: value.content,
        created_by: user.id,
      })
      .select("id, content, created_at")
      .single(),
  );
  return mapCustomerNote(row);
}
