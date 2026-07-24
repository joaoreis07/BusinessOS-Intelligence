import { beforeEach, describe, expect, it, vi } from "vitest";

const PREVIEW_PAYLOAD = {
  expires_at: "2026-07-11T20:00:00.000Z",
  is_published: false,
  slug: "clinica-saude",
  company: {
    name: "Clínica Saúde",
    professional_name: "Dra. Ana",
    specialty: "Dermatologia",
    description: "Cuidado com a pele",
    biography: null,
    email: "contato@clinica.com",
    phone: "+5511999999999",
    whatsapp: null,
    address: { city: "São Paulo", state: "SP", street: "Rua A", zip: "01000-000" },
    social_links: {},
  },
  page: {
    title: "Clínica Saúde",
    meta_description: "Agende online",
    logo_path: null,
    avatar_path: null,
    banner_path: null,
    seo: {},
    published: false,
    custom_domain: null,
    published_at: null,
  },
  settings: {
    primary_color: "#173f7a",
    secondary_color: "#445566",
    accent_color: "#e8f1ff",
    background_color: "#ffffff",
    theme: "light",
  },
  sections: [],
  services: [],
  testimonials: [],
  gallery: [],
};

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/env", () => ({
  getPublicSupabaseEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
  }),
}));

import { getPreviewLandingBySlug } from "@/features/landing/server";

describe("preview landing rpc hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
  });

  it("loads preview via get_preview_landing_payload rpc only", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: PREVIEW_PAYLOAD, error: null });
    createClientMock.mockResolvedValue({ rpc });

    const result = await getPreviewLandingBySlug("clinica-saude", "a".repeat(32));

    expect(rpc).toHaveBeenCalledWith("get_preview_landing_payload", {
      preview_token: "a".repeat(32),
      company_slug: "clinica-saude",
    });
    expect(result?.mode).toBe("preview");
    expect(result?.seo.robotsIndex).toBe(false);
  });

  it("returns null for expired or invalid token payload", async () => {
    createClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const result = await getPreviewLandingBySlug("clinica-saude", "a".repeat(32));
    expect(result).toBeNull();
  });

  it("never queries protected tables directly after token validation", async () => {
    const from = vi.fn();
    const rpc = vi.fn().mockResolvedValue({ data: PREVIEW_PAYLOAD, error: null });
    createClientMock.mockResolvedValue({ rpc, from });

    await getPreviewLandingBySlug("clinica-saude", "a".repeat(32));
    expect(from).not.toHaveBeenCalled();
  });
});
