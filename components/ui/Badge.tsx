import type { ItemStatus } from "@/lib/types";

const STATUS_STYLES: Record<ItemStatus, string> = {
  inventory: "bg-[#F4F2EC] text-[#8C887D]",
  listed:
    "bg-[#FFFBEB] text-[#B45309] border border-dashed border-[#ECD9A8] font-semibold",
  pending: "bg-[#1D4ED8] text-white font-bold",
  sold: "bg-[#ECFDF5] text-[#047857]",
  traded: "bg-purple-100 text-purple-700",
  kept: "bg-amber-100 text-amber-700",
  bundled: "bg-teal-100 text-teal-700",
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  inventory: "Inventory",
  listed: "Listed",
  pending: "Pending sale",
  sold: "Sold",
  traded: "Traded",
  kept: "Kept",
  bundled: "Bundled",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide ${STATUS_STYLES[status]}`}
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-[#F4F2EC] text-[#8C887D] ${className}`}
    >
      {children}
    </span>
  );
}
