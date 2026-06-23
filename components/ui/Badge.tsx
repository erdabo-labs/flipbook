import type { ItemStatus } from "@/lib/types";

const STATUS_STYLES: Record<ItemStatus, string> = {
  inventory: "bg-zinc-100 text-zinc-700",
  listed: "bg-blue-100 text-blue-700",
  sold: "bg-green-100 text-green-700",
  traded: "bg-purple-100 text-purple-700",
  kept: "bg-amber-100 text-amber-700",
  bundled: "bg-teal-100 text-teal-700",
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  inventory: "Inventory",
  listed: "Listed",
  sold: "Sold",
  traded: "Traded",
  kept: "Kept",
  bundled: "Bundled",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-zinc-100 text-zinc-700 ${className}`}
    >
      {children}
    </span>
  );
}
