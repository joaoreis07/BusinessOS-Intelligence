import { describe, expect, it } from "vitest";
import { publicSlugSchema } from "@/features/landing/schemas";
import { isReservedPublicSlug, RESERVED_PUBLIC_SLUGS } from "@/features/landing/reserved-slugs";

describe("reserved public slugs", () => {
  it("blocks all system reserved slugs", () => {
    for (const slug of RESERVED_PUBLIC_SLUGS) {
      expect(isReservedPublicSlug(slug)).toBe(true);
      expect(() => publicSlugSchema.parse(slug)).toThrow();
    }
  });

  it("allows tenant slugs outside reserved list", () => {
    expect(publicSlugSchema.parse("clinica-saude")).toBe("clinica-saude");
    expect(publicSlugSchema.parse("dra-ana-dermato")).toBe("dra-ana-dermato");
  });

  it("rejects reserved slug case-insensitively", () => {
    expect(isReservedPublicSlug("DASHBOARD")).toBe(true);
    expect(() => publicSlugSchema.parse("Login")).toThrow();
  });
});
