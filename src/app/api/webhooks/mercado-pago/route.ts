import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMercadoPagoSignature } from "@/lib/integrations/mercado-pago-signature";

export async function POST(request: NextRequest) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  }

  const dataId = request.nextUrl.searchParams.get("data.id");
  const requestId = request.headers.get("x-request-id");
  const signatureHeader = request.headers.get("x-signature");

  if (
    !verifyMercadoPagoSignature({
      dataId,
      requestId,
      signatureHeader,
      secret,
    })
  ) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  const payload = await request.json();
  const externalId = String(dataId ?? payload?.data?.id ?? payload?.id ?? requestId);
  const supabase = createAdminClient();
  const { error } = await supabase.from("webhook_events").upsert(
    {
      provider: "mercado_pago",
      external_event_id: externalId,
      event_type: String(payload?.type ?? payload?.action ?? "unknown"),
      payload,
      status: "pending",
      signature_valid: true,
      received_at: new Date().toISOString(),
    },
    { onConflict: "provider,external_event_id" },
  );

  if (error) {
    console.error("Failed to persist Mercado Pago webhook", error);
    return NextResponse.json({ error: "Falha temporária." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
