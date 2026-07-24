"use server";

import "server-only";

import { createClient } from "@/lib/supabase/server";

import { authenticatedContext, unwrap } from "../_shared/server";
import { publicSlugSchema } from "../landing/schemas";
import { mapService } from "./mappers";
import { serviceIdSchema, serviceReorderSchema, serviceSchema, serviceUpdateSchema } from "./schemas";
import type { ServiceDTO } from "./types";

export async function listServices(options: {
  activeOnly?: boolean;
  publiclyVisibleOnly?: boolean;
} = {}): Promise<ServiceDTO[]> {
  const { companyId, supabase } = await authenticatedContext("company:read");
  let query = supabase
    .from("services")
    .select("*")
    .eq("company_id", companyId)
    .is("deleted_at", null);
  if (options.activeOnly) query = query.eq("active", true);
  if (options.publiclyVisibleOnly) query = query.eq("publicly_visible", true);
  const rows = unwrap(await query.order("display_order").order("name"));
  return rows.map(mapService);
}

export async function getService(idInput: unknown): Promise<ServiceDTO | null> {
  const id = serviceIdSchema.parse(idInput);
  const { companyId, supabase } = await authenticatedContext("company:read");
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapService(data) : null;
}

export async function listPublicServices(slugInput: unknown) {
  const slug = publicSlugSchema.parse(slugInput);
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("public_services")
      .select("id, name, description, category, duration_minutes, price, image_path")
      .eq("slug", slug)
      .order("display_order"),
  );
}

async function nextDisplayOrder(companyId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("services")
    .select("display_order")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.display_order ?? -1) + 1;
}

export async function createService(input: unknown): Promise<ServiceDTO> {
  const value = serviceSchema.parse(input);
  const { companyId, supabase } = await authenticatedContext("services:manage");
  const displayOrder = value.displayOrder ?? (await nextDisplayOrder(companyId, supabase));
  const row = unwrap(
    await supabase
      .from("services")
      .insert({
        company_id: companyId,
        name: value.name,
        description: value.description ?? null,
        category: value.category ?? null,
        duration_minutes: value.durationMinutes,
        price: value.priceCents / 100,
        active: value.active,
        publicly_visible: value.publiclyVisible,
        display_order: displayOrder,
      })
      .select()
      .single(),
  );
  return mapService(row);
}

export async function updateService(idInput: unknown, input: unknown): Promise<ServiceDTO> {
  const id = serviceIdSchema.parse(idInput);
  const value = serviceUpdateSchema.parse(input);
  const { companyId, supabase } = await authenticatedContext("services:manage");
  const payload = {
    ...(value.name !== undefined && { name: value.name }),
    ...(value.description !== undefined && { description: value.description }),
    ...(value.category !== undefined && { category: value.category }),
    ...(value.durationMinutes !== undefined && { duration_minutes: value.durationMinutes }),
    ...(value.priceCents !== undefined && { price: value.priceCents / 100 }),
    ...(value.active !== undefined && { active: value.active }),
    ...(value.publiclyVisible !== undefined && { publicly_visible: value.publiclyVisible }),
    ...(value.displayOrder !== undefined && { display_order: value.displayOrder }),
  };
  const row = unwrap(
    await supabase
      .from("services")
      .update(payload)
      .eq("company_id", companyId)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single(),
  );
  return mapService(row);
}

export async function deleteService(idInput: unknown): Promise<{ id: string }> {
  const id = serviceIdSchema.parse(idInput);
  const { companyId, supabase } = await authenticatedContext("services:manage");
  const row = unwrap(
    await supabase
      .from("services")
      .update({ deleted_at: new Date().toISOString(), active: false, publicly_visible: false })
      .eq("company_id", companyId)
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .single(),
  );
  return { id: row.id };
}

export async function reorderServices(input: unknown): Promise<ServiceDTO[]> {
  const items = serviceReorderSchema.parse(input);
  const { companyId, supabase } = await authenticatedContext("services:manage");

  for (const item of items) {
    unwrap(
      await supabase
        .from("services")
        .update({ display_order: item.displayOrder })
        .eq("company_id", companyId)
        .eq("id", item.id)
        .is("deleted_at", null),
    );
  }

  return listServices();
}
