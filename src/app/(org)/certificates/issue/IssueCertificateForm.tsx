"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { ResendEmailButton } from "@/components/certificates/ResendEmailButton";
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

export function IssueCertificateForm({
  suggestedNumber,
  mailUser,
  sharedEmail,
}: {
  suggestedNumber: string;
  mailUser: string | null;
  sharedEmail: boolean;
}) {
  const [state, formAction, pending] = useActionState(issueCertificate, initialState);
  const [editingNumber, setEditingNumber] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/certificates"
          className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:text-teal-950 transition-colors"
        >
          ← Issued Certificates
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Issue Certificate</h1>
        <p className="mt-1 text-sm font-medium text-slate-700">
          Issue a new digital certificate to a recipient.
        </p>
      </div>

      {state.success && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardBody className="space-y-2.5">
            <p className="text-sm font-bold text-emerald-950">
              {state.success.email.sent
                ? `Certificate ${state.success.certificateNumber} issued and emailed successfully.`
                : `Certificate ${state.success.certificateNumber} issued successfully and recorded on the blockchain.`}
            </p>
            <dl className="grid grid-cols-1 gap-2 text-xs text-emerald-900 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-emerald-800">Transaction hash</dt>
                <dd className="break-all font-mono font-bold text-emerald-950">{state.success.transactionHash}</dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-800">Recorded at</dt>
                <dd className="font-bold text-emerald-950">{new Date(state.success.recordedAt).toLocaleString()}</dd>
              </div>
            </dl>
            {state.success.email.sent ? (
              <p className="text-xs font-semibold text-emerald-800">
                {state.success.email.message}
              </p>
            ) : (
              <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
                <p className="text-xs font-bold text-amber-900">
                  Certificate issued successfully, but the email could not be sent.
                </p>
                <p className="text-xs font-medium text-amber-900">{state.success.email.message}</p>
                <p className="text-xs font-medium text-amber-900">
                  The certificate itself is unaffected. You can try again now, or resend it later
                  from the certificate page.
                </p>
                <ResendEmailButton
                  certificateId={state.success.certificateId}
                  label="Resend Email"
                />
              </div>
            )}
            <Link
              href={`/certificates/${state.success.certificateId}`}
              className="inline-block text-sm font-bold text-emerald-950 underline underline-offset-2 hover:text-emerald-800"
            >
              View certificate →
            </Link>
          </CardBody>
        </Card>
      )}

      {state.error && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <p className="text-sm font-bold text-red-800">{state.error}</p>
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

              <FormField
                label="Recipient Email"
                htmlFor="recipientEmail"
                required
                hint={
                  mailUser
                    ? `The certificate PDF will be emailed to this address from ${mailUser} after issuance.`
                    : sharedEmail
                      ? "The certificate PDF will be emailed to this address after issuance."
                      : "The certificate PDF will be emailed to this address after issuance. Connect your Gmail account in Settings first so it can be sent."
                }
              >
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
                hint={
                  editingNumber
                    ? "Must be unique across all institutions."
                    : "Auto-generated for you. Click Edit to set your own."
                }
              >
                <div className="flex items-center gap-2">
                  <Input
                    id="certificateNumber"
                    name="certificateNumber"
                    required
                    defaultValue={suggestedNumber}
                    readOnly={!editingNumber}
                    className={!editingNumber ? "bg-slate-100 font-mono font-semibold text-slate-900 border-slate-300" : "font-mono font-semibold text-slate-900"}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingNumber((prev) => !prev)}
                    className="shrink-0 text-xs font-bold text-teal-800 hover:text-teal-950 underline underline-offset-2"
                  >
                    {editingNumber ? "Auto" : "Edit"}
                  </button>
                </div>
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
              <span className="text-xs font-semibold text-slate-600">
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
          <ol className="list-decimal space-y-2 pl-4 text-sm font-semibold text-slate-700">
            {PIPELINE_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
