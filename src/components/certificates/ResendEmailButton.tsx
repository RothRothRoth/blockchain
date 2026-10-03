"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { resendCertificateEmail } from "@/lib/certificates/actions";

export function ResendEmailButton({
  certificateId,
  label = "Resend Certificate",
  variant = "secondary",
}: {
  certificateId: string;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleClick() {
    if (pending) return;
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await resendCertificateEmail(certificateId));
      } catch {
        setResult({ ok: false, message: "Something went wrong while sending. Please try again." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button type="button" variant={variant} onClick={handleClick} disabled={pending}>
        {pending ? "Sending…" : label}
      </Button>
      {result && (
        <p
          role="status"
          className={`max-w-sm text-xs font-semibold ${result.ok ? "text-emerald-700" : "text-red-700"}`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
