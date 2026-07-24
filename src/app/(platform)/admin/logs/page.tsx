import { AdminLogsPanel } from "@/components/platform-admin/admin-logs-panel";
import { adminLogsQuerySchema, listPlatformActivityLogsPaginated } from "@/features/platform-admin";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLogsPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const query = adminLogsQuerySchema.parse({
    page: pickParam(rawParams.page),
    pageSize: pickParam(rawParams.pageSize),
    search: pickParam(rawParams.search),
    module: pickParam(rawParams.module),
  });

  const data = await listPlatformActivityLogsPaginated(query);
  return <AdminLogsPanel data={data} query={query} />;
}
