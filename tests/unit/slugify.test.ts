import { describe, expect, it } from "vitest";
import { slugifyCompanyName } from "@/lib/strings/slugify";

describe("slugifyCompanyName", () => {
  it("normalizes accents and spaces", () => {
    expect(slugifyCompanyName("Casabella Estética")).toBe("casabella-estetica");
  });

  it("trims invalid characters", () => {
    expect(slugifyCompanyName("  Empresa @ 2026!!  ")).toBe("empresa-2026");
  });
});
