/**
 * ============================================
 * GOALSQUAD - PHASE 3 WAREHOUSE & SHIPPING
 * ============================================
 * 
 * This migration adds warehouse and shipping features:
 * 1. merchant_shipments table
 * 2. merchant_shipment_items table
 * 3. shipping_restrictions table
 * 4. webhook_queue table
 * 5. security_hardening table (audit_vault.immutable_signatures)
 * 
 * This migration uses defensive SQL to handle existing tables gracefully.
 * ============================================
 */

-- ============================================
-- 1. MERCHANT SHIPMENTS TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'merchant_shipments') THEN
    CREATE TABLE merchant_shipments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      warehouse_id UUID REFERENCES consolidation_warehouses(id) ON DELETE SET NULL,
      
      -- Shipment details
      shipment_number VARCHAR(50) UNIQUE NOT NULL,
      shipment_type VARCHAR(50) DEFAULT 'inbound', -- inbound, outbound, transfer
      status VARCHAR(50) DEFAULT 'pending',
      
      -- Tracking
      tracking_number VARCHAR(255),
      carrier VARCHAR(100),
      carrier_reference VARCHAR(255),
      
      -- Shipping details
      shipping_address_name VARCHAR(255),
      shipping_address_line1 VARCHAR(255),
      shipping_address_line2 VARCHAR(255),
      shipping_city VARCHAR(100),
      shipping_postal_code VARCHAR(20),
      shipping_country VARCHAR(2),
      
      -- Dates
      expected_ship_date DATE,
      actual_ship_date DATE,
      expected_delivery_date DATE,
      actual_delivery_date DATE,
      
      -- Summary
      total_items INTEGER DEFAULT 0,
      total_weight_grams INTEGER,
      total_volume_m3 DECIMAL(10, 3),
      
      -- Costs
      shipping_cost DECIMAL(10, 2),
      handling_cost DECIMAL(10, 2),
      total_cost DECIMAL(10, 2),
      
      -- Notes
      notes TEXT,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_merchant_shipments_merchant ON merchant_shipments(merchant_id);
    CREATE INDEX idx_merchant_shipments_warehouse ON merchant_shipments(warehouse_id);
    CREATE INDEX idx_merchant_shipments_status ON merchant_shipments(status);
    CREATE INDEX idx_merchant_shipments_number ON merchant_shipments(shipment_number);
    CREATE INDEX idx_merchant_shipments_tracking ON merchant_shipments(tracking_number) WHERE tracking_number IS NOT NULL;

    ALTER TABLE merchant_shipments ENABLE ROW LEVEL SECURITY;

    -- Add trigger for updated_at
    CREATE TRIGGER update_merchant_shipments_updated_at
      BEFORE UPDATE ON merchant_shipments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- 2. MERCHANT SHIPMENT ITEMS TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'merchant_shipment_items') THEN
    CREATE TABLE merchant_shipment_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      shipment_id UUID NOT NULL REFERENCES merchant_shipments(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      
      -- Product snapshot
      sku VARCHAR(100),
      product_name VARCHAR(255),
      
      -- Quantity
      quantity_shipped INTEGER NOT NULL CHECK (quantity_shipped > 0),
      quantity_received INTEGER DEFAULT 0,
      quantity_damaged INTEGER DEFAULT 0,
      
      -- Order references
      order_id UUID REFERENCES orders(id),
      
      -- Physical attributes
      weight_grams INTEGER,
      volume_m3 DECIMAL(10, 3),
      
      -- Location
      location_in_warehouse VARCHAR(100),
      pallet_number VARCHAR(50),
      
      -- Status
      status VARCHAR(50) DEFAULT 'pending',
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_merchant_shipment_items_shipment ON merchant_shipment_items(shipment_id);
    CREATE INDEX idx_merchant_shipment_items_product ON merchant_shipment_items(product_id);
    CREATE INDEX idx_merchant_shipment_items_order ON merchant_shipment_items(order_id) WHERE order_id IS NOT NULL;
    CREATE INDEX idx_merchant_shipment_items_status ON merchant_shipment_items(status);

    ALTER TABLE merchant_shipment_items ENABLE ROW LEVEL SECURITY;

    -- Add trigger for updated_at
    CREATE TRIGGER update_merchant_shipment_items_updated_at
      BEFORE UPDATE ON merchant_shipment_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- 3. SHIPPING RESTRICTIONS TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'shipping_restriction_categories') THEN
    CREATE TABLE shipping_restriction_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      icon VARCHAR(100),
      color VARCHAR(7),
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_shipping_restrictions_active ON shipping_restriction_categories(is_active) WHERE is_active = true;

    ALTER TABLE shipping_restriction_categories ENABLE ROW LEVEL SECURITY;

    -- Add trigger for updated_at
    CREATE TRIGGER update_shipping_restriction_categories_updated_at
      BEFORE UPDATE ON shipping_restriction_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add shipping restriction columns to products table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'can_consolidate') THEN
    ALTER TABLE products ADD COLUMN can_consolidate BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shipping_restrictions') THEN
    ALTER TABLE products ADD COLUMN shipping_restrictions UUID[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'requires_cold_chain') THEN
    ALTER TABLE products ADD COLUMN requires_cold_chain BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cold_chain_temp_min') THEN
    ALTER TABLE products ADD COLUMN cold_chain_temp_min DECIMAL(5, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cold_chain_temp_max') THEN
    ALTER TABLE products ADD COLUMN cold_chain_temp_max DECIMAL(5, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_fragile') THEN
    ALTER TABLE products ADD COLUMN is_fragile BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_hazardous') THEN
    ALTER TABLE products ADD COLUMN is_hazardous BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hazardous_class') THEN
    ALTER TABLE products ADD COLUMN hazardous_class VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'un_number') THEN
    ALTER TABLE products ADD COLUMN un_number VARCHAR(50);
  END IF;
END $$;

-- ============================================
-- 4. WEBHOOK QUEUE TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'webhook_queue') THEN
    CREATE TABLE webhook_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Event details
      event_type VARCHAR(100) NOT NULL,
      event_data JSONB NOT NULL,
      
      -- Target
      webhook_url TEXT NOT NULL,
      webhook_secret TEXT,
      
      -- Status
      status VARCHAR(50) DEFAULT 'pending', -- pending, processing, success, failed, retrying
      attempt_count INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      
      -- Scheduling
      scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      processed_at TIMESTAMP WITH TIME ZONE,
      
      -- Error handling
      last_error TEXT,
      last_error_at TIMESTAMP WITH TIME ZONE,
      
      -- Priority
      priority INTEGER DEFAULT 5, -- 1=high, 5=normal, 10=low
      
      -- Context
      correlation_id VARCHAR(255),
      metadata JSONB DEFAULT '{}',
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_webhook_queue_status ON webhook_queue(status);
    CREATE INDEX idx_webhook_queue_scheduled ON webhook_queue(scheduled_for) WHERE status IN ('pending', 'retrying');
    CREATE INDEX idx_webhook_queue_event_type ON webhook_queue(event_type);
    CREATE INDEX idx_webhook_queue_correlation ON webhook_queue(correlation_id) WHERE correlation_id IS NOT NULL;

    ALTER TABLE webhook_queue ENABLE ROW LEVEL SECURITY;

    -- Add trigger for updated_at
    CREATE TRIGGER update_webhook_queue_updated_at
      BEFORE UPDATE ON webhook_queue
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to enqueue webhook events
CREATE OR REPLACE FUNCTION enqueue_webhook_event(
  p_event_type VARCHAR(100),
  p_event_data JSONB,
  p_webhook_url TEXT,
  p_webhook_secret TEXT DEFAULT NULL,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_priority INTEGER DEFAULT 5,
  p_correlation_id VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_webhook_id UUID;
BEGIN
  INSERT INTO webhook_queue (
    event_type,
    event_data,
    webhook_url,
    webhook_secret,
    scheduled_for,
    priority,
    correlation_id
  ) VALUES (
    p_event_type,
    p_event_data,
    p_webhook_url,
    p_webhook_secret,
    p_scheduled_for,
    p_priority,
    p_correlation_id
  ) RETURNING id INTO v_webhook_id;
  
  RETURN v_webhook_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. SECURITY HARDENING (AUDIT VAULT)
-- ============================================

-- Create audit vault schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_namespace WHERE nspname = 'audit_vault') THEN
    CREATE SCHEMA audit_vault;
  END IF;
END $$;

-- Create immutable signatures table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'immutable_signatures' AND schemaname = 'audit_vault') THEN
    CREATE TABLE audit_vault.immutable_signatures (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Event details
      event_type VARCHAR(100) NOT NULL,
      table_name VARCHAR(100) NOT NULL,
      record_id UUID NOT NULL,
      
      -- Change details
      operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
      old_values JSONB,
      new_values JSONB,
      
      -- User context
      user_id UUID,
      user_email VARCHAR(255),
      ip_address INET,
      user_agent TEXT,
      
      -- Metadata
      correlation_id VARCHAR(255),
      metadata JSONB DEFAULT '{}',
      
      -- Timestamps (immutable)
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );

    CREATE INDEX idx_audit_signatures_table ON audit_vault.immutable_signatures(table_name);
    CREATE INDEX idx_audit_signatures_record ON audit_vault.immutable_signatures(table_name, record_id);
    CREATE INDEX idx_audit_signatures_event_type ON audit_vault.immutable_signatures(event_type);
    CREATE INDEX idx_audit_signatures_user ON audit_vault.immutable_signatures(user_id) WHERE user_id IS NOT NULL;
    CREATE INDEX idx_audit_signatures_created ON audit_vault.immutable_signatures(created_at DESC);

    -- RLS to prevent modifications
    ALTER TABLE audit_vault.immutable_signatures ENABLE ROW LEVEL SECURITY;

    -- Allow reads only for authenticated users
    CREATE POLICY "Allow read access to audit logs" ON audit_vault.immutable_signatures
      FOR SELECT
      USING (auth.uid() IS NOT NULL);

    -- Prevent inserts (only trigger can insert)
    CREATE POLICY "Prevent direct inserts" ON audit_vault.immutable_signatures
      FOR INSERT
      WITH CHECK (false);

    -- Prevent updates
    CREATE POLICY "Prevent updates" ON audit_vault.immutable_signatures
      FOR UPDATE
      USING (false);

    -- Prevent deletes
    CREATE POLICY "Prevent deletes" ON audit_vault.immutable_signatures
      FOR DELETE
      USING (false);
  END IF;
END $$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION audit_vault.log_event(
  p_event_type VARCHAR(100),
  p_table_name VARCHAR(100),
  p_record_id UUID,
  p_operation VARCHAR(20),
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_correlation_id VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_vault.immutable_signatures (
    event_type,
    table_name,
    record_id,
    operation,
    old_values,
    new_values,
    user_id,
    user_email,
    ip_address,
    user_agent,
    correlation_id
  ) VALUES (
    p_event_type,
    p_table_name,
    p_record_id,
    p_operation,
    p_old_values,
    p_new_values,
    auth.uid(),
    auth.jwt()->>'email',
    inet_client_addr(),
    current_setting('request.headers.user-agent', true),
    p_correlation_id
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
