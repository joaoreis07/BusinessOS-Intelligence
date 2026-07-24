import { describe, expect, it } from "vitest";
import { sanitizeSearchTerm, unwrap } from "@/features/_shared/server";

describe("shared server helpers", () => {
  it("sanitizes potentially dangerous search chars", () => {
    expect(sanitizeSearchTerm("  a%b(c)*,d  ")).toBe("abcd");
  });

  it("unwrap returns data when query succeeds", () => {
    const data = unwrap({ data: { id: "1" }, error: null });
    expect(data).toEqual({ id: "1" });
  });

  it("unwrap throws when result has error", () => {
    expect(() =>
      unwrap({ data: null, error: { message: "query failed" } }),
    ).toThrow("query failed");
  });
});
