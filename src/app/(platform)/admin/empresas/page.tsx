import { AdminCompaniesPanel } from "@/components/platform-admin/admin-companies-panel";
import {
  adminCompaniesQuerySchema,
  listPlatformCompaniesPaginated,
} from "@/features/platform-admin";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCompaniesPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const query = adminCompaniesQuerySchema.parse({
    page: pickParam(rawParams.page),
    pageSize: pickParam(rawParams.pageSize),
    search: pickParam(rawParams.search),
    status: pickParam(rawParams.status),
  });

  const data = await listPlatformCompaniesPaginated(query);
  return <AdminCompaniesPanel data={data} query={query} />;
}
