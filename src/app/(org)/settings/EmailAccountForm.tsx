"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import {
  connectMailAccountAction,
  disconnectMailAccountAction,
  MailAccountState,
} from "@/lib/organizations/actions";

const initialState: MailAccountState = {};

export function EmailAccountForm({
  connectedUser,
  sharedEmail,
}: {
  connectedUser: string | null;
  sharedEmail: boolean;
}) {
  const [connectState, connectAction, connecting] = useActionState(
    connectMailAccountAction,
    initialState
  );
  const [disconnectState, disconnectAction, disconnecting] = useActionState(
    disconnectMailAccountAction,
    initialState
  );

  return (
    <div className="space-y-4">
      {connectedUser ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <p className="text-sm font-semibold text-emerald-900">
            Connected: certificates are emailed from{" "}
            <span className="font-mono">{connectedUser}</span>
          </p>
          <form action={disconnectAction}>
            <Button type="submit" variant="secondary" size="sm" disabled={disconnecting}>
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </Button>
          </form>
        </div>
      ) : sharedEmail ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
          Certificates are emailed automatically using the app&apos;s shared email account. This is
          optional: connect your own Gmail below only if you want them sent from your
          institute&apos;s address instead.
        </p>
      ) : (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-900">
          Not connected. Issued certificates can&apos;t be emailed until you connect a Gmail
          account.
        </p>
      )}
      {disconnectState.error && <p className="text-sm text-red-600">{disconnectState.error}</p>}

      <form action={connectAction} className="space-y-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Gmail Address" htmlFor="mailUser">
            <Input
              id="mailUser"
              name="mailUser"
              type="email"
              autoComplete="off"
              placeholder="institute@gmail.com"
              defaultValue={connectedUser ?? ""}
            />
          </FormField>
          <FormField label="App Password" htmlFor="mailPassword">
            <Input
              id="mailPassword"
              name="mailPassword"
              type="password"
              autoComplete="new-password"
              placeholder={connectedUser ? "Enter a new one to replace it" : "16-letter App Password"}
            />
          </FormField>
        </div>

        <ol className="list-decimal space-y-1 pl-4 text-xs font-medium text-slate-600">
          <li>Turn on 2-Step Verification for the Gmail account (Google requires it).</li>
          <li>
            Create an App Password at{" "}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal-800 underline underline-offset-2"
            >
              myaccount.google.com/apppasswords
            </a>{" "}
            (it&apos;s a separate 16-letter password, not your normal one).
          </li>
          <li>Paste it above and connect. It&apos;s checked with Google and stored encrypted.</li>
        </ol>

        {connectState.error && <p className="text-sm font-semibold text-red-600">{connectState.error}</p>}
        {connectState.success && (
          <p className="text-sm font-semibold text-teal-700">{connectState.success}</p>
        )}

        <Button type="submit" size="sm" disabled={connecting}>
          {connecting ? "Checking with Google…" : connectedUser ? "Update Account" : "Connect Gmail"}
        </Button>
      </form>
    </div>
  );
}
