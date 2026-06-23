import Link from "next/link";
import type { AcquisitionPnl } from "@/lib/types";
import { formatCurrency, formatPnl, pnlColorClass, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function AcquisitionCard({ acquisition }: { acquisition: AcquisitionPnl }) {
  const isActive = acquisition.items_in_inventory > 0;

  return (
    <Link href={`/acquisitions/${acquisition.id}`}>
      <Card className="active:bg-zinc-50">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900">{acquisition.description}</p>
            <p className="text-sm text-zinc-500">
              {formatDate(acquisition.acquired_date)} &middot; {formatCurrency(acquisition.total_cost)}
            </p>
          </div>
          <Badge className={isActive ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600"}>
            {isActive ? "Active" : "Closed"}
          </Badge>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            {acquisition.total_items} item{acquisition.total_items === 1 ? "" : "s"}
          </span>
          <span className={`text-base font-semibold ${pnlColorClass(acquisition.realized_pnl)}`}>
            {formatPnl(acquisition.realized_pnl)}
          </span>
        </div>
        {(acquisition.listed_value > 0 || acquisition.pending_value > 0) && (
          <p className="mt-1 text-xs text-zinc-400">
            Potential: {formatCurrency(acquisition.listed_value + acquisition.pending_value)}
          </p>
        )}
      </Card>
    </Link>
  );
}
