import { AdminSubscriptionsPanel } from "@/components/platform-admin/admin-subscriptions-panel";
import {
  adminSubscriptionsQuerySchema,
  listPlatformSubscriptionsPaginated,
} from "@/features/platform-admin";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const query = adminSubscriptionsQuerySchema.parse({
    page: pickParam(rawParams.page),
    pageSize: pickParam(rawParams.pageSize),
    search: pickParam(rawParams.search),
    status: pickParam(rawParams.status),
  });

  const data = await listPlatformSubscriptionsPaginated(query);
  return <AdminSubscriptionsPanel data={data} query={query} />;
}
