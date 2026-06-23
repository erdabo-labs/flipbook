INSERT INTO acquisition (description, acquired_date, total_cost, source, source_type, notes) VALUES
('Bambu P2S bundle', '2024-11-01', 600.00, 'FB Marketplace', 'flip_purchase', 'P2S + 2 filament dryers + 3 spools + AMS 2 AC adapter'),
('Mac Mini M4', '2024-11-15', 550.00, 'FB Marketplace', 'flip_purchase', null),
('iPad Pro + keyboard + pencil', '2024-12-01', 950.00, 'KSL', 'flip_purchase', null),
('HomePod 2s (pair)', '2024-12-01', 200.00, 'KSL', 'flip_purchase', 'deal_group: apple-haul-dec24 — replaced old HomePods'),
('MacBook Neo', '2024-12-01', 500.00, 'KSL', 'flip_purchase', 'deal_group: apple-haul-dec24'),
('Unifi travel router', '2024-12-10', 90.00, 'FB Marketplace', 'flip_purchase', null),
('Canon RF 24-105 F4 L', '2022-03-01', 650.00, 'FB Marketplace', 'personal_item', 'Used personally for ~2 years');

INSERT INTO item (acquisition_id, name, category, cost_basis, status, used_personally) VALUES
(1, 'Bambu P2S printer', 'Printers', 400.00, 'traded', false),
(1, 'Bambu AMS 2 AC adapter', 'Printers', 50.00, 'inventory', false),
(1, 'Polymaker filament dryers (x2)', 'Printers', 100.00, 'inventory', false),
(1, 'Filament spools (x3)', 'Printers', 50.00, 'inventory', false),
(1, 'DJI drone (from trade)', 'Drones', 0.00, 'sold', false),
(2, 'Mac Mini M4', 'Electronics', 550.00, 'sold', true),
(3, 'iPad Pro 13 + keyboard + pencil', 'Electronics', 950.00, 'sold', false),
(4, 'HomePod 2s (pair)', 'Audio', 200.00, 'kept', false),
(5, 'MacBook Neo', 'Electronics', 500.00, 'sold', false),
(6, 'Unifi travel router', 'Networking', 90.00, 'sold', false),
(7, 'Canon RF 24-105 F4 L', 'Cameras', 650.00, 'sold', true);
