import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildUnavailableMetadata } from "@/features/seo";
import { buildPreviewLanding, buildPublicLanding } from "./landing-fixtures";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/cache", () => ({
  unstable_noStore: vi.fn(),
}));

const getPublicLandingBySlugMock = vi.fn();
const getPreviewLandingBySlugMock = vi.fn();

vi.mock("@/features/landing/server", async () => {
  const actual = await vi.importActual<typeof import("@/features/landing/server")>(
    "@/features/landing/server",
  );
  return {
    ...actual,
    getPublicLandingBySlug: getPublicLandingBySlugMock,
    getPreviewLandingBySlug: getPreviewLandingBySlugMock,
  };
});

describe("resolvePublicLandingPage states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPublicLandingBySlugMock.mockResolvedValue(null);
    getPreviewLandingBySlugMock.mockResolvedValue(null);
  });

  it("returns published landing", async () => {
    const landing = buildPublicLanding();
    getPublicLandingBySlugMock.mockResolvedValue(landing);
    const { resolvePublicLandingPage } = await import("@/features/landing/public/resolve");
    const result = await resolvePublicLandingPage({ slug: "clinica-saude" });
    expect(result.status).toBe("published");
  });

  it("returns preview landing with valid token", async () => {
    const preview = buildPreviewLanding();
    getPreviewLandingBySlugMock.mockResolvedValue(preview);
    const { resolvePublicLandingPage } = await import("@/features/landing/public/resolve");
    const result = await resolvePublicLandingPage({
      slug: "clinica-saude",
      previewToken: "a".repeat(32),
    });
    expect(result.status).toBe("preview");
  });

  it("returns preview_invalid when token payload is null", async () => {
    getPreviewLandingBySlugMock.mockResolvedValue(null);
    const { resolvePublicLandingPage } = await import("@/features/landing/public/resolve");
    const result = await resolvePublicLandingPage({
      slug: "clinica-saude",
      previewToken: "a".repeat(32),
    });
    expect(result.status).toBe("preview_invalid");
  });

  it("returns inactive company state", async () => {
    createClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: "inactive", error: null }),
    });
    const { resolvePublicLandingPage } = await import("@/features/landing/public/resolve");
    const result = await resolvePublicLandingPage({ slug: "clinica-inativa" });
    expect(result.status).toBe("inactive");
  });

  it("returns unpublished company state", async () => {
    createClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: "unpublished", error: null }),
    });
    const { resolvePublicLandingPage } = await import("@/features/landing/public/resolve");
    const result = await resolvePublicLandingPage({ slug: "clinica-rascunho" });
    expect(result.status).toBe("unpublished");
  });

  it("returns not_found for unknown slug", async () => {
    createClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: "not_found", error: null }),
    });
    const { resolvePublicLandingPage } = await import("@/features/landing/public/resolve");
    const result = await resolvePublicLandingPage({ slug: "inexistente" });
    expect(result.status).toBe("not_found");
  });

  it("rejects reserved slug at validation layer", async () => {
    const { resolvePublicLandingPage } = await import("@/features/landing/public/resolve");
    const result = await resolvePublicLandingPage({ slug: "dashboard" });
    expect(result.status).toBe("error");
  });
});

describe("unavailable metadata matrix", () => {
  it.each([
    ["inactive", "Empresa indisponível"],
    ["unpublished", "Página em preparação"],
    ["preview_invalid", "Preview inválido"],
    ["not_found", "Página não encontrada"],
  ])("blocks indexing for %s state", (_state, title) => {
    const metadata = buildUnavailableMetadata("clinica", title);
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.title).toBe(title);
  });
});
