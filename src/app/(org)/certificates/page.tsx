import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listCertificatesByOrganization } from "@/lib/db/certificates";
import { IssuedCertificatesClient } from "./IssuedCertificatesClient";

export default async function IssuedCertificatesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const certificates = await listCertificatesByOrganization(
    currentUser.organization.organizationId
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Issued Certificates</h1>
        <p className="mt-1 text-sm font-medium text-slate-700">
          All certificates issued by your organization.
        </p>
      </div>

      <IssuedCertificatesClient certificates={certificates} />
    </div>
  );
}
