import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { generateNextCertificateNumber } from "@/lib/db/certificates";
import { isSharedEmailConfigured } from "@/lib/email/certificate-email";
import { IssueCertificateForm } from "./IssueCertificateForm";

// Issuing waits for a blockchain confirmation and then sends the email, which
// can take well over the default limit on a real network.
export const maxDuration = 60;

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
