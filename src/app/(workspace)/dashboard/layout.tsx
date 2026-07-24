import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/navigation/workspace-shell";
import { getCurrentUser } from "@/lib/auth/guards";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import { getCompanyContext } from "@/lib/tenancy/context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getCompanyContext();
  if (!context) {
    const user = await getCurrentUser();
    if (user) redirect("/onboarding");
    redirect("/login");
  }

  const aiEnabled = hasCompanyPermission(context.role, "ai:read");

  return (
    <WorkspaceShell context={context} aiEnabled={aiEnabled}>
      {children}
    </WorkspaceShell>
  );
}
