import { switchCompanyAction } from "@/app/(workspace)/dashboard/actions";

type WorkspaceItem = {
  company_id: string;
  role: string;
  companies:
    | { id: string; name: string; slug: string; status: string; active: boolean }
    | Array<{ id: string; name: string; slug: string; status: string; active: boolean }>
    | null;
};

export function CompanySwitcher({
  workspaces,
  currentCompanyId,
}: {
  workspaces: WorkspaceItem[];
  currentCompanyId: string;
}) {
  const options = workspaces
    .map((workspace) =>
      Array.isArray(workspace.companies)
        ? workspace.companies[0]
        : workspace.companies,
    )
    .filter((company): company is NonNullable<typeof company> => Boolean(company));

  if (options.length <= 1) return null;

  return (
    <form action={switchCompanyAction} className="flex items-center gap-2">
      <input type="hidden" name="companyId" value={currentCompanyId} />
      <label htmlFor="workspace-switcher" className="text-xs text-[var(--muted)]">
        Empresa
      </label>
      <select
        id="workspace-switcher"
        name="companyId"
        defaultValue={currentCompanyId}
        className="h-9 rounded-lg border bg-white px-2 text-sm"
      >
        {options.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
      <button className="h-9 rounded-lg border px-3 text-sm font-medium" type="submit">
        Trocar
      </button>
    </form>
  );
}
