import { AdminUsersPanel } from "@/components/platform-admin/admin-users-panel";
import { adminListSchema, listPlatformUsersPaginated } from "@/features/platform-admin";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const query = adminListSchema.parse({
    page: pickParam(rawParams.page),
    pageSize: pickParam(rawParams.pageSize),
    search: pickParam(rawParams.search),
  });

  const data = await listPlatformUsersPaginated(query);
  return <AdminUsersPanel data={data} query={query} />;
}
