/**
 * ============================================
 * GOALSQUAD - RETURNS SYSTEM
 * ============================================
 * 
 * This migration adds a comprehensive returns system:
 * - returns table (main return requests)
 * - return_items table (items being returned)
 * - return_reasons table (reason categories)
 * - return_status tracking
 * - QR code generation for return shipping labels
 * ============================================
 */

-- ============================================
-- RETURN REASONS TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'return_reasons') THEN
    CREATE TABLE return_reasons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100), -- product_issue, wrong_item, damaged, changed_mind, other
      requires_photo BOOLEAN DEFAULT false,
      requires_description BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_return_reasons_category ON return_reasons(category);
    CREATE INDEX idx_return_reasons_active ON return_reasons(is_active) WHERE is_active = true;

    ALTER TABLE return_reasons ENABLE ROW LEVEL SECURITY;

    CREATE TRIGGER update_return_reasons_updated_at
      BEFORE UPDATE ON return_reasons
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default return reasons
INSERT INTO return_reasons (code, name, description, category, requires_photo, requires_description, sort_order) VALUES
  ('damaged', 'Produkt skadad', 'Produkten anlände skadad', 'product_issue', true, true, 1),
  ('wrong_item', 'Fel produkt', 'Mottog fel produkt', 'wrong_item', true, true, 2),
  ('defective', 'Defekt produkt', 'Produkten fungerar inte som den ska', 'product_issue', true, true, 3),
  ('not_as_described', 'Inte som beskrivet', 'Produkten matchar inte beskrivningen', 'product_issue', true, true, 4),
  ('changed_mind', 'Ångrat köp', 'Har ändrat sig', 'changed_mind', false, true, 5),
  ('late_delivery', 'Sen leverans', 'Produkten kom för sent', 'other', false, true, 6),
  ('missing_parts', 'Saknade delar', 'Produkten saknade delar', 'product_issue', true, true, 7),
  ('other', 'Annan anledning', 'Annan anledning', 'other', false, true, 8)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- RETURNS TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'returns') THEN
    CREATE TABLE returns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      return_number VARCHAR(50) UNIQUE NOT NULL,
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES auth.users(id),
      
      -- Return details
      return_type VARCHAR(50) DEFAULT 'standard', -- standard, exchange, warranty
      status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, in_transit, received, processed, refunded, cancelled
      
      -- Shipping
      shipping_method VARCHAR(50), -- dropoff, pickup, courier
      tracking_number VARCHAR(255),
      carrier VARCHAR(100),
      return_label_url TEXT,
      qr_code_url TEXT,
      
      -- Timing
      requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      approved_at TIMESTAMP WITH TIME ZONE,
      rejected_at TIMESTAMP WITH TIME ZONE,
      rejected_reason TEXT,
      shipped_at TIMESTAMP WITH TIME ZONE,
      received_at TIMESTAMP WITH TIME ZONE,
      processed_at TIMESTAMP WITH TIME ZONE,
      refunded_at TIMESTAMP WITH TIME ZONE,
      
      -- Financials
      refund_amount DECIMAL(10, 2),
      refund_method VARCHAR(50), -- original_payment, store_credit, bank_transfer
      refund_status VARCHAR(50), -- pending, processing, completed, failed
      refund_transaction_id VARCHAR(255),
      
      -- Processing
      processed_by UUID REFERENCES auth.users(id),
      processing_notes TEXT,
      
      -- Photos
      photos TEXT[],
      
      -- Customer info
      customer_name VARCHAR(255),
      customer_email VARCHAR(255),
      customer_phone VARCHAR(50),
      
      -- Return address
      return_address_name VARCHAR(255),
      return_address_line1 VARCHAR(255),
      return_address_line2 VARCHAR(255),
      return_address_city VARCHAR(100),
      return_address_postal_code VARCHAR(20),
      return_address_country VARCHAR(2),
      
      -- Additional
      notes TEXT,
      internal_notes TEXT,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_returns_order ON returns(order_id);
    CREATE INDEX idx_returns_customer ON returns(customer_id);
    CREATE INDEX idx_returns_status ON returns(status);
    CREATE INDEX idx_returns_number ON returns(return_number);
    CREATE INDEX idx_returns_tracking ON returns(tracking_number) WHERE tracking_number IS NOT NULL;
    CREATE INDEX idx_returns_requested ON returns(requested_at DESC);
    CREATE INDEX idx_returns_qr ON returns(qr_code_url) WHERE qr_code_url IS NOT NULL;

    ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

    CREATE TRIGGER update_returns_updated_at
      BEFORE UPDATE ON returns
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- RETURN ITEMS TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'return_items') THEN
    CREATE TABLE return_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
      order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      
      -- Product snapshot
      sku VARCHAR(100),
      product_name VARCHAR(255),
      product_image TEXT,
      
      -- Quantity
      quantity_returned INTEGER NOT NULL CHECK (quantity_returned > 0),
      quantity_received INTEGER DEFAULT 0,
      quantity_approved INTEGER DEFAULT 0,
      quantity_rejected INTEGER DEFAULT 0,
      
      -- Return reason
      reason_id UUID REFERENCES return_reasons(id),
      reason_description TEXT,
      
      -- Condition
      condition VARCHAR(50) DEFAULT 'unknown', -- new, used, damaged, defective
      condition_description TEXT,
      
      -- Resolution
      resolution VARCHAR(50), -- refund, exchange, repair, discard
      exchange_for_product_id UUID REFERENCES products(id),
      
      -- Photos
      photos TEXT[],
      
      -- Pricing
      unit_price DECIMAL(10, 2),
      refund_amount DECIMAL(10, 2),
      
      -- Status
      status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, received, processed
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_return_items_return ON return_items(return_id);
    CREATE INDEX idx_return_items_order_item ON return_items(order_item_id);
    CREATE INDEX idx_return_items_product ON return_items(product_id);
    CREATE INDEX idx_return_items_status ON return_items(status);

    ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

    CREATE TRIGGER update_return_items_updated_at
      BEFORE UPDATE ON return_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- RETURN COMMENTS TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'return_comments') THEN
    CREATE TABLE return_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id),
      
      -- Comment details
      comment TEXT NOT NULL,
      is_internal BOOLEAN DEFAULT false,
      
      -- Attachments
      attachments TEXT[],
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_return_comments_return ON return_comments(return_id);
    CREATE INDEX idx_return_comments_user ON return_comments(user_id);
    CREATE INDEX idx_return_comments_internal ON return_comments(is_internal) WHERE is_internal = true;

    ALTER TABLE return_comments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- RETURN STATUS HISTORY TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'return_status_history') THEN
    CREATE TABLE return_status_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
      
      -- Status change
      from_status VARCHAR(50),
      to_status VARCHAR(50) NOT NULL,
      
      -- Who changed it
      changed_by UUID REFERENCES auth.users(id),
      changed_by_role VARCHAR(50), -- customer, merchant, warehouse, seller, admin
      
      -- Reason
      reason TEXT,
      
      -- Timestamp
      changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_return_status_history_return ON return_status_history(return_id);
    CREATE INDEX idx_return_status_history_changed ON return_status_history(changed_at DESC);

    ALTER TABLE return_status_history ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- FUNCTION TO GENERATE RETURN NUMBER
-- ============================================

CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  v_return_number VARCHAR(50);
  v_date_part TEXT;
  v_sequence INTEGER;
BEGIN
  v_date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get next sequence for this date
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM 10) AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM returns
  WHERE return_number LIKE 'RET-' || v_date_part || '-%';
  
  v_return_number := 'RET-' || v_date_part || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_return_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER TO AUTO-GENERATE RETURN NUMBER
-- ============================================

CREATE OR REPLACE FUNCTION set_return_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
    NEW.return_number := generate_return_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_return_number_trigger ON returns;
CREATE TRIGGER set_return_number_trigger
  BEFORE INSERT ON returns
  FOR EACH ROW
  EXECUTE FUNCTION set_return_number();

-- ============================================
-- FUNCTION TO LOG STATUS CHANGES
-- ============================================

CREATE OR REPLACE FUNCTION log_return_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO return_status_history (
      return_id,
      from_status,
      to_status,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.processed_by,
      NEW.processing_notes
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_return_status_change_trigger ON returns;
CREATE TRIGGER log_return_status_change_trigger
  AFTER UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION log_return_status_change();
