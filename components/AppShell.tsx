"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenForm = pathname.startsWith("/transactions/new") || pathname.startsWith("/acquisitions/new");

  return (
    <>
      <main className={`flex-1 ${isFullScreenForm ? "" : "pb-20 md:pb-6"}`}>{children}</main>
      {!isFullScreenForm && <BottomNav />}
    </>
  );
}
