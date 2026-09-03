"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { GradientBackdrop } from "@/components/layout/GradientBackdrop";
import { UserMenu } from "@/components/layout/UserMenu";
import { GridIcon, ListIcon, FilePlusIcon, ShieldIcon } from "@/components/ui/icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: GridIcon },
  { href: "/certificates", label: "Certificates", icon: ListIcon },
  { href: "/certificates/issue", label: "Issue Certificate", icon: FilePlusIcon },
  { href: "/verify", label: "Verification", icon: ShieldIcon },
];

interface OrgShellProps {
  organizationName: string;
  children: ReactNode;
}

export function OrgShell({ organizationName, children }: OrgShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen">
      <GradientBackdrop />

      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 justify-self-start">
          <Logo size={38} />
          <span className="hidden text-base font-semibold tracking-tight text-slate-900 sm:inline">
            Certi
          </span>
        </Link>

        <nav className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-full bg-gradient-to-r from-teal-800 via-teal-900 to-emerald-950 px-2 py-2 shadow-lg sm:gap-1.5">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/certificates"
                ? pathname === "/certificates"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-teal-100/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <UserMenu organizationName={organizationName} />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
