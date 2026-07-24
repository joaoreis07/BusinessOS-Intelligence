import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyMercadoPagoSignature({
  dataId,
  requestId,
  signatureHeader,
  secret,
}: {
  dataId?: string | null;
  requestId?: string | null;
  signatureHeader?: string | null;
  secret: string;
}) {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.trim().split("=", 2);
      return [key, value];
    }),
  );
  const timestamp = parts.ts;
  const receivedSignature = parts.v1;
  if (!timestamp || !receivedSignature) return false;

  const manifest = [
    dataId ? `id:${dataId.toLowerCase()};` : "",
    requestId ? `request-id:${requestId};` : "",
    `ts:${timestamp};`,
  ].join("");

  const expectedSignature = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const received = Buffer.from(receivedSignature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
