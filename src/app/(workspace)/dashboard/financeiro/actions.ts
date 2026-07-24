"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createFinancialEntry,
  createQuickFinancialEntry,
  deleteFinancialEntry,
  financialEntryUpdateSchema,
  financialKindSchema,
  financialStatusSchema,
  markFinancialEntryPaid,
  updateFinancialEntry,
} from "@/features/finance";
import { financialEntryIdSchema } from "@/features/finance/schemas";
import { toSafeError } from "@/lib/errors/app-error";

export type FinanceActionState = {
  error?: string;
  success?: string;
};

const createFinancialEntryActionSchema = z.object({
  kind: financialKindSchema,
  description: z.string().trim().min(2).max(200),
  amount: z.coerce.number().positive(),
  dueDate: z.iso.date().optional(),
  status: z.enum(["pending", "paid"]).default("pending"),
  categoryId: z.uuid().optional(),
});

const updateFinancialEntryActionSchema = financialEntryUpdateSchema.extend({
  id: financialEntryIdSchema,
  amount: z.coerce.number().positive().optional(),
});

export async function createFinancialEntryAction(input: unknown): Promise<FinanceActionState> {
  try {
    const raw =
      typeof input === "object" && input ? (input as Record<string, unknown>) : {};
    const parsed = createFinancialEntryActionSchema.parse(raw);
    const dueDate = parsed.dueDate ?? new Date().toISOString().slice(0, 10);
    const paidAt = parsed.status === "paid" ? new Date().toISOString() : null;

    if (parsed.categoryId) {
      await createFinancialEntry({
        kind: parsed.kind,
        description: parsed.description,
        amountCents: Math.round(parsed.amount * 100),
        dueDate,
        paidAt,
        status: parsed.status,
        categoryId: parsed.categoryId,
      });
    } else {
      await createQuickFinancialEntry({
        type: parsed.kind,
        description: parsed.description,
        amount: parsed.amount,
        status: parsed.status,
      });
    }

    revalidatePath("/dashboard/financeiro");
    return { success: "Movimentação registrada." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function updateFinancialEntryAction(input: unknown): Promise<FinanceActionState> {
  try {
    const raw =
      typeof input === "object" && input ? (input as Record<string, unknown>) : null;
    if (!raw) return { error: "Dados inválidos." };

    const parsed = updateFinancialEntryActionSchema.parse(raw);
    const { id, amount, ...rest } = parsed;

    await updateFinancialEntry(id, {
      ...rest,
      ...(amount !== undefined && { amountCents: Math.round(amount * 100) }),
    });
    revalidatePath("/dashboard/financeiro");
    return { success: "Movimentação atualizada." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function markFinancialEntryPaidAction(id: unknown): Promise<FinanceActionState> {
  try {
    await markFinancialEntryPaid(id);
    revalidatePath("/dashboard/financeiro");
    return { success: "Movimentação marcada como paga." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function deleteFinancialEntryAction(id: unknown): Promise<FinanceActionState> {
  try {
    await deleteFinancialEntry(id);
    revalidatePath("/dashboard/financeiro");
    return { success: "Movimentação removida." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function updateFinancialEntryStatusAction(input: unknown): Promise<FinanceActionState> {
  try {
    const parsed = z
      .object({ id: financialEntryIdSchema, status: financialStatusSchema })
      .parse(input);
    await updateFinancialEntry(parsed.id, { status: parsed.status });
    revalidatePath("/dashboard/financeiro");
    return { success: "Status atualizado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}
