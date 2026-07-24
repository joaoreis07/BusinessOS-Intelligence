import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyMercadoPagoSignature } from "@/lib/integrations/mercado-pago-signature";

describe("verifyMercadoPagoSignature", () => {
  it("accepts a valid Mercado Pago manifest", () => {
    const secret = "test-secret";
    const dataId = "ORDER123";
    const requestId = "request-1";
    const timestamp = "1781009491";
    const manifest = `id:order123;request-id:${requestId};ts:${timestamp};`;
    const signature = createHmac("sha256", secret).update(manifest).digest("hex");

    expect(
      verifyMercadoPagoSignature({
        dataId,
        requestId,
        secret,
        signatureHeader: `ts=${timestamp},v1=${signature}`,
      }),
    ).toBe(true);
  });

  it("rejects a tampered signature", () => {
    expect(
      verifyMercadoPagoSignature({
        dataId: "1",
        requestId: "request-1",
        secret: "test-secret",
        signatureHeader: "ts=1781009491,v1=00",
      }),
    ).toBe(false);
  });
});
