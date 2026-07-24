import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const updateSessionMock = vi.fn();

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: updateSessionMock,
}));

describe("proxy route protection", () => {
  it("redirects unauthenticated users from protected routes", async () => {
    updateSessionMock.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/dashboard");
    const response = await proxy(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("redirects authenticated users away from auth pages", async () => {
    updateSessionMock.mockResolvedValue({
      response: NextResponse.next(),
      user: { id: "user-1" },
    });
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/login");
    const response = await proxy(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard");
  });

  it("keeps request flow for allowed route", async () => {
    const passthrough = NextResponse.next();
    updateSessionMock.mockResolvedValue({
      response: passthrough,
      user: { id: "user-1" },
    });
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/dashboard");
    const response = await proxy(request);
    expect(response.status).toBe(200);
  });
});
