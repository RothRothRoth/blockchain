import { redirect } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { deriveOrgPrefix } from "@/lib/db/certificates";
import { CertificatePrefixForm } from "./CertificatePrefixForm";
import { isSharedEmailConfigured } from "@/lib/email/certificate-email";
import { EmailAccountForm } from "./EmailAccountForm";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your institution and account details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institution</CardTitle>
        </CardHeader>
        <CardBody className="space-y-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Institution Name
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {currentUser.organization.organizationName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Institution Email
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{currentUser.organization.email}</dd>
            </div>
          </dl>

          <div className="border-t border-slate-200 pt-4">
            <CertificatePrefixForm
              currentPrefix={currentUser.organization.certificatePrefix}
              derivedPrefix={deriveOrgPrefix(currentUser.organization.organizationName)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Delivery</CardTitle>
        </CardHeader>
        <CardBody>
          <EmailAccountForm
            connectedUser={currentUser.organization.mailUser}
            sharedEmail={isSharedEmailConfigured()}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Account</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Name
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{currentUser.user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{currentUser.user.email}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <p className="text-center text-xs text-slate-400">
        Everything above except the certificate number prefix and email delivery is read-only
        for now. Editing those isn&apos;t wired up yet.
      </p>
    </div>
  );
}
