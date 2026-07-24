"use server";

import "server-only";

import type { Json } from "@/types/database.generated";
import { authenticatedContext, unwrap } from "../_shared/server";
import {
  integrationConnectSchema,
  integrationProviderSchema,
  integrationSettingsSchema,
} from "./schemas";

function assertIntegrationManager(role: string | null | undefined) {
  if (role !== "owner" && role !== "admin") {
    throw new Error("Sem permissão para gerenciar integrações.");
  }
}

export async function listIntegrations() {
  const { companyId, supabase } = await authenticatedContext();
  return unwrap(
    await supabase
      .from("integrations")
      .select("id, provider, status, public_config, last_synced_at, last_error, created_at")
      .eq("company_id", companyId)
      .order("provider"),
  );
}

export async function connectIntegration(input: unknown) {
  const value = integrationConnectSchema.parse(input);
  const { companyId, role, supabase } = await authenticatedContext();
  assertIntegrationManager(role);
  return unwrap(
    await supabase.rpc("connect_integration", {
      p_company_id: companyId,
      p_provider: value.provider,
      p_credentials: value.credentials as Json,
      p_settings: value.settings as Json,
    }),
  );
}

export async function updateIntegrationSettings(input: unknown) {
  const value = integrationSettingsSchema.parse(input);
  const { companyId, role, supabase } = await authenticatedContext();
  assertIntegrationManager(role);
  return unwrap(
    await supabase
      .from("integrations")
      .update({ public_config: value.settings as Json })
      .eq("company_id", companyId)
      .eq("provider", value.provider)
      .select("id, provider, status, public_config")
      .single(),
  );
}

export async function disconnectIntegration(providerInput: unknown) {
  const provider = integrationProviderSchema.parse(providerInput);
  const { companyId, role, supabase } = await authenticatedContext();
  assertIntegrationManager(role);
  return unwrap(
    await supabase.rpc("disconnect_integration", {
      p_company_id: companyId,
      p_provider: provider,
    }),
  );
}

export async function testIntegration(providerInput: unknown) {
  const provider = integrationProviderSchema.parse(providerInput);
  const { companyId, role, supabase } = await authenticatedContext();
  assertIntegrationManager(role);
  return unwrap(
    await supabase.rpc("test_integration", {
      p_company_id: companyId,
      p_provider: provider,
    }),
  );
}
