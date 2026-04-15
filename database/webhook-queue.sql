-- ============================================================================
-- WAREHOUSE WEBHOOK MESSAGE QUEUE
-- Async processing to prevent race conditions and database overload
-- ============================================================================

-- Queue table for webhook events
CREATE TABLE IF NOT EXISTS webhook_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  warehouse_partner_id UUID REFERENCES warehouse_partners(id),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_queue_status ON webhook_queue(status);
CREATE INDEX idx_webhook_queue_scheduled ON webhook_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_webhook_queue_priority ON webhook_queue(priority DESC, created_at ASC);

-- Function to enqueue webhook event
CREATE OR REPLACE FUNCTION enqueue_webhook_event(
  p_event_type TEXT,
  p_payload JSONB,
  p_warehouse_partner_id UUID,
  p_priority INTEGER DEFAULT 5
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO webhook_queue (
    event_type,
    payload,
    warehouse_partner_id,
    priority
  ) VALUES (
    p_event_type,
    p_payload,
    p_warehouse_partner_id,
    p_priority
  )
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$;

-- Function to get next job from queue
CREATE OR REPLACE FUNCTION dequeue_webhook_event()
RETURNS TABLE (
  queue_id UUID,
  event_type TEXT,
  payload JSONB,
  warehouse_partner_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_queue_record RECORD;
BEGIN
  -- Get highest priority pending job
  SELECT * INTO v_queue_record
  FROM webhook_queue
  WHERE status = 'pending'
  AND scheduled_at <= NOW()
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    -- Mark as processing
    UPDATE webhook_queue
    SET status = 'processing',
        started_at = NOW(),
        attempts = attempts + 1
    WHERE id = v_queue_record.id;

    -- Return job details
    RETURN QUERY
    SELECT 
      v_queue_record.id,
      v_queue_record.event_type,
      v_queue_record.payload,
      v_queue_record.warehouse_partner_id;
  END IF;
END;
$$;

-- Function to mark job as completed
CREATE OR REPLACE FUNCTION complete_webhook_job(
  p_queue_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE webhook_queue
  SET status = 'completed',
      completed_at = NOW()
  WHERE id = p_queue_id;

  RETURN FOUND;
END;
$$;

-- Function to mark job as failed (with retry logic)
CREATE OR REPLACE FUNCTION fail_webhook_job(
  p_queue_id UUID,
  p_error_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_queue RECORD;
BEGIN
  SELECT * INTO v_queue
  FROM webhook_queue
  WHERE id = p_queue_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if we should retry
  IF v_queue.attempts < v_queue.max_attempts THEN
    -- Schedule retry with exponential backoff
    UPDATE webhook_queue
    SET status = 'retrying',
        error_message = p_error_message,
        scheduled_at = NOW() + (POWER(2, v_queue.attempts) || ' minutes')::INTERVAL
    WHERE id = p_queue_id;
  ELSE
    -- Max attempts reached, mark as failed
    UPDATE webhook_queue
    SET status = 'failed',
        error_message = p_error_message,
        completed_at = NOW()
    WHERE id = p_queue_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- Cleanup old completed/failed jobs (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_webhook_queue()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_queue
  WHERE status IN ('completed', 'failed')
  AND completed_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

COMMENT ON TABLE webhook_queue IS 'Message queue for async warehouse webhook processing';
COMMENT ON FUNCTION enqueue_webhook_event IS 'Add webhook event to processing queue';
COMMENT ON FUNCTION dequeue_webhook_event IS 'Get next job from queue (with row locking)';
COMMENT ON FUNCTION complete_webhook_job IS 'Mark job as successfully completed';
COMMENT ON FUNCTION fail_webhook_job IS 'Mark job as failed with retry logic (exponential backoff)';
