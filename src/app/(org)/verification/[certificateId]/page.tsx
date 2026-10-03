import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import { getCertificateById } from "@/lib/db/certificates";
import { getCertificateStatus } from "@/lib/certificate-status";
import { verifyCertificateOnChain } from "@/lib/certificates/verification";
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

export default async function OrgVerificationResultPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const certificate = await getCertificateById(certificateId);
  const chainCheck = certificate ? await verifyCertificateOnChain(certificate) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-950">Certificate Verification</h1>
      <p className="mt-1 text-sm font-medium text-slate-700">Lookup result for a single certificate.</p>

      <div className="mt-6">
        {!certificate ? (
          <Card>
            <CardBody className="space-y-3 text-center">
              <p className="text-base font-semibold text-slate-950">Certificate not found</p>
              <p className="text-sm font-medium text-slate-700">
                No certificate matches ID <span className="font-mono font-bold text-slate-950">{certificateId}</span>.
                Check the ID and try again.
              </p>
              <LinkButton href="/verification" variant="secondary" size="sm">
                Try another ID
              </LinkButton>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {(() => {
              const status = getCertificateStatus(certificate);
              return (
                <div className={`rounded-lg border px-5 py-4 ${STATUS_BANNER[status]}`}>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={status} />
                  </div>
                  <p className="mt-2 text-sm font-medium">{STATUS_MESSAGE[status]}</p>
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
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Recipient
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-950">{certificate.recipientName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Certificate Title
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-950">
                      {certificate.certificateTitle}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Issuing Organization
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-950">
                      {certificate.organizationName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Certificate ID
                    </dt>
                    <dd className="mt-1 font-mono text-sm font-semibold text-slate-950">
                      {certificate.certificateId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Issue Date
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-950">
                      {formatDate(certificate.issueDate, "long")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Expiration Date
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-950">
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
              <CardBody className="space-y-4">
                {chainCheck && (
                  <div
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${
                      chainCheck.matched
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {chainCheck.matched
                      ? "This record was independently confirmed on the blockchain — the on-chain data matches PostgreSQL."
                      : chainCheck.error}
                  </div>
                )}
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Transaction Hash
                    </dt>
                    <dd className="mt-1 break-all font-mono text-sm font-semibold text-slate-950">
                      {certificate.blockchain.transactionHash}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Blockchain Certificate ID
                    </dt>
                    <dd className="mt-1 font-mono text-sm font-semibold text-slate-950">
                      {certificate.blockchain.blockchainCertId}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            <p className="text-center text-sm font-medium text-slate-700">
              <Link href="/verification" className="font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-2">
                Verify another certificate
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
