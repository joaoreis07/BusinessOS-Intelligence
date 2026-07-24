import {
  removeMembershipAction,
  updateMembershipRoleAction,
} from "@/app/(workspace)/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listMemberships } from "@/features/memberships";

export default async function MembersPage() {
  const memberships = await listMemberships();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Membros</h1>
        <p className="mt-2 text-[var(--muted)]">
          Gerencie papéis e acesso dos membros da sua empresa.
        </p>
      </header>

      <Card className="p-0">
        <div className="divide-y">
          {memberships.map((membership) => {
            const profile = Array.isArray(membership.profiles)
              ? membership.profiles[0]
              : membership.profiles;
            return (
              <div
                key={membership.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium">{profile?.full_name ?? membership.user_id}</p>
                  <p className="text-sm text-[var(--muted)]">{profile?.phone ?? "Sem telefone"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{membership.role}</Badge>
                  {membership.role !== "owner" ? (
                    <>
                      <form action={updateMembershipRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="membershipId" value={membership.id} />
                        <select
                          name="role"
                          defaultValue={membership.role}
                          className="h-9 rounded-lg border px-2 text-sm"
                        >
                          <option value="admin">admin</option>
                          <option value="manager">manager</option>
                          <option value="employee">employee</option>
                          <option value="member">member</option>
                          <option value="viewer">viewer</option>
                        </select>
                        <button className="rounded-lg border px-3 py-1 text-sm">Salvar</button>
                      </form>
                      <form action={removeMembershipAction}>
                        <input type="hidden" name="membershipId" value={membership.id} />
                        <button className="rounded-lg border px-3 py-1 text-sm">
                          Remover
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
          {!memberships.length ? (
            <div className="p-4 text-sm text-[var(--muted)]">Nenhum membro encontrado.</div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
