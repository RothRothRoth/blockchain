import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VerificationQrCode } from "@/components/certificates/VerificationQrCode";
import { getCertificateById } from "@/lib/db/certificates";
import { getCertificateStatus } from "@/lib/certificate-status";
import { generateQrCodeDataUrl } from "@/lib/qrcode";
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
  const qrDataUrl = await generateQrCodeDataUrl(certificate.verificationUrl);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/certificates"
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:text-teal-950 transition-colors"
          >
            ← Issued Certificates
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {certificate.certificateTitle}
          </h1>
          <p className="mt-1.5 inline-flex items-center font-mono text-xs font-semibold text-slate-800 bg-slate-100/90 px-2.5 py-0.5 rounded border border-slate-200">
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
          <VerificationQrCode
            qrDataUrl={qrDataUrl}
            verificationUrl={certificate.verificationUrl}
          />
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
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm font-semibold text-slate-950 ${mono ? "font-mono" : ""} ${
          wrap ? "break-all" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
