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
                    CHECK (status IN ('inventory','listed','pending','sold','traded','kept','bundled')),
    used_personally BOOLEAN NOT NULL DEFAULT FALSE,
    condition       TEXT CHECK (condition IN ('new','like_new','good','fair','parts')),
    notes           TEXT,
    listed_price    NUMERIC(10,2),
    pending_price   NUMERIC(10,2),
    bundle_id       TEXT,
    bundle_label    TEXT,
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

CREATE TABLE evaluation (
    id                      BIGSERIAL PRIMARY KEY,
    kind                    TEXT NOT NULL DEFAULT 'listing'
                            CHECK (kind IN ('listing','offer')),
    title                   TEXT NOT NULL,
    listing_url             TEXT,
    price                   NUMERIC(10,2) NOT NULL,
    description             TEXT,
    item_id                 BIGINT REFERENCES item(id) ON DELETE SET NULL,
    score                   INTEGER NOT NULL,
    verdict                 TEXT NOT NULL,
    estimated_resale_low    NUMERIC(10,2) NOT NULL,
    estimated_resale_high   NUMERIC(10,2) NOT NULL,
    reasoning               TEXT NOT NULL,
    red_flags               JSONB NOT NULL DEFAULT '[]',
    suggested_offer         NUMERIC(10,2),
    suggested_message       TEXT,
    previous_evaluation_id  BIGINT REFERENCES evaluation(id) ON DELETE SET NULL,
    input_tokens            INTEGER,
    output_tokens           INTEGER,
    cost_usd                NUMERIC(10,4),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evaluation_message (
    id              BIGSERIAL PRIMARY KEY,
    evaluation_id   BIGINT NOT NULL REFERENCES evaluation(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user','assistant')),
    content         TEXT NOT NULL,
    input_tokens    INTEGER,
    output_tokens   INTEGER,
    cost_usd        NUMERIC(10,4),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE flippy_profile (
    id              BIGINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    location        TEXT,
    platforms       TEXT,
    ships_items     BOOLEAN NOT NULL DEFAULT FALSE,
    style_notes     TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
        COUNT(*) FILTER (WHERE status IN ('inventory','listed','pending')) AS items_in_inventory,
        COUNT(*) FILTER (WHERE status = 'kept') AS items_kept,
        COALESCE(SUM(cost_basis) FILTER (WHERE status IN ('sold', 'traded')), 0) AS cost_sold,
        COALESCE(SUM(listed_price) FILTER (WHERE status = 'listed'), 0) AS listed_value,
        COALESCE(SUM(pending_price) FILTER (WHERE status = 'pending'), 0) AS pending_value
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
    COALESCE(ia.total_items, 0) AS total_items,
    COALESCE(ia.listed_value, 0) AS listed_value,
    COALESCE(ia.pending_value, 0) AS pending_value
FROM acquisition a
LEFT JOIN cash_agg c ON c.acquisition_id = a.id
LEFT JOIN item_agg ia ON ia.acquisition_id = a.id;

CREATE VIEW current_inventory AS
SELECT
    i.id, i.name, i.category, i.cost_basis, i.condition,
    i.used_personally, i.notes, i.status, i.listed_price, i.pending_price,
    i.bundle_id, i.bundle_label,
    a.id AS acquisition_id,
    a.description AS acquisition_desc,
    a.acquired_date,
    a.deal_group
FROM item i
JOIN acquisition a ON a.id = i.acquisition_id
WHERE i.status IN ('inventory','listed','pending');

CREATE VIEW summary_stats AS
SELECT
    (SELECT COUNT(*) FROM acquisition) AS total_acquisitions,
    (SELECT COALESCE(SUM(total_cost), 0) FROM acquisition) AS total_invested,
    (SELECT COALESCE(SUM(cash_amount), 0) FROM transaction) AS total_cash_received,
    (SELECT COALESCE(SUM(cash_amount), 0) FROM transaction)
        - (SELECT COALESCE(SUM(cost_basis), 0) FROM item WHERE status IN ('sold', 'traded')) AS total_pnl,
    (SELECT COUNT(*) FROM item WHERE status IN ('inventory','listed','pending')) AS items_in_inventory,
    (SELECT COALESCE(SUM(cost_basis), 0) FROM item WHERE status IN ('inventory','listed','pending')) AS capital_tied_up,
    (SELECT COALESCE(SUM(listed_price), 0) FROM item WHERE status = 'listed') AS listed_value,
    (SELECT COALESCE(SUM(pending_price), 0) FROM item WHERE status = 'pending') AS pending_value
FROM (SELECT 1) AS dummy;
