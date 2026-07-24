"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  addCustomerNote,
  createCustomer,
  customerSchema,
  customerStatusSchema,
  customerUpdateSchema,
  deleteCustomer,
  updateCustomer,
} from "@/features/customers";
import { customerIdSchema } from "@/features/customers/schemas";
import { toSafeError } from "@/lib/errors/app-error";

export type CustomersActionState = {
  error?: string;
  success?: string;
};

const createCustomerActionSchema = customerSchema;

const updateCustomerActionSchema = customerUpdateSchema.extend({
  id: customerIdSchema,
});

const addNoteActionSchema = z.object({
  customerId: customerIdSchema,
  content: z.string().trim().min(1).max(10_000),
});

export async function createCustomerAction(input: unknown): Promise<CustomersActionState> {
  try {
    const raw =
      typeof input === "object" && input ? (input as Record<string, unknown>) : {};
    const parsed = createCustomerActionSchema.parse(raw);
    await createCustomer(parsed);
    revalidatePath("/dashboard/clientes");
    return { success: "Cliente adicionado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function updateCustomerAction(input: unknown): Promise<CustomersActionState> {
  try {
    const raw =
      typeof input === "object" && input ? (input as Record<string, unknown>) : null;
    if (!raw) return { error: "Dados inválidos." };

    const parsed = updateCustomerActionSchema.parse(raw);
    const { id, ...payload } = parsed;
    await updateCustomer(id, payload);
    revalidatePath("/dashboard/clientes");
    revalidatePath(`/dashboard/clientes/${id}`);
    return { success: "Cliente atualizado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function deleteCustomerAction(id: unknown): Promise<CustomersActionState> {
  try {
    await deleteCustomer(id);
    revalidatePath("/dashboard/clientes");
    return { success: "Cliente removido." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function addCustomerNoteAction(input: unknown): Promise<CustomersActionState> {
  try {
    const parsed = addNoteActionSchema.parse(input);
    await addCustomerNote(parsed);
    revalidatePath(`/dashboard/clientes/${parsed.customerId}`);
    return { success: "Observação registrada." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function updateCustomerStatusAction(input: unknown): Promise<CustomersActionState> {
  try {
    const parsed = z
      .object({ id: customerIdSchema, status: customerStatusSchema })
      .parse(input);
    await updateCustomer(parsed.id, { status: parsed.status });
    revalidatePath("/dashboard/clientes");
    revalidatePath(`/dashboard/clientes/${parsed.id}`);
    return { success: "Status atualizado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}
