"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createService,
  deleteService,
  reorderServices,
  serviceSchema,
  updateService,
} from "@/features/services";
import { serviceIdSchema } from "@/features/services/schemas";
import { toSafeError } from "@/lib/errors/app-error";

export type ServicesActionState = {
  error?: string;
  success?: string;
};

const createServiceActionSchema = z.object({
  name: serviceSchema.shape.name,
  description: serviceSchema.shape.description,
  category: serviceSchema.shape.category,
  durationMinutes: z.coerce.number().int().min(5).max(1_440),
  price: z.coerce.number().nonnegative(),
  active: z.boolean().default(true),
  publiclyVisible: z.boolean().default(true),
});

const updateServiceActionSchema = z.object({
  id: serviceIdSchema,
  name: serviceSchema.shape.name.optional(),
  description: serviceSchema.shape.description,
  category: serviceSchema.shape.category,
  durationMinutes: z.coerce.number().int().min(5).max(1_440).optional(),
  price: z.coerce.number().nonnegative().optional(),
  active: z.boolean().optional(),
  publiclyVisible: z.boolean().optional(),
});

export async function createServiceAction(input: unknown): Promise<ServicesActionState> {
  try {
    const raw =
      typeof input === "object" && input
        ? (input as Record<string, unknown>)
        : {};

    const parsed = createServiceActionSchema.parse({
      name: raw.name,
      description: raw.description,
      category: raw.category,
      durationMinutes: raw.durationMinutes,
      price: raw.price,
      active: raw.active !== false,
      publiclyVisible: raw.publiclyVisible !== false,
    });

    await createService({
      name: parsed.name,
      description: parsed.description ?? null,
      category: parsed.category ?? null,
      durationMinutes: parsed.durationMinutes,
      priceCents: Math.round(parsed.price * 100),
      active: parsed.active,
      publiclyVisible: parsed.publiclyVisible,
    });
    revalidatePath("/dashboard/servicos");
    revalidatePath("/dashboard/agenda");
    return { success: "Serviço criado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function updateServiceAction(input: unknown): Promise<ServicesActionState> {
  try {
    const raw =
      typeof input === "object" && input ? (input as Record<string, unknown>) : null;
    if (!raw) return { error: "Dados inválidos." };

    const parsed = updateServiceActionSchema.parse({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      category: raw.category,
      durationMinutes: raw.durationMinutes,
      price: raw.price,
      active: raw.active,
      publiclyVisible: raw.publiclyVisible,
    });

    await updateService(parsed.id, {
      ...(parsed.name !== undefined && { name: parsed.name }),
      ...(parsed.description !== undefined && { description: parsed.description }),
      ...(parsed.category !== undefined && { category: parsed.category }),
      ...(parsed.durationMinutes !== undefined && { durationMinutes: parsed.durationMinutes }),
      ...(parsed.price !== undefined && { priceCents: Math.round(parsed.price * 100) }),
      ...(parsed.active !== undefined && { active: parsed.active }),
      ...(parsed.publiclyVisible !== undefined && { publiclyVisible: parsed.publiclyVisible }),
    });
    revalidatePath("/dashboard/servicos");
    revalidatePath("/dashboard/agenda");
    return { success: "Serviço atualizado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function deleteServiceAction(id: unknown): Promise<ServicesActionState> {
  try {
    await deleteService(id);
    revalidatePath("/dashboard/servicos");
    revalidatePath("/dashboard/agenda");
    return { success: "Serviço removido." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function reorderServicesAction(
  input: unknown,
): Promise<ServicesActionState> {
  try {
    await reorderServices(input);
    revalidatePath("/dashboard/servicos");
    return { success: "Ordem atualizada." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}
