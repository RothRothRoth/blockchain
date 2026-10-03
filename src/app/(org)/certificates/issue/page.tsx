import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { generateNextCertificateNumber } from "@/lib/db/certificates";
import { isSharedEmailConfigured } from "@/lib/email/certificate-email";
import { IssueCertificateForm } from "./IssueCertificateForm";

export default async function IssueCertificatePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const suggestedNumber = await generateNextCertificateNumber(
    currentUser.organization.organizationId,
    currentUser.organization.organizationName,
    currentUser.organization.certificatePrefix
  );

  return (
    <IssueCertificateForm
      suggestedNumber={suggestedNumber}
      mailUser={currentUser.organization.mailUser}
      sharedEmail={isSharedEmailConfigured()}
    />
  );
}
