import type { SummaryStats as SummaryStatsType } from "@/lib/types";
import { formatCurrency, formatPnl, pnlColorClass } from "@/lib/format";
import { Card } from "@/components/ui/Card";

export function SummaryStats({ stats }: { stats: SummaryStatsType }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <p className="text-xs font-medium text-zinc-500">Total P&L</p>
        <p className={`mt-1 text-2xl font-semibold ${pnlColorClass(stats.total_pnl)}`}>
          {formatPnl(stats.total_pnl)}
        </p>
      </Card>
      <Card>
        <p className="text-xs font-medium text-zinc-500">Capital tied up</p>
        <p className="mt-1 text-2xl font-semibold">{formatCurrency(stats.capital_tied_up)}</p>
      </Card>
      <Card>
        <p className="text-xs font-medium text-zinc-500">Items in inventory</p>
        <p className="mt-1 text-2xl font-semibold">{stats.items_in_inventory}</p>
      </Card>
      <Card>
        <p className="text-xs font-medium text-zinc-500">Total deals</p>
        <p className="mt-1 text-2xl font-semibold">{stats.total_acquisitions}</p>
      </Card>
    </div>
  );
}
