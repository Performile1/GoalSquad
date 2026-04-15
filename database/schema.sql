-- GoalSquad.shop Database Schema
-- Platform: Supabase (PostgreSQL 15+)
-- Architecture: Multi-tenant, Split Engine, Distributed Logistics
-- Created: 2026-04-15

-- ============================================================================
-- CORE IDENTITY & ORGANIZATIONS
-- ============================================================================

-- Organizations (Top-level entity for multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    org_type VARCHAR(50) NOT NULL CHECK (org_type IN ('platform', 'merchant', 'hub', 'carrier')),
    legal_name VARCHAR(255),
    org_number VARCHAR(50), -- Business registration number
    country VARCHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
    vat_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchants (Sellers on the platform)
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    merchant_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    
    -- Contact
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) NOT NULL,
    
    -- Business
    stripe_account_id VARCHAR(255), -- Stripe Connect account
    onboarding_completed BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    
    -- Settings
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log Signatures (Immutable trust records)
CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'merchant', 'order', 'shipment', 'payment'
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'onboarding', 'order_placed', 'payment_split', etc.
    
    -- Identity proof
    user_id UUID REFERENCES auth.users(id),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Verification method
    verification_method VARCHAR(50) NOT NULL CHECK (verification_method IN ('otp_sms', 'otp_email', 'magic_link')),
    otp_hash VARCHAR(255), -- Hashed OTP for verification
    
    -- Audit trail
    signature_hash VARCHAR(255) NOT NULL UNIQUE, -- SHA-256 of entire record
    ip_address INET,
    user_agent TEXT,
    geo_location JSONB, -- {country, city, lat, lng}
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Immutability constraint
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PRODUCT INFORMATION MANAGEMENT (GS1 Hybrid)
-- ============================================================================

-- Products (GS1 + Platform SKU hybrid)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    
    -- Identification
    sku VARCHAR(100) NOT NULL, -- Platform SKU (GS-XXXXX or merchant custom)
    ean VARCHAR(13), -- GS1 EAN-13 barcode
    gtin VARCHAR(14), -- GS1 GTIN-14 (for cases/pallets)
    
    -- Basic info
    name VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    brand VARCHAR(255),
    
    -- Pricing
    base_price DECIMAL(10, 2) NOT NULL, -- Merchant's base price
    retail_price DECIMAL(10, 2) NOT NULL, -- Recommended retail price
    currency VARCHAR(3) DEFAULT 'NOK',
    
    -- GS1 Physical Dimensions (for shipping matrix)
    weight_grams INTEGER, -- Weight in grams
    length_mm INTEGER, -- Length in millimeters
    width_mm INTEGER, -- Width in millimeters
    height_mm INTEGER, -- Height in millimeters
    
    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    stock_location VARCHAR(255), -- Warehouse/Hub location
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
    
    -- Media
    images JSONB DEFAULT '[]', -- Array of image URLs
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(merchant_id, sku)
);

-- ============================================================================
-- ORDERS & TRANSACTIONS
-- ============================================================================

-- Orders (Customer purchases)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer
    customer_id UUID REFERENCES auth.users(id),
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    
    -- Shipping address
    shipping_name VARCHAR(255) NOT NULL,
    shipping_address_line1 VARCHAR(255) NOT NULL,
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(20) NOT NULL,
    shipping_country VARCHAR(2) NOT NULL,
    
    -- Billing address
    billing_name VARCHAR(255),
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(2),
    
    -- Financials
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_total DECIMAL(10, 2) NOT NULL,
    tax_total DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NOK',
    
    -- Payment
    stripe_payment_intent_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Order status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items (Line items in an order)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    
    -- Product snapshot (at time of order)
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(500) NOT NULL,
    
    -- Pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL, -- Price customer pays
    merchant_base_price DECIMAL(10, 2) NOT NULL, -- What merchant gets (before platform fee)
    subtotal DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
    
    -- Margins (The Split Engine calculates these)
    sales_margin DECIMAL(10, 2) DEFAULT 0, -- Retail - Merchant base
    handling_fee DECIMAL(10, 2) DEFAULT 0, -- Fixed platform fee
    
    -- Physical attributes (for logistics)
    weight_grams INTEGER,
    length_mm INTEGER,
    width_mm INTEGER,
    height_mm INTEGER,
    
    -- Fulfillment
    fulfillment_status VARCHAR(50) DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DISTRIBUTED LOGISTICS (Multi-origin, Hub-based)
-- ============================================================================

-- Logistics Hubs (Warehouses, consolidation centers)
CREATE TABLE IF NOT EXISTS logistics_hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    -- Hub info
    hub_name VARCHAR(255) NOT NULL,
    hub_type VARCHAR(50) NOT NULL CHECK (hub_type IN ('merchant_warehouse', 'linehaul_hub', 'lastmile_hub', 'return_center')),
    
    -- Location
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Capabilities
    capabilities JSONB DEFAULT '{}', -- {consolidation: true, cross_dock: true, storage: true}
    operating_hours JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments (Physical movement of goods)
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Origin & Destination
    origin_hub_id UUID REFERENCES logistics_hubs(id),
    origin_merchant_id UUID REFERENCES merchants(id),
    destination_address JSONB NOT NULL, -- Full shipping address
    
    -- Routing (Distributed sourcing)
    route_type VARCHAR(50) CHECK (route_type IN ('direct', 'hub_consolidation', 'multi_origin')),
    consolidation_hub_id UUID REFERENCES logistics_hubs(id), -- Linehaul hub
    lastmile_hub_id UUID REFERENCES logistics_hubs(id), -- Last-mile hub
    
    -- Carrier
    carrier_name VARCHAR(100),
    carrier_service VARCHAR(100),
    tracking_number VARCHAR(255),
    tracking_url TEXT,
    
    -- Shipping costs (for spread calculation)
    carrier_cost DECIMAL(10, 2), -- What we pay carrier
    customer_cost DECIMAL(10, 2), -- What customer pays
    shipping_spread DECIMAL(10, 2), -- Arbitrage margin
    
    -- Physical
    total_weight_grams INTEGER,
    package_count INTEGER DEFAULT 1,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'picked', 'in_transit', 'at_hub', 'out_for_delivery', 'delivered', 'failed', 'returned')),
    
    -- Timestamps
    picked_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipment Items (What's in each shipment)
CREATE TABLE IF NOT EXISTS shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- THE SPLIT ENGINE - Virtual Wallets & Ledger
-- ============================================================================

-- Wallets (Virtual accounts for all participants)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Owner
    owner_type VARCHAR(50) NOT NULL CHECK (owner_type IN ('platform', 'merchant', 'carrier', 'hub')),
    owner_id UUID NOT NULL, -- References organizations.id or merchants.id
    
    -- Balance
    balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    currency VARCHAR(3) DEFAULT 'NOK',
    
    -- Stripe
    stripe_account_id VARCHAR(255), -- For payouts
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(owner_type, owner_id, currency)
);

-- Ledger Entries (Immutable transaction log)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction reference
    transaction_id UUID NOT NULL, -- Groups related entries (double-entry)
    order_id UUID REFERENCES orders(id),
    shipment_id UUID REFERENCES shipments(id),
    
    -- Account movement
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('debit', 'credit')),
    
    -- Amount
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'NOK',
    
    -- Split Engine categories
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'sales_revenue',        -- Customer payment
        'sales_margin',         -- Retail - Merchant base
        'merchant_payout',      -- What merchant receives
        'handling_fee',         -- Platform fixed fee
        'shipping_spread',      -- Carrier arbitrage
        'carrier_payout',       -- What carrier receives
        'platform_revenue',     -- Platform's total take
        'refund',
        'adjustment'
    )),
    
    -- Description
    description TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Immutability
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Split Configurations (Rules for margin calculation)
CREATE TABLE IF NOT EXISTS split_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Scope
    merchant_id UUID REFERENCES merchants(id), -- NULL = platform default
    product_category VARCHAR(100), -- NULL = applies to all
    
    -- Triple-Dip Margins
    sales_margin_percent DECIMAL(5, 2) DEFAULT 15.00, -- Platform markup on retail
    handling_fee_fixed DECIMAL(10, 2) DEFAULT 25.00, -- Fixed fee per order
    shipping_spread_percent DECIMAL(5, 2) DEFAULT 20.00, -- Markup on carrier cost
    
    -- Priority (higher = more specific)
    priority INTEGER DEFAULT 0,
    
    -- Status
    active BOOLEAN DEFAULT TRUE,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- Merchants
CREATE INDEX IF NOT EXISTS idx_merchants_org ON merchants(organization_id);
CREATE INDEX IF NOT EXISTS idx_merchants_user ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_slug ON merchants(slug);
CREATE INDEX IF NOT EXISTS idx_merchants_stripe ON merchants(stripe_account_id);

-- Signatures
CREATE INDEX IF NOT EXISTS idx_signatures_entity ON signatures(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user ON signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_signatures_hash ON signatures(signature_hash);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_merchant ON order_items(merchant_id);

-- Shipments
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- Wallets
CREATE INDEX IF NOT EXISTS idx_wallets_owner ON wallets(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_wallets_stripe ON wallets(stripe_account_id);

-- Ledger
CREATE INDEX IF NOT EXISTS idx_ledger_transaction ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_wallet ON ledger_entries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_order ON ledger_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_category ON ledger_entries(category);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON ledger_entries(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_configurations ENABLE ROW LEVEL SECURITY;

-- Merchants: Can only see their own data
CREATE POLICY merchants_select_own ON merchants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY merchants_update_own ON merchants
    FOR UPDATE USING (user_id = auth.uid());

-- Products: Merchants can manage their own products
CREATE POLICY products_select_merchant ON products
    FOR SELECT USING (
        merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    );

CREATE POLICY products_insert_merchant ON products
    FOR INSERT WITH CHECK (
        merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    );

CREATE POLICY products_update_merchant ON products
    FOR UPDATE USING (
        merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    );

-- Orders: Customers can see their own orders
CREATE POLICY orders_select_customer ON orders
    FOR SELECT USING (customer_id = auth.uid());

-- Wallets: Users can view their own wallet
CREATE POLICY wallets_select_own ON wallets
    FOR SELECT USING (
        (owner_type = 'merchant' AND owner_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()))
    );

-- Ledger: Users can view their wallet transactions
CREATE POLICY ledger_select_own ON ledger_entries
    FOR SELECT USING (
        wallet_id IN (
            SELECT id FROM wallets WHERE 
            (owner_type = 'merchant' AND owner_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()))
        )
    );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Platform organization
INSERT INTO organizations (id, name, org_type, country, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'GoalSquad Platform',
    'platform',
    'NO',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Platform wallet
INSERT INTO wallets (owner_type, owner_id, currency, status)
VALUES (
    'platform',
    '00000000-0000-0000-0000-000000000001',
    'NOK',
    'active'
) ON CONFLICT (owner_type, owner_id, currency) DO NOTHING;

-- Default split configuration
INSERT INTO split_configurations (
    merchant_id,
    sales_margin_percent,
    handling_fee_fixed,
    shipping_spread_percent,
    priority,
    active
) VALUES (
    NULL, -- Platform default
    15.00, -- 15% sales margin
    25.00, -- 25 NOK handling fee
    20.00, -- 20% shipping spread
    0,
    TRUE
) ON CONFLICT DO NOTHING;
