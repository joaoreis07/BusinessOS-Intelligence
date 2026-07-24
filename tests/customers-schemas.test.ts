import { describe, expect, it } from "vitest";

import {
  customerIdSchema,
  customerSchema,
  customerStatusSchema,
  listCustomersQuerySchema,
} from "@/features/customers/schemas";

describe("customerSchema", () => {
  it("accepts a valid customer payload", () => {
    const parsed = customerSchema.parse({
      name: "Maria Silva",
      email: "maria@example.com",
      phone: "11999998888",
      status: "new",
    });

    expect(parsed.name).toBe("Maria Silva");
    expect(parsed.status).toBe("new");
  });
});

describe("listCustomersQuerySchema", () => {
  it("defaults pagination values", () => {
    const parsed = listCustomersQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
    expect(parsed.sort).toBe("name_asc");
  });

  it("accepts status filter", () => {
    const parsed = listCustomersQuerySchema.parse({ status: "active" });
    expect(parsed.status).toBe("active");
  });
});

describe("customerStatusSchema", () => {
  it("rejects invalid status", () => {
    expect(() => customerStatusSchema.parse("archived")).toThrow();
  });
});

describe("customerIdSchema", () => {
  it("rejects invalid ids", () => {
    expect(() => customerIdSchema.parse("invalid")).toThrow();
  });
});
