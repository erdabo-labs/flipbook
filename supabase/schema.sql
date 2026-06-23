CREATE TABLE acquisition (
    id              BIGSERIAL PRIMARY KEY,
    description     TEXT NOT NULL,
    acquired_date   DATE NOT NULL,
    total_cost      NUMERIC(10,2) NOT NULL,
    source          TEXT,
    source_type     TEXT NOT NULL DEFAULT 'flip_purchase'
                    CHECK (source_type IN ('flip_purchase','personal_item','trade_received')),
    deal_group      TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE item (
    id              BIGSERIAL PRIMARY KEY,
    acquisition_id  BIGINT NOT NULL REFERENCES acquisition(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    category        TEXT,
    cost_basis      NUMERIC(10,2) NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'inventory'
                    CHECK (status IN ('inventory','listed','sold','traded','kept','bundled')),
    used_personally BOOLEAN NOT NULL DEFAULT FALSE,
    condition       TEXT CHECK (condition IN ('new','like_new','good','fair','parts')),
    notes           TEXT,
    listed_price    NUMERIC(10,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transaction (
    id               BIGSERIAL PRIMARY KEY,
    type             TEXT NOT NULL
                     CHECK (type IN ('sale','purchase','trade','partial_trade')),
    transaction_date DATE NOT NULL,
    cash_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
    platform         TEXT,
    counterparty     TEXT,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transaction_item (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  BIGINT NOT NULL REFERENCES transaction(id) ON DELETE CASCADE,
    item_id         BIGINT NOT NULL REFERENCES item(id),
    direction       TEXT NOT NULL CHECK (direction IN ('outbound','inbound'))
);

CREATE VIEW acquisition_pnl AS
WITH cash AS (
    SELECT DISTINCT a.id AS acquisition_id, t.id AS transaction_id, t.cash_amount
    FROM acquisition a
    JOIN item i ON i.acquisition_id = a.id
    JOIN transaction_item ti ON ti.item_id = i.id AND ti.direction = 'outbound'
    JOIN transaction t ON t.id = ti.transaction_id
),
cash_agg AS (
    SELECT acquisition_id, COALESCE(SUM(cash_amount), 0) AS cash_received
    FROM cash
    GROUP BY acquisition_id
),
item_agg AS (
    SELECT
        acquisition_id,
        COUNT(*) AS total_items,
        COUNT(*) FILTER (WHERE status = 'inventory') AS items_in_inventory,
        COUNT(*) FILTER (WHERE status = 'kept') AS items_kept,
        COALESCE(SUM(cost_basis) FILTER (WHERE status IN ('sold', 'traded')), 0) AS cost_sold
    FROM item
    GROUP BY acquisition_id
)
SELECT
    a.id,
    a.description,
    a.acquired_date,
    a.source_type,
    a.deal_group,
    a.total_cost,
    COALESCE(c.cash_received, 0) AS cash_received,
    COALESCE(c.cash_received, 0) - COALESCE(ia.cost_sold, 0) AS realized_pnl,
    COALESCE(ia.items_in_inventory, 0) AS items_in_inventory,
    COALESCE(ia.items_kept, 0) AS items_kept,
    COALESCE(ia.total_items, 0) AS total_items
FROM acquisition a
LEFT JOIN cash_agg c ON c.acquisition_id = a.id
LEFT JOIN item_agg ia ON ia.acquisition_id = a.id;

CREATE VIEW current_inventory AS
SELECT
    i.id, i.name, i.category, i.cost_basis, i.condition,
    i.used_personally, i.notes, i.status, i.listed_price,
    a.id AS acquisition_id,
    a.description AS acquisition_desc,
    a.acquired_date,
    a.deal_group
FROM item i
JOIN acquisition a ON a.id = i.acquisition_id
WHERE i.status IN ('inventory','listed');

CREATE VIEW summary_stats AS
SELECT
    (SELECT COUNT(*) FROM acquisition) AS total_acquisitions,
    (SELECT COALESCE(SUM(total_cost), 0) FROM acquisition) AS total_invested,
    (SELECT COALESCE(SUM(cash_amount), 0) FROM transaction) AS total_cash_received,
    (SELECT COALESCE(SUM(cash_amount), 0) FROM transaction)
        - (SELECT COALESCE(SUM(cost_basis), 0) FROM item WHERE status IN ('sold', 'traded')) AS total_pnl,
    (SELECT COUNT(*) FROM item WHERE status IN ('inventory','listed')) AS items_in_inventory,
    (SELECT COALESCE(SUM(cost_basis), 0) FROM item WHERE status IN ('inventory','listed')) AS capital_tied_up
FROM (SELECT 1) AS dummy;
