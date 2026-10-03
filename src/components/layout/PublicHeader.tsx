import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { BankIcon } from "@/components/ui/icons";

interface PublicHeaderProps {
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
}

export function PublicHeader({
  actionHref = "/login",
  actionLabel = "Institution Login",
  actionIcon = <BankIcon />,
}: PublicHeaderProps) {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={38} />
          <span className="text-base font-semibold tracking-tight text-slate-900">Certi</span>
        </Link>
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-lg border border-teal-700/30 px-3.5 py-1.5 text-sm font-semibold text-teal-800 hover:bg-teal-50"
        >
          {actionIcon}
          {actionLabel}
        </Link>
      </div>
    </header>
  );
}
