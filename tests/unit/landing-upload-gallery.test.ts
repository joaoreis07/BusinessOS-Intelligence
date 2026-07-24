import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";

const COMPANY_ID = "550e8400-e29b-41d4-a716-446655440000";
const LANDING_PAGE_ID = "880e8400-e29b-41d4-a716-446655440003";
const MEDIA_ASSET_ID = "990e8400-e29b-41d4-a716-446655440004";
const GALLERY_ITEM_ID = "aa0e8400-e29b-41d4-a716-446655440005";

const { authenticatedContextMock } = vi.hoisted(() => ({
  authenticatedContextMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/features/_shared/server", async () => {
  const actual = await vi.importActual("@/features/_shared/server");
  return {
    ...(actual as object),
    authenticatedContext: authenticatedContextMock,
  };
});

import {
  createGalleryItem,
  deleteGalleryItem,
  updateGalleryItem,
  uploadLandingMedia,
} from "@/features/landing/server";

function chainable(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return builder;
}

describe("landing uploads hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticatedContextMock.mockRejectedValue(
      new AppError("FORBIDDEN", "Sem permissão landing:manage.", 403),
    );
  });

  it("requires landing:manage permission", async () => {
    await expect(
      uploadLandingMedia({
        kind: "logo",
        fileName: "logo.png",
        mimeType: "image/png",
        byteSize: 1024,
        fileBase64: Buffer.from("fake").toString("base64"),
      }),
    ).rejects.toThrow("Sem permissão");
  });

  it("rejects svg uploads at schema layer", async () => {
    await expect(
      uploadLandingMedia({
        kind: "logo",
        fileName: "logo.svg",
        mimeType: "image/svg+xml",
        byteSize: 1024,
        fileBase64: Buffer.from("<svg></svg>").toString("base64"),
      }),
    ).rejects.toThrow();
  });

  it("rejects oversized decoded payload", async () => {
    authenticatedContextMock.mockResolvedValue({
      companyId: COMPANY_ID,
      user: { id: "user-1" },
      supabase: {
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn(),
            getPublicUrl: vi.fn(),
          })),
        },
        from: vi.fn(),
      },
    });

    const oversized = Buffer.alloc(11 * 1024 * 1024).toString("base64");
    await expect(
      uploadLandingMedia({
        kind: "banner",
        fileName: "banner.png",
        mimeType: "image/png",
        byteSize: 10 * 1024 * 1024,
        fileBase64: oversized,
      }),
    ).rejects.toThrow("tamanho permitido");
  });
});

describe("landing gallery tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes gallery create to authenticated company", async () => {
    const insert = vi.fn().mockReturnThis();
    const single = vi.fn().mockResolvedValue({ data: { id: GALLERY_ITEM_ID }, error: null });

    authenticatedContextMock.mockResolvedValue({
      companyId: COMPANY_ID,
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "landing_pages") {
            return chainable({ data: { id: LANDING_PAGE_ID }, error: null });
          }
          return { insert, select: vi.fn().mockReturnThis(), single };
        }),
      },
    });

    await createGalleryItem({
      mediaAssetId: MEDIA_ASSET_ID,
      caption: "Foto",
      altText: "Sala",
      enabled: true,
      displayOrder: 0,
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: COMPANY_ID,
        media_asset_id: MEDIA_ASSET_ID,
      }),
    );
  });

  it("scopes gallery update and delete by company_id", async () => {
    const eqCalls: Array<[string, string]> = [];
    const eq = vi.fn((column: string, value: string) => {
      eqCalls.push([column, value]);
      return {
        eq,
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: GALLERY_ITEM_ID }, error: null }),
        }),
      };
    });

    authenticatedContextMock.mockResolvedValue({
      companyId: COMPANY_ID,
      supabase: {
        from: vi.fn(() => ({
          update: vi.fn(() => ({ eq })),
        })),
      },
    });

    await updateGalleryItem(GALLERY_ITEM_ID, { caption: "Nova legenda" });
    await deleteGalleryItem(GALLERY_ITEM_ID);

    expect(eqCalls.filter(([col]) => col === "company_id")).toEqual([
      ["company_id", COMPANY_ID],
      ["company_id", COMPANY_ID],
    ]);
  });
});
