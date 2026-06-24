import Link from "next/link";
import type { AcquisitionPnl } from "@/lib/types";
import { formatCurrency, formatPnl, pnlColorClass, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";

export function AcquisitionCard({ acquisition }: { acquisition: AcquisitionPnl }) {
  const isActive = acquisition.items_in_inventory > 0;

  return (
    <Link href={`/acquisitions/${acquisition.id}`}>
      <Card>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[#1A1A17]">{acquisition.description}</p>
            <p className="text-[12px] text-[#8C887D]">
              {formatDate(acquisition.acquired_date)} &middot; {formatCurrency(acquisition.total_cost)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              isActive ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#F1EFE9] text-[#8C887D]"
            }`}
          >
            {isActive ? "Active" : "Closed"}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] text-[#8C887D]">
            {acquisition.total_items} item{acquisition.total_items === 1 ? "" : "s"}
          </span>
          <span className={`font-mono text-base font-semibold ${pnlColorClass(acquisition.realized_pnl)}`}>
            {formatPnl(acquisition.realized_pnl)}
          </span>
        </div>
        {(acquisition.listed_value > 0 || acquisition.pending_value > 0) && (
          <div className="mt-2 flex gap-1.5">
            {acquisition.listed_value > 0 && (
              <span className="rounded-full border border-dashed border-[#ECD9A8] bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-semibold text-[#B45309]">
                Listed {formatCurrency(acquisition.listed_value)} potential
              </span>
            )}
            {acquisition.pending_value > 0 && (
              <span className="rounded-full bg-[#1D4ED8] px-2 py-0.5 text-[10px] font-bold text-white">
                Pending {formatCurrency(acquisition.pending_value)} firm
              </span>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
