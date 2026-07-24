import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServerSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database.generated";

export function createAdminClient() {
  const env = getServerSupabaseEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
