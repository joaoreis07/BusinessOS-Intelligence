import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";

const COMPANY_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_COMPANY_ID = "660e8400-e29b-41d4-a716-446655440001";
const TESTIMONIAL_ID = "770e8400-e29b-41d4-a716-446655440002";
const LANDING_PAGE_ID = "880e8400-e29b-41d4-a716-446655440003";

const { createClientMock, authenticatedContextMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  authenticatedContextMock: vi.fn(),
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

vi.mock("@/features/_shared/server", async () => {
  const actual = await vi.importActual("@/features/_shared/server");
  return {
    ...(actual as object),
    authenticatedContext: authenticatedContextMock,
  };
});

import {
  createLandingPreviewToken,
  createTestimonial,
  deleteTestimonial,
  getAiIntegrationContext,
  getPublicLandingBySlug,
  getPreviewLandingBySlug,
  updateTestimonial,
} from "@/features/landing/server";

function chainable(result: { data: unknown; error: unknown; count?: number }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

describe("landing server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
  });

  describe("getPublicLandingBySlug", () => {
    it("returns null when slug is not found", async () => {
      createClientMock.mockResolvedValue({
        from: vi.fn(() => chainable({ data: null, error: null })),
      });

      const result = await getPublicLandingBySlug("clinica-inexistente");
      expect(result).toBeNull();
    });

    it("rejects invalid slug input", async () => {
      await expect(getPublicLandingBySlug("INVALID_SLUG")).rejects.toThrow();
    });

    it("maps public landing when page exists", async () => {
      const page = {
        slug: "clinica-saude",
        name: "Clínica Saúde",
        professional_name: null,
        specialty: null,
        description: null,
        biography: null,
        email: null,
        phone: null,
        whatsapp: null,
        address: null,
        social_links: null,
        title: "Clínica Saúde",
        meta_description: null,
        logo_path: null,
        avatar_path: null,
        banner_path: null,
        seo: {},
        primary_color: "#111111",
        secondary_color: "#222222",
        accent_color: "#333333",
        background_color: "#FFFFFF",
        theme: "light",
      };

      const from = vi.fn((table: string) => {
        if (table === "public_landing_pages") {
          return chainable({ data: page, error: null });
        }
        return chainable({ data: [], error: null });
      });

      createClientMock.mockResolvedValue({
        from,
        rpc: vi.fn().mockResolvedValue({
          data: { bookingEnabled: true },
          error: null,
        }),
      });

      const result = await getPublicLandingBySlug("clinica-saude");
      expect(result?.mode).toBe("public");
      expect(result?.slug).toBe("clinica-saude");
      expect(result?.bookingEnabled).toBe(true);
    });
  });

  describe("getPreviewLandingBySlug", () => {
    it("returns null when preview rpc has no payload", async () => {
      createClientMock.mockResolvedValue({
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await getPreviewLandingBySlug("clinica-saude", "a".repeat(32));
      expect(result).toBeNull();
    });

    it("rejects malformed access payload", async () => {
      await expect(getPreviewLandingBySlug("ab", "short")).rejects.toThrow();
    });
  });

  describe("createLandingPreviewToken", () => {
    it("requires landing manage permission", async () => {
      authenticatedContextMock.mockRejectedValue(
        new AppError("FORBIDDEN", "Sem permissão.", 403),
      );

      await expect(createLandingPreviewToken(60)).rejects.toThrow("Sem permissão.");
    });

    it("returns preview url scoped to authenticated company", async () => {
      const rpc = vi.fn().mockResolvedValue({
        data: [
          {
            preview_token: "preview-token-1234567890",
            expires_at: "2026-07-11T20:00:00.000Z",
            company_slug: "clinica-saude",
          },
        ],
        error: null,
      });

      authenticatedContextMock.mockResolvedValue({
        companyId: COMPANY_ID,
        supabase: { rpc },
      });

      const result = await createLandingPreviewToken(60);
      expect(result.slug).toBe("clinica-saude");
      expect(result.previewUrl).toContain("?preview=");
      expect(rpc).toHaveBeenCalledWith("create_landing_preview_token", {
        target_company_id: COMPANY_ID,
        ttl_minutes: 60,
      });
    });
  });

  describe("testimonials CRUD tenant isolation", () => {
    beforeEach(() => {
      authenticatedContextMock.mockResolvedValue({
        companyId: COMPANY_ID,
        supabase: {
          from: vi.fn((table: string) => {
            if (table === "landing_pages") {
              return chainable({ data: { id: LANDING_PAGE_ID }, error: null });
            }
            if (table === "testimonials") {
              return {
                ...chainable({
                  data: {
                    id: TESTIMONIAL_ID,
                    company_id: COMPANY_ID,
                    customer_name: "Maria",
                    quote: "Ótimo",
                    rating: 5,
                    photo_path: null,
                    published: true,
                    display_order: 0,
                  },
                  error: null,
                }),
                insert: vi.fn().mockReturnThis(),
                update: vi.fn().mockReturnThis(),
              };
            }
            return chainable({ data: null, error: null });
          }),
        },
      });
    });

    it("creates testimonial with company_id from context", async () => {
      const insert = vi.fn().mockReturnThis();
      const single = vi.fn().mockResolvedValue({
        data: { id: TESTIMONIAL_ID },
        error: null,
      });

      authenticatedContextMock.mockResolvedValue({
        companyId: COMPANY_ID,
        supabase: {
          from: vi.fn(() => ({
            insert,
            select: vi.fn().mockReturnThis(),
            single,
          })),
        },
      });

      await createTestimonial({
        customerName: "Maria Silva",
        quote: "Excelente atendimento!",
        rating: 5,
      });

      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: COMPANY_ID,
          customer_name: "Maria Silva",
        }),
      );
    });

    it("scopes update by company_id from context", async () => {
      const eqCalls: Array<[string, string]> = [];
      const makeEqChain = () => ({
        eq: vi.fn((column: string, value: string) => {
          eqCalls.push([column, value]);
          return {
            eq: vi.fn((col: string, val: string) => {
              eqCalls.push([col, val]);
              return makeSelectChain();
            }),
          };
        }),
      });
      const makeSelectChain = () => ({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: TESTIMONIAL_ID },
            error: null,
          }),
        }),
      });
      const update = vi.fn().mockReturnValue(makeEqChain());

      authenticatedContextMock.mockResolvedValue({
        companyId: COMPANY_ID,
        supabase: { from: vi.fn(() => ({ update })) },
      });

      await updateTestimonial(TESTIMONIAL_ID, { quote: "Atualizado" });

      expect(eqCalls).toContainEqual(["id", TESTIMONIAL_ID]);
      expect(eqCalls).toContainEqual(["company_id", COMPANY_ID]);
      expect(eqCalls).not.toContainEqual(["company_id", OTHER_COMPANY_ID]);
    });

    it("scopes delete by company_id from context", async () => {
      const eqCalls: Array<[string, string]> = [];
      const makeEqChain = () => ({
        eq: vi.fn((column: string, value: string) => {
          eqCalls.push([column, value]);
          return {
            eq: vi.fn((col: string, val: string) => {
              eqCalls.push([col, val]);
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: TESTIMONIAL_ID },
                    error: null,
                  }),
                }),
              };
            }),
          };
        }),
      });
      const update = vi.fn().mockReturnValue(makeEqChain());

      authenticatedContextMock.mockResolvedValue({
        companyId: COMPANY_ID,
        supabase: { from: vi.fn(() => ({ update })) },
      });

      await deleteTestimonial(TESTIMONIAL_ID);

      expect(eqCalls).toContainEqual(["company_id", COMPANY_ID]);
    });

    it("rejects invalid testimonial id", async () => {
      await expect(updateTestimonial("not-uuid", { quote: "x" })).rejects.toThrow();
    });
  });

  describe("integration stubs", () => {
    it("returns disabled AI integration context", async () => {
      const result = await getAiIntegrationContext();
      expect(result.enabled).toBe(false);
      expect(result.suggestionsAvailable).toBe(false);
    });
  });
});
