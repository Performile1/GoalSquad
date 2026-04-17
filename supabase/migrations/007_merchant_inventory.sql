/**
 * ============================================
 * GOALSQUAD - MERCHANT INVENTORY
 * ============================================
 * 
 * This migration adds merchant_inventory table to track inventory
 * at the merchant's location before it's shipped to consolidation warehouse.
 * 
 * Flow:
 * 1. merchant_inventory (at merchant location)
 * 2. merchant_shipments (sent to consolidation warehouse)
 * 3. warehouse_inventory (at consolidation warehouse)
 * 4. split warehouse (for delivery)
 * 5. end consumer
 * ============================================
 */

-- ============================================
-- MERCHANT INVENTORY TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'merchant_inventory') THEN
    CREATE TABLE merchant_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      
      -- Quantity tracking
      quantity_on_hand INTEGER DEFAULT 0 CHECK (quantity_on_hand >= 0),
      quantity_allocated INTEGER DEFAULT 0 CHECK (quantity_allocated >= 0),
      quantity_reserved INTEGER DEFAULT 0 CHECK (quantity_reserved >= 0),
      quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_allocated - quantity_reserved) STORED,
      
      -- Location details
      location_name VARCHAR(255),
      location_address_line1 VARCHAR(255),
      location_address_line2 VARCHAR(255),
      location_city VARCHAR(100),
      location_postal_code VARCHAR(20),
      location_country VARCHAR(2),
      storage_area VARCHAR(100),
      shelf_location VARCHAR(100),
      
      -- Batch/lot tracking
      batch_number VARCHAR(100),
      lot_number VARCHAR(100),
      serial_number VARCHAR(255),
      
      -- Cost tracking
      unit_cost DECIMAL(10, 2),
      total_cost DECIMAL(10, 2),
      
      -- Reorder settings
      reorder_point INTEGER,
      reorder_quantity INTEGER,
      
      -- Dates
      received_date DATE,
      expiry_date DATE,
      last_stock_count DATE,
      
      -- Status
      status VARCHAR(50) DEFAULT 'available', -- available, reserved, damaged, expired, returned
      
      -- Notes
      notes TEXT,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      UNIQUE(merchant_id, product_id, batch_number)
    );

    CREATE INDEX idx_merchant_inventory_merchant ON merchant_inventory(merchant_id);
    CREATE INDEX idx_merchant_inventory_product ON merchant_inventory(product_id);
    CREATE INDEX idx_merchant_inventory_status ON merchant_inventory(status);
    CREATE INDEX idx_merchant_inventory_available ON merchant_inventory(quantity_available) WHERE quantity_available > 0;
    CREATE INDEX idx_merchant_inventory_expiry ON merchant_inventory(expiry_date) WHERE expiry_date IS NOT NULL;
    CREATE INDEX idx_merchant_inventory_reorder ON merchant_inventory(quantity_on_hand) WHERE quantity_on_hand <= reorder_point;

    ALTER TABLE merchant_inventory ENABLE ROW LEVEL SECURITY;

    -- Add trigger for updated_at
    CREATE TRIGGER update_merchant_inventory_updated_at
      BEFORE UPDATE ON merchant_inventory
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- UPDATE PRODUCT FLOW SUMMARY
-- ============================================

-- Add merchant inventory columns to product_flow_summary
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_flow_summary' AND column_name = 'merchant_on_hand') THEN
    ALTER TABLE product_flow_summary ADD COLUMN merchant_on_hand INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_flow_summary' AND column_name = 'merchant_allocated') THEN
    ALTER TABLE product_flow_summary ADD COLUMN merchant_allocated INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_flow_summary' AND column_name = 'merchant_available') THEN
    ALTER TABLE product_flow_summary ADD COLUMN merchant_available INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- UPDATE MERCHANT SHIPMENTS
-- ============================================

-- Add source location reference to merchant_shipments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_shipments' AND column_name = 'source_location_id') THEN
    ALTER TABLE merchant_shipments ADD COLUMN source_location_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_shipments' AND column_name = 'source_location_name') THEN
    ALTER TABLE merchant_shipments ADD COLUMN source_location_name VARCHAR(255);
  END IF;
END $$;
