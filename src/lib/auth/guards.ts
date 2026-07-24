import "server-only";

import { cache } from "react";
import { AppError } from "@/lib/errors/app-error";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return null;
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AppError("UNAUTHENTICATED", "Faça login para continuar.", 401);
  }
  return user;
}

export async function requirePlatformAdmin() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_platform_admin");

  if (error || !data) {
    throw new AppError("FORBIDDEN", "Acesso administrativo não autorizado.", 403);
  }

  return { user, role: "platform_admin" as const };
}
