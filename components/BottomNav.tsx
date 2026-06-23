"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: "home" },
  { href: "/acquisitions", label: "Deals", icon: "list" },
  { href: "/inventory", label: "Inventory", icon: "box" },
  { href: "/metrics", label: "Metrics", icon: "chart" },
  { href: "/transactions/new", label: "Add", icon: "plus" },
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-stretch justify-around">
        {ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href.split("?")[0]);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
                active ? "text-zinc-900" : "text-zinc-400"
              }`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
