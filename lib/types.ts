export type SourceType = "flip_purchase" | "personal_item" | "trade_received";

export type ItemStatus =
  | "inventory"
  | "listed"
  | "sold"
  | "traded"
  | "kept"
  | "bundled";

export type ItemCondition = "new" | "like_new" | "good" | "fair" | "parts";

export type TransactionType = "sale" | "purchase" | "trade" | "partial_trade";

export type TransactionDirection = "outbound" | "inbound";

export interface Acquisition {
  id: number;
  description: string;
  acquired_date: string;
  total_cost: number;
  source: string | null;
  source_type: SourceType;
  deal_group: string | null;
  notes: string | null;
  created_at: string;
}

export interface Item {
  id: number;
  acquisition_id: number;
  name: string;
  category: string | null;
  cost_basis: number;
  status: ItemStatus;
  used_personally: boolean;
  condition: ItemCondition | null;
  notes: string | null;
  created_at: string;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  transaction_date: string;
  cash_amount: number;
  platform: string | null;
  counterparty: string | null;
  notes: string | null;
  created_at: string;
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  item_id: number;
  direction: TransactionDirection;
}

export interface AcquisitionPnl {
  id: number;
  description: string;
  acquired_date: string;
  source_type: SourceType;
  deal_group: string | null;
  total_cost: number;
  cash_received: number;
  realized_pnl: number;
  items_in_inventory: number;
  items_kept: number;
  total_items: number;
}

export interface CurrentInventoryRow {
  id: number;
  name: string;
  category: string | null;
  cost_basis: number;
  condition: ItemCondition | null;
  used_personally: boolean;
  notes: string | null;
  status: ItemStatus;
  acquisition_id: number;
  acquisition_desc: string;
  acquired_date: string;
  deal_group: string | null;
}

export interface SummaryStats {
  total_acquisitions: number;
  total_invested: number;
  total_cash_received: number;
  total_pnl: number;
  items_in_inventory: number;
  capital_tied_up: number;
}

export const SOURCES = [
  "FB Marketplace",
  "KSL",
  "Craigslist",
  "OfferUp",
  "Local",
  "Other",
] as const;

export const CATEGORIES = [
  "Electronics",
  "Cameras",
  "Printers",
  "Drones",
  "Networking",
  "Audio",
  "Tools",
  "Other",
] as const;

export const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "parts", label: "Parts" },
];
