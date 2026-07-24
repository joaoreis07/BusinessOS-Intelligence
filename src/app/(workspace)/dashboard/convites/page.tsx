import {
  cancelInvitationAction,
  createInvitationAction,
  resendInvitationAction,
} from "@/app/(workspace)/dashboard/actions";
import { AuthForm } from "@/components/forms/auth-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listCompanyInvitations } from "@/features/invitations";

export default async function InvitationsPage() {
  const invitations = await listCompanyInvitations();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Convites</h1>
        <p className="mt-2 text-[var(--muted)]">
          Convide membros para sua empresa com controle de papel e expiração.
        </p>
      </header>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Novo convite</h2>
        <AuthForm
          action={createInvitationAction}
          submitLabel="Enviar convite"
          fields={[
            { name: "email", label: "E-mail", type: "email" },
            {
              kind: "select",
              name: "role",
              label: "Papel",
              options: [
                { value: "admin", label: "Admin" },
                { value: "manager", label: "Manager" },
                { value: "employee", label: "Employee" },
                { value: "member", label: "Member" },
                { value: "viewer", label: "Viewer" },
              ],
            },
            { name: "expiresInDays", label: "Expira em (dias)", type: "number" },
          ]}
        />
      </Card>

      <Card className="p-0">
        <div className="divide-y">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{invitation.email}</p>
                <p className="text-sm text-[var(--muted)]">
                  Papel: {invitation.role} · Expira em{" "}
                  {new Intl.DateTimeFormat("pt-BR").format(new Date(invitation.expires_at))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{invitation.status}</Badge>
                {invitation.status === "pending" ? (
                  <>
                    <form action={resendInvitationAction}>
                      <input type="hidden" name="invitationId" value={invitation.id} />
                      <button className="rounded-lg border px-3 py-1 text-sm">Reenviar</button>
                    </form>
                    <form action={cancelInvitationAction}>
                      <input type="hidden" name="invitationId" value={invitation.id} />
                      <button className="rounded-lg border px-3 py-1 text-sm">Cancelar</button>
                    </form>
                  </>
                ) : null}
              </div>
            </div>
          ))}
          {!invitations.length ? (
            <div className="p-4 text-sm text-[var(--muted)]">
              Nenhum convite criado até o momento.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
