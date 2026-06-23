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
SELECT
    a.id,
    a.description,
    a.acquired_date,
    a.source_type,
    a.deal_group,
    a.total_cost,
    COALESCE(SUM(CASE WHEN ti.direction = 'outbound' THEN t.cash_amount ELSE 0 END), 0) AS cash_received,
    COALESCE(SUM(CASE WHEN ti.direction = 'outbound' THEN t.cash_amount ELSE 0 END), 0) - a.total_cost AS realized_pnl,
    COUNT(CASE WHEN i.status = 'inventory' THEN 1 END) AS items_in_inventory,
    COUNT(CASE WHEN i.status = 'kept'      THEN 1 END) AS items_kept,
    COUNT(i.id) AS total_items
FROM acquisition a
LEFT JOIN item i ON i.acquisition_id = a.id
LEFT JOIN transaction_item ti ON ti.item_id = i.id
LEFT JOIN transaction t ON t.id = ti.transaction_id
GROUP BY a.id;

CREATE VIEW current_inventory AS
SELECT
    i.id, i.name, i.category, i.cost_basis, i.condition,
    i.used_personally, i.notes, i.status,
    a.id AS acquisition_id,
    a.description AS acquisition_desc,
    a.acquired_date,
    a.deal_group
FROM item i
JOIN acquisition a ON a.id = i.acquisition_id
WHERE i.status IN ('inventory','listed');

CREATE VIEW summary_stats AS
SELECT
    COUNT(DISTINCT a.id) AS total_acquisitions,
    COALESCE(SUM(a.total_cost), 0) AS total_invested,
    COALESCE(SUM(CASE WHEN ti.direction = 'outbound' THEN t.cash_amount ELSE 0 END), 0) AS total_cash_received,
    COALESCE(SUM(CASE WHEN ti.direction = 'outbound' THEN t.cash_amount ELSE 0 END), 0) - COALESCE(SUM(a.total_cost), 0) AS total_pnl,
    COUNT(CASE WHEN i.status IN ('inventory','listed') THEN 1 END) AS items_in_inventory,
    COALESCE(SUM(CASE WHEN i.status IN ('inventory','listed') THEN i.cost_basis ELSE 0 END), 0) AS capital_tied_up
FROM acquisition a
LEFT JOIN item i ON i.acquisition_id = a.id
LEFT JOIN transaction_item ti ON ti.item_id = i.id
LEFT JOIN transaction t ON t.id = ti.transaction_id;
