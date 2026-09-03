import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QrPlaceholder } from "@/components/certificates/QrPlaceholder";
import { getCertificateById } from "@/lib/db/certificates";
import { getCertificateStatus } from "@/lib/certificate-status";
import { CertificateActions } from "./CertificateActions";
import { formatDate, formatDateTime } from "@/lib/format";

export default async function CertificateDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const certificate = await getCertificateById(id);
  if (!certificate) notFound();

  const status = getCertificateStatus(certificate);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/certificates"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Issued Certificates
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            {certificate.certificateTitle}
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-500">
            {certificate.certificateNumber}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificate Information</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Certificate ID" value={certificate.certificateId} mono />
            <Field label="Recipient" value={certificate.recipientName} />
            <Field label="Recipient Email" value={certificate.recipientEmail} />
            <Field label="Organization" value={certificate.organizationName} />
            <Field label="Issued By" value={certificate.issuedBy} />
            <Field label="Issue Date" value={formatDate(certificate.issueDate, "long")} />
            <Field
              label="Expiration Date"
              value={formatDate(certificate.expirationDate, "long")}
            />
            <Field label="Status" value={<StatusBadge status={status} />} />
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blockchain Record</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Transaction Hash"
              value={certificate.blockchain.transactionHash}
              mono
              wrap
            />
            <Field
              label="Blockchain Certificate ID"
              value={certificate.blockchain.blockchainCertId}
              mono
            />
            <Field
              label="Recorded At"
              value={formatDateTime(certificate.blockchain.recordedAt)}
            />
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification QR Code</CardTitle>
        </CardHeader>
        <CardBody className="flex justify-center">
          <QrPlaceholder verificationUrl={certificate.verificationUrl} />
        </CardBody>
      </Card>

      <CertificateActions certificate={certificate} status={status} />
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  wrap,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  wrap?: boolean;
}) {
  return (
    <div className={wrap ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-slate-900 ${mono ? "font-mono" : ""} ${
          wrap ? "break-all" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
