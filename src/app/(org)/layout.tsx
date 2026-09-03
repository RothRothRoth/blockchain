import { redirect } from "next/navigation";
import { OrgShell } from "@/components/layout/OrgShell";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  return (
    <OrgShell organizationName={currentUser.organization.organizationName}>{children}</OrgShell>
  );
}
