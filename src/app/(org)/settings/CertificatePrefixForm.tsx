"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import {
  updateCertificatePrefixAction,
  UpdateCertificatePrefixState,
} from "@/lib/organizations/actions";

const initialState: UpdateCertificatePrefixState = {};

export function CertificatePrefixForm({
  currentPrefix,
  derivedPrefix,
}: {
  currentPrefix: string | null;
  derivedPrefix: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateCertificatePrefixAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <FormField
        label="Certificate Number Prefix"
        htmlFor="certificatePrefix"
        hint={
          currentPrefix
            ? `Certificates are numbered like "${currentPrefix}-${new Date().getFullYear()}-00001".`
            : `Set a prefix to match your institution's own numbering (e.g. "${derivedPrefix}"), then save. New certificates will suggest numbers like "${derivedPrefix}-${new Date().getFullYear()}-00001" until you do.`
        }
      >
        <Input
          id="certificatePrefix"
          name="certificatePrefix"
          defaultValue={currentPrefix ?? ""}
          placeholder={derivedPrefix}
          maxLength={16}
        />
      </FormField>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-teal-700">Saved.</p>}

      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save Prefix"}
      </Button>
    </form>
  );
}
