"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Certificate } from "@/lib/types";

interface RevokeModalProps {
  certificate: Certificate | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function RevokeModal({ certificate, onCancel, onConfirm }: RevokeModalProps) {
  const [revoking, setRevoking] = useState(false);

  async function handleConfirm() {
    setRevoking(true);
    await onConfirm();
    setRevoking(false);
  }

  return (
    <Modal
      open={certificate !== null}
      onClose={onCancel}
      title="Revoke Certificate"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={revoking}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirm} disabled={revoking}>
            {revoking ? "Revoking…" : "Revoke Certificate"}
          </Button>
        </>
      }
    >
      {certificate && (
        <p>
          This will permanently mark{" "}
          <span className="font-medium text-slate-900">
            {certificate.certificateNumber}
          </span>{" "}
          issued to <span className="font-medium text-slate-900">
            {certificate.recipientName}
          </span>{" "}
          as revoked. The revocation will be recorded on the blockchain and the
          certificate will show as REVOKED during public verification. This
          cannot be undone.
        </p>
      )}
    </Modal>
  );
}
