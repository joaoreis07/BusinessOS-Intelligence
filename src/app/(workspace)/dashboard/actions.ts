"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { updateActiveCompany } from "@/features/companies";
import { createCustomer } from "@/features/customers";
import { createQuickFinancialEntry } from "@/features/finance";
import {
  cancelInvitation,
  createInvitation,
  resendInvitation,
} from "@/features/invitations";
import { invitationRoleSchema } from "@/features/invitations/schemas";
import { saveEditorLanding } from "@/features/landing";
import {
  removeMembership,
  updateMembershipRole,
} from "@/features/memberships";
import { membershipRoleSchema } from "@/features/memberships/schemas";
import { createService } from "@/features/services";
import { switchWorkspace } from "@/features/workspace";
import { toSafeError } from "@/lib/errors/app-error";
import { normalizePhoneToE164 } from "@/lib/utils";

export type WorkspaceActionState = {
  error?: string;
  success?: string;
};

const customerActionSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  email: z.union([z.literal(""), z.email()]).optional(),
  objective: z.string().trim().max(5_000).optional(),
});

const legacyServiceSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().max(500).optional(),
  durationMinutes: z.coerce.number().int().min(15).max(480),
  price: z.coerce.number().nonnegative(),
});

const transactionActionSchema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().trim().min(2),
  amount: z.coerce.number().positive(),
  status: z.enum(["paid", "pending"]),
});

const companyActionSchema = z.object({
  name: z.string().trim().min(2),
  whatsapp: z.string().trim().optional(),
  email: z.union([z.literal(""), z.email()]).optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().max(2).optional(),
  description: z.string().trim().max(1_000).optional(),
});

const landingActionSchema = z.object({
  heroTitle: z.string().trim().min(3),
  heroSubtitle: z.string().trim().min(3),
  aboutTitle: z.string().trim().min(3),
  aboutBody: z.string().trim().min(10),
});

const invitationActionSchema = z.object({
  email: z.email(),
  role: invitationRoleSchema,
  expiresInDays: z.coerce.number().int().min(1).max(30).default(7),
});

export async function createCustomerAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = customerActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise os dados do cliente." };

  try {
    await createCustomer({
      name: parsed.data.name,
      phone: normalizePhoneToE164(parsed.data.phone),
      email: parsed.data.email || null,
      objectives: parsed.data.objective || null,
    });
    revalidatePath("/dashboard/clientes");
    return { success: "Cliente adicionado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

/** @deprecated Prefer createServiceAction in dashboard/servicos/actions.ts */
export async function createServiceAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = legacyServiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise os dados do serviço." };

  try {
    await createService({
      name: parsed.data.name,
      description: parsed.data.description || null,
      durationMinutes: parsed.data.durationMinutes,
      priceCents: Math.round(parsed.data.price * 100),
      active: true,
      publiclyVisible: true,
    });
    revalidatePath("/dashboard/servicos");
    revalidatePath("/dashboard/agenda");
    return { success: "Serviço criado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function createTransactionAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = transactionActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise os dados da movimentação." };

  try {
    await createQuickFinancialEntry({
      type: parsed.data.type,
      description: parsed.data.description,
      amount: parsed.data.amount,
      status: parsed.data.status,
    });
    revalidatePath("/dashboard/financeiro");
    revalidatePath("/dashboard");
    return { success: "Movimentação registrada." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function updateCompanyAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = companyActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise os dados da empresa." };

  try {
    await updateActiveCompany({
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      description: parsed.data.description || null,
    });
    revalidatePath("/dashboard/configuracoes");
    revalidatePath("/dashboard");
    return { success: "Configurações salvas." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function updateLandingAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = landingActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise o conteúdo da landing page." };

  try {
    await saveEditorLanding({
      hero: {
        title: parsed.data.heroTitle,
        subtitle: parsed.data.heroSubtitle,
      },
      about: {
        title: parsed.data.aboutTitle,
        body: parsed.data.aboutBody,
      },
      published: true,
    });
    revalidatePath("/dashboard/configuracoes/landing");
    revalidatePath("/dashboard");
    return { success: "Landing publicada." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function switchCompanyAction(formData: FormData) {
  try {
    await switchWorkspace({ companyId: String(formData.get("companyId")) });
    revalidatePath("/", "layout");
    redirect("/dashboard");
  } catch (error) {
    throw toSafeError(error);
  }
}

export async function createInvitationAction(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = invitationActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revise os dados do convite." };

  try {
    await createInvitation(parsed.data);
    revalidatePath("/dashboard/convites");
    return { success: "Convite enviado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}

export async function resendInvitationAction(formData: FormData) {
  try {
    await resendInvitation(String(formData.get("invitationId")));
    revalidatePath("/dashboard/convites");
  } catch (error) {
    throw toSafeError(error);
  }
}

export async function cancelInvitationAction(formData: FormData) {
  try {
    await cancelInvitation(String(formData.get("invitationId")));
    revalidatePath("/dashboard/convites");
  } catch (error) {
    throw toSafeError(error);
  }
}

export async function updateMembershipRoleAction(formData: FormData) {
  try {
    await updateMembershipRole({
      membershipId: String(formData.get("membershipId")),
      role: membershipRoleSchema.parse(formData.get("role")),
    });
    revalidatePath("/dashboard/membros");
  } catch (error) {
    throw toSafeError(error);
  }
}

export async function removeMembershipAction(formData: FormData) {
  try {
    await removeMembership(String(formData.get("membershipId")));
    revalidatePath("/dashboard/membros");
  } catch (error) {
    throw toSafeError(error);
  }
}
