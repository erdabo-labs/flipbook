"use client";

import { usePathname } from "next/navigation";
import { PwaStatus } from "@/components/PwaStatus";
import { BottomNav } from "@/components/BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenForm = pathname.startsWith("/transactions/new") || pathname.startsWith("/acquisitions/new");

  return (
    <>
      <PwaStatus />
      <main id="main-content" className={`app-main flex-1 ${isFullScreenForm ? "" : "with-navigation"}`}>{children}</main>
      {!isFullScreenForm && <BottomNav />}
    </>
  );
}
