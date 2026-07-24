import { redirect } from "next/navigation";

import { PlatformAdminShell } from "@/components/platform-admin/platform-admin-shell";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requirePlatformAdmin();
  } catch {
    redirect("/dashboard");
  }

  return <PlatformAdminShell>{children}</PlatformAdminShell>;
}
