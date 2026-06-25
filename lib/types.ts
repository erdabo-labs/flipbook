export type SourceType = "flip_purchase" | "personal_item" | "trade_received";

export type ItemStatus =
  | "inventory"
  | "listed"
  | "pending"
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
  listed_price: number | null;
  pending_price: number | null;
  bundle_id: string | null;
  bundle_label: string | null;
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
  listed_value: number;
  pending_value: number;
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
  listed_price: number | null;
  pending_price: number | null;
  bundle_id: string | null;
  bundle_label: string | null;
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
  listed_value: number;
  pending_value: number;
}

export type EvaluationKind = "listing" | "offer" | "grade" | "grade_deal" | "sale";

export interface Evaluation {
  id: number;
  kind: EvaluationKind;
  title: string;
  listing_url: string | null;
  price: number;
  description: string | null;
  item_id: number | null;
  score: number;
  verdict: string;
  estimated_resale_low: number;
  estimated_resale_high: number;
  reasoning: string;
  red_flags: string[];
  suggested_offer: number | null;
  suggested_message: string | null;
  previous_evaluation_id: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  notes: string | null;
  created_at: string;
}

export type MessageRole = "user" | "assistant";

export interface EvaluationMessage {
  id: number;
  evaluation_id: number;
  role: MessageRole;
  content: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  created_at: string;
}

export interface FlippyProfile {
  id: number;
  location: string | null;
  platforms: string | null;
  ships_items: boolean;
  style_notes: string | null;
  updated_at: string;
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
