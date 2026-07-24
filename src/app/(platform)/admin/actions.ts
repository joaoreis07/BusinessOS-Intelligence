"use server";

import { revalidatePath } from "next/cache";

import { updatePlatformCompanyStatus, updateCompanyStatusSchema } from "@/features/platform-admin";
import { toSafeError } from "@/lib/errors/app-error";

export type PlatformAdminActionState = {
  error?: string;
  success?: string;
};

export async function updateCompanyStatusAction(
  input: unknown,
): Promise<PlatformAdminActionState> {
  try {
    const payload = updateCompanyStatusSchema.parse(input);
    await updatePlatformCompanyStatus(payload);
    revalidatePath("/admin");
    revalidatePath("/admin/empresas");
    return { success: "Status da empresa atualizado." };
  } catch (error) {
    return { error: toSafeError(error).message };
  }
}
