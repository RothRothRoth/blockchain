"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { issueCertificate, IssueCertificateState } from "@/lib/certificates/actions";

const initialState: IssueCertificateState = {};

const PIPELINE_STEPS = [
  "Store the certificate record in PostgreSQL",
  "Generate the PDF certificate",
  "Generate the QR verification code",
  "Record the certificate on the blockchain",
  "Send an email notification to the recipient",
];

const TODAY = new Date().toISOString().slice(0, 10);

export default function IssueCertificatePage() {
  const [state, formAction, pending] = useActionState(issueCertificate, initialState);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Issue Certificate</h1>
        <p className="mt-1 text-sm text-slate-500">
          Issue a new digital certificate to a recipient.
        </p>
      </div>

      {state.success && (
        <Card className="border-green-200 bg-green-50">
          <CardBody className="space-y-2">
            <p className="text-sm font-medium text-green-800">
              Certificate {state.success.certificateNumber} issued and recorded on the
              blockchain.
            </p>
            <dl className="grid grid-cols-1 gap-1 text-xs text-green-700 sm:grid-cols-2">
              <div>
                <dt className="font-medium">Transaction hash</dt>
                <dd className="break-all font-mono">{state.success.transactionHash}</dd>
              </div>
              <div>
                <dt className="font-medium">Recorded at</dt>
                <dd>{new Date(state.success.recordedAt).toLocaleString()}</dd>
              </div>
            </dl>
            <p className="text-xs text-green-700">
              PDF generation, QR code image rendering, and email notification are not yet
              connected. The record, verification link, and blockchain transaction above are
              real.
            </p>
            <Link
              href={`/certificates/${state.success.certificateId}`}
              className="inline-block text-sm font-medium text-green-800 underline"
            >
              View certificate →
            </Link>
          </CardBody>
        </Card>
      )}

      {state.error && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <p className="text-sm text-red-700">{state.error}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Certificate Details</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Recipient Name" htmlFor="recipientName" required>
                <Input id="recipientName" name="recipientName" required placeholder="Jane Doe" />
              </FormField>

              <FormField label="Recipient Email" htmlFor="recipientEmail" required>
                <Input
                  id="recipientEmail"
                  name="recipientEmail"
                  type="email"
                  required
                  placeholder="jane.doe@example.com"
                />
              </FormField>

              <FormField
                label="Certificate Title"
                htmlFor="certificateTitle"
                required
                hint="E.g. Full-Stack Web Development"
              >
                <Input id="certificateTitle" name="certificateTitle" required />
              </FormField>

              <FormField
                label="Certificate Number / ID"
                htmlFor="certificateNumber"
                required
              >
                <Input
                  id="certificateNumber"
                  name="certificateNumber"
                  required
                  placeholder="MTI-2026-00151"
                />
              </FormField>

              <FormField label="Issue Date" htmlFor="issueDate" required>
                <Input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  required
                  defaultValue={TODAY}
                />
              </FormField>

              <FormField
                label="Expiration Date"
                htmlFor="expirationDate"
                hint="Leave blank if the certificate does not expire"
              >
                <Input id="expirationDate" name="expirationDate" type="date" />
              </FormField>
            </div>

            <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
              <Button type="submit" disabled={pending}>
                {pending ? "Issuing…" : "Issue Certificate"}
              </Button>
              <span className="text-xs text-slate-400">
                All fields marked * are required
              </span>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What happens after you submit</CardTitle>
        </CardHeader>
        <CardBody>
          <ol className="list-decimal space-y-1.5 pl-4 text-sm text-slate-600">
            {PIPELINE_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
