import type { SummaryStats as SummaryStatsType } from "@/lib/types";
import { formatCurrency, pnlColorClass } from "@/lib/format";
import { Card } from "@/components/ui/Card";

function Tile({
  label,
  labelColor,
  value,
  valueColor,
  bg,
  border,
  dotColor,
  dashed,
}: {
  label: string;
  labelColor: string;
  value: string;
  valueColor: string;
  bg: string;
  border: string;
  dotColor: string;
  dashed?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border p-4 ${dashed ? "border-dashed" : ""}`}
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.05em]"
        style={{ color: labelColor }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
        {label}
      </p>
      <p className="mt-1 font-mono text-[21px] font-semibold" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}

export function SummaryStats({ stats }: { stats: SummaryStatsType }) {
  return (
    <div className="flex flex-col gap-3">
      <Card className="!p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#A8A49A]">
          Total profit &amp; loss
        </p>
        <p className={`mt-1 font-mono text-[38px] font-semibold leading-none ${pnlColorClass(stats.total_pnl)}`}>
          {formatCurrency(stats.total_pnl)}
        </p>
        <p className="mt-2 text-sm font-medium text-[#047857]">
          ▲ {formatCurrency(stats.total_pnl)} all-time &middot; {stats.total_acquisitions} deal
          {stats.total_acquisitions === 1 ? "" : "s"} all-time
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Tile
          label="Capital tied up"
          labelColor="#A8A49A"
          value={formatCurrency(stats.capital_tied_up)}
          valueColor="#1A1A17"
          bg="#FFFFFF"
          border="#ECEAE3"
          dotColor="#B3AFA5"
        />
        <Tile
          label="In inventory"
          labelColor="#A8A49A"
          value={String(stats.items_in_inventory)}
          valueColor="#1A1A17"
          bg="#FFFFFF"
          border="#ECEAE3"
          dotColor="#B3AFA5"
        />
        <Tile
          label="Listed"
          labelColor="#B45309"
          value={formatCurrency(stats.listed_value)}
          valueColor="#B45309"
          bg="#FFFDF6"
          border="#F1E4C8"
          dotColor="#B45309"
          dashed
        />
        <Tile
          label="Pending"
          labelColor="#1D4ED8"
          value={formatCurrency(stats.pending_value)}
          valueColor="#1D4ED8"
          bg="#F7F9FF"
          border="#D9E3FB"
          dotColor="#1D4ED8"
        />
      </div>
    </div>
  );
}
