import { redirect } from "next/navigation";

import { SubscriptionPanel } from "@/components/subscriptions/subscription-panel";
import {
  getSubscriptionPageData,
  listSubscriptionPaymentsQuerySchema,
  resolveSubscriptionPanelCapabilities,
} from "@/features/subscriptions";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import { requireCompanyContext } from "@/lib/tenancy/context";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SubscriptionPage({ searchParams }: PageProps) {
  const context = await requireCompanyContext();
  if (!hasCompanyPermission(context.role, "subscription:manage")) {
    redirect("/dashboard");
  }

  const rawParams = await searchParams;
  const paymentsQuery = listSubscriptionPaymentsQuerySchema.parse({
    page: pickParam(rawParams.page),
    pageSize: pickParam(rawParams.pageSize),
  });

  const data = await getSubscriptionPageData(paymentsQuery);
  const checkout = pickParam(rawParams.checkout);
  const checkoutNotice =
    checkout === "success"
      ? "Checkout concluído. A assinatura será atualizada após confirmação do Mercado Pago."
      : checkout === "cancelled"
        ? "Checkout cancelado."
        : null;

  return (
    <SubscriptionPanel
      {...data}
      capabilities={resolveSubscriptionPanelCapabilities(context.role)}
      checkoutNotice={checkoutNotice}
    />
  );
}
