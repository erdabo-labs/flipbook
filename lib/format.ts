export function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPnl(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${formatCurrency(amount)}`;
}

export function pnlColorClass(amount: number): string {
  if (amount > 0) return "text-green-600";
  if (amount < 0) return "text-red-600";
  return "text-zinc-500";
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : ""));
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === now.getFullYear()
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" };
  return d.toLocaleDateString("en-US", opts);
}

export function daysSince(dateStr: string): number {
  const d = new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : ""));
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
