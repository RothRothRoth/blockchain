import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { GradientBackdrop } from "@/components/layout/GradientBackdrop";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import { getCertificateById } from "@/lib/db/certificates";
import { getCertificateStatus } from "@/lib/certificate-status";
import { CertificateStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

const STATUS_BANNER: Record<CertificateStatus, string> = {
  valid: "bg-green-50 border-green-200 text-green-800",
  expired: "bg-slate-100 border-slate-200 text-slate-700",
  revoked: "bg-red-50 border-red-200 text-red-800",
};

const STATUS_MESSAGE: Record<CertificateStatus, string> = {
  valid: "This certificate is valid and was issued by the organization shown below.",
  expired: "This certificate has expired and is no longer valid.",
  revoked: "This certificate has been revoked by the issuing organization.",
};

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const certificate = await getCertificateById(certificateId);

  return (
    <div className="flex min-h-screen flex-col">
      <GradientBackdrop />
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-12">
        {!certificate ? (
          <Card>
            <CardBody className="space-y-3 text-center">
              <p className="text-base font-medium text-slate-900">
                Certificate not found
              </p>
              <p className="text-sm text-slate-500">
                No certificate matches ID{" "}
                <span className="font-mono">{certificateId}</span>. Check the ID
                and try again.
              </p>
              <LinkButton href="/verify" variant="secondary" size="sm">
                Try another ID
              </LinkButton>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {(() => {
              const status = getCertificateStatus(certificate);
              return (
                <div
                  className={`rounded-lg border px-5 py-4 ${STATUS_BANNER[status]}`}
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={status} />
                  </div>
                  <p className="mt-2 text-sm">{STATUS_MESSAGE[status]}</p>
                </div>
              );
            })()}

            <Card>
              <CardHeader>
                <CardTitle>Certificate Details</CardTitle>
              </CardHeader>
              <CardBody>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Recipient
                    </dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {certificate.recipientName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Certificate Title
                    </dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {certificate.certificateTitle}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Issuing Organization
                    </dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {certificate.organizationName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Certificate ID
                    </dt>
                    <dd className="mt-1 font-mono text-sm text-slate-900">
                      {certificate.certificateId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Issue Date
                    </dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {formatDate(certificate.issueDate, "long")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Expiration Date
                    </dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {formatDate(certificate.expirationDate, "long")}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blockchain Verification</CardTitle>
              </CardHeader>
              <CardBody>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Transaction Hash
                    </dt>
                    <dd className="mt-1 break-all font-mono text-sm text-slate-900">
                      {certificate.blockchain.transactionHash}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Blockchain Certificate ID
                    </dt>
                    <dd className="mt-1 font-mono text-sm text-slate-900">
                      {certificate.blockchain.blockchainCertId}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            <p className="text-center text-sm text-slate-500">
              <Link href="/verify" className="text-teal-700 hover:text-teal-800">
                Verify another certificate
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
