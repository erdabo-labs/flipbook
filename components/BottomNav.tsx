"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/acquisitions", label: "Deals", icon: "list" },
  { href: "/inventory", label: "Stock", icon: "box" },
  { href: "/metrics", label: "Metrics", icon: "chart" },
];

function Icon({ name }: { name: string }) {
  const common = "h-6 w-6";
  switch (name) {
    case "home":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" />
        </svg>
      );
    case "list":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case "box":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />
        </svg>
      );
    case "plus":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      );
    case "chart":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 20V10m6 10V4m6 16v-7" />
        </svg>
      );
    default:
      return null;
  }
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  function closeSheet() {
    setSheetOpen(false);
  }

  function go(href: string) {
    closeSheet();
    router.push(href);
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#ECEAE3] bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="relative flex h-[86px] items-stretch justify-around">
          {ITEMS.slice(0, 2).map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  active ? "text-[#047857]" : "text-[#B3AFA5]"
                }`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="absolute -top-4 flex h-[58px] w-[58px] items-center justify-center rounded-[17px] bg-[#047857] text-white shadow-[0_8px_18px_-4px_rgba(4,120,87,.5)] active:bg-[#03664A]"
              aria-label="Add"
            >
              <Icon name="plus" />
            </button>
          </div>

          {ITEMS.slice(2).map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  active ? "text-[#047857]" : "text-[#B3AFA5]"
                }`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-[rgba(26,26,23,.32)]"
          onClick={closeSheet}
        >
          <div
            className="w-full rounded-t-[26px] bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#ECEAE3]" />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => go("/acquisitions/new")}
                className="flex min-h-12 items-center rounded-[12px] px-3 text-left text-base font-medium text-[#1A1A17] active:bg-[#F4F2EC]"
              >
                Log a deal
              </button>
              <button
                type="button"
                onClick={() => go("/transactions/new")}
                className="flex min-h-12 items-center rounded-[12px] px-3 text-left text-base font-medium text-[#1A1A17] active:bg-[#F4F2EC]"
              >
                Record a sale
              </button>
              <button
                type="button"
                onClick={() => go("/evaluate")}
                className="flex min-h-12 items-center rounded-[12px] px-3 text-left text-base font-medium text-[#1A1A17] active:bg-[#F4F2EC]"
              >
                Evaluate a deal
              </button>
              <button
                type="button"
                onClick={closeSheet}
                className="flex min-h-12 items-center rounded-[12px] px-3 text-left text-base text-[#8C887D] active:bg-[#F4F2EC]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
