"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getAcquisitionsPnl, getEvaluations } from "@/lib/db-client";
import { formatCurrency } from "@/lib/format";

type Entry = { id: number; title: string; subtitle: string };

export function CollectionLayout({ kind, children }: { kind: "acquisitions" | "evaluations"; children: React.ReactNode }) {
  const pathname = usePathname();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState(false);
  const detail = new RegExp(`^/${kind}/[0-9]+$`).test(pathname);
  useEffect(() => {
    let active = true;
    const request = kind === "acquisitions"
      ? getAcquisitionsPnl().then(rows => rows.map(row => ({ id: row.id, title: row.description, subtitle: formatCurrency(row.total_cost) })))
      : getEvaluations().then(rows => rows.map(row => ({ id: row.id, title: row.title, subtitle: `${row.score}/10 · ${row.kind}` })));
    request.then(rows => { if (active) { setEntries(rows); setError(false); } }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [kind, pathname]);
  return (
    <div className={detail ? "collection-layout" : ""}>
      <aside className="collection-list" aria-label={kind === "acquisitions" ? "Deals" : "Evaluations"} hidden={!detail}>
        <Link href={`/${kind}`} className="mb-4 block text-lg font-bold">{kind === "acquisitions" ? "Deals" : "Flippy"}</Link>
        {error && <p role="status">Could not refresh the list. Reopen this section to retry.</p>}
        <div className="flex flex-col gap-2">
          {entries.map(entry => <Link key={entry.id} href={`/${kind}/${entry.id}`} scroll={false} aria-current={pathname === `/${kind}/${entry.id}` ? "page" : undefined} className="collection-entry">
            <span className="block truncate font-semibold">{entry.title}</span>
            <span className="text-xs text-[#6B6A62]">{entry.subtitle}</span>
          </Link>)}
        </div>
      </aside>
      <div key={pathname} className="collection-detail">{children}</div>
    </div>
  );
}
