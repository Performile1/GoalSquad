/**
 * Sample Warehouse Data for Sweden
 * 
 * Major consolidation centers covering all regions
 */

-- Insert sample warehouses
INSERT INTO consolidation_warehouses (
  name,
  code,
  postal_code,
  city,
  region,
  country,
  latitude,
  longitude,
  postal_code_ranges,
  coverage_radius_km,
  max_capacity_m3,
  max_daily_orders,
  processing_days,
  operating_hours,
  is_active,
  accepts_new_orders,
  contact_person,
  contact_email,
  contact_phone,
  address_line1
) VALUES
  -- Stockholm
  (
    'Stockholm Consolidation Center',
    'STO-01',
    '11122',
    'Stockholm',
    'Stockholm',
    'SE',
    59.3293,
    18.0686,
    ARRAY['100-199', '700-799'],
    50,
    5000.00,
    500,
    2,
    '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'::jsonb,
    true,
    true,
    'Anna Andersson',
    'stockholm@goalsquad.se',
    '+46 8 123 456 78',
    'Logistikvägen 1'
  ),
  
  -- Göteborg
  (
    'Göteborg Consolidation Center',
    'GOT-01',
    '41101',
    'Göteborg',
    'Västra Götaland',
    'SE',
    57.7089,
    11.9746,
    ARRAY['400-499'],
    40,
    3500.00,
    350,
    2,
    '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'::jsonb,
    true,
    true,
    'Erik Eriksson',
    'goteborg@goalsquad.se',
    '+46 31 123 456 78',
    'Hamnvägen 10'
  ),
  
  -- Malmö
  (
    'Malmö Consolidation Center',
    'MAL-01',
    '21101',
    'Malmö',
    'Skåne',
    'SE',
    55.6050,
    13.0038,
    ARRAY['200-299'],
    35,
    3000.00,
    300,
    2,
    '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'::jsonb,
    true,
    true,
    'Maria Månsson',
    'malmo@goalsquad.se',
    '+46 40 123 456 78',
    'Industrivägen 5'
  ),
  
  -- Uppsala
  (
    'Uppsala Distribution Hub',
    'UPP-01',
    '75101',
    'Uppsala',
    'Uppsala',
    'SE',
    59.8586,
    17.6389,
    ARRAY['750-759'],
    30,
    2000.00,
    200,
    2,
    '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'::jsonb,
    true,
    true,
    'Per Persson',
    'uppsala@goalsquad.se',
    '+46 18 123 456 78',
    'Distributionsvägen 3'
  ),
  
  -- Örebro
  (
    'Örebro Central Warehouse',
    'ORE-01',
    '70101',
    'Örebro',
    'Örebro',
    'SE',
    59.2753,
    15.2134,
    ARRAY['700-709'],
    35,
    2500.00,
    250,
    2,
    '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'::jsonb,
    true,
    true,
    'Karin Karlsson',
    'orebro@goalsquad.se',
    '+46 19 123 456 78',
    'Centralvägen 7'
  ),
  
  -- Linköping
  (
    'Linköping Logistics Center',
    'LIN-01',
    '58101',
    'Linköping',
    'Östergötland',
    'SE',
    58.4108,
    15.6214,
    ARRAY['580-589'],
    30,
    1800.00,
    180,
    2,
    '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'::jsonb,
    true,
    true,
    'Lars Larsson',
    'linkoping@goalsquad.se',
    '+46 13 123 456 78',
    'Logistikgatan 12'
  ),
  
  -- Helsingborg
  (
    'Helsingborg Distribution Point',
    'HEL-01',
    '25101',
    'Helsingborg',
    'Skåne',
    'SE',
    56.0465,
    12.6945,
    ARRAY['250-259'],
    25,
    1500.00,
    150,
    2,
    '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'::jsonb,
    true,
    true,
    'Sofia Svensson',
    'helsingborg@goalsquad.se',
    '+46 42 123 456 78',
    'Hamnplan 4'
  ),
  
  -- Norrköping
  (
    'Norrköping Warehouse',
    'NOR-01',
    '60101',
    'Norrköping',
    'Östergötland',
    'SE',
    58.5877,
    16.1924,
    ARRAY['600-619'],
    30,
    1600.00,
    160,
    2,
    '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'::jsonb,
    true,
    true,
    'Johan Johansson',
    'norrkoping@goalsquad.se',
    '+46 11 123 456 78',
    'Industriområdet 8'
  )
ON CONFLICT (code) DO NOTHING;

-- Verify insertion
SELECT 
  name,
  city,
  postal_code,
  array_to_string(postal_code_ranges, ', ') as coverage,
  is_active
FROM consolidation_warehouses
ORDER BY city;

COMMENT ON TABLE consolidation_warehouses IS 'Sample data includes 8 major Swedish cities with full coverage';
