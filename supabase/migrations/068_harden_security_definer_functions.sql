-- 068_harden_security_definer_functions.sql
-- Harden SECURITY DEFINER functions callable by authenticated users.
-- Key fix: use_discount_code now validates that the caller is the customer.
-- Also: notify_* functions are restricted to service_role only to prevent spam.

BEGIN;

-- 1) Fix use_discount_code: validate caller is the customer
CREATE OR REPLACE FUNCTION public.use_discount_code(
  p_code character varying,
  p_customer_id uuid,
  p_purchase_amount numeric
)
RETURNS TABLE(
  success boolean,
  discount_type character varying,
  discount_value numeric,
  discount_amount numeric,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_discount RECORD;
  v_discount_amount DECIMAL(12, 2);
  v_final_discount_amount DECIMAL(12, 2);
BEGIN
  -- SECURITY: caller must be the customer they are claiming to be
  IF auth.uid() IS NULL OR auth.uid() != p_customer_id THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, 'Unauthorized'::TEXT;
    RETURN;
  END IF;

  -- Find valid discount code
  SELECT * INTO v_discount
  FROM discount_codes
  WHERE code = p_code
    AND is_active = TRUE
    AND (valid_from <= NOW() OR valid_from IS NULL)
    AND (valid_until >= NOW() OR valid_until IS NULL)
    AND (customer_id = p_customer_id OR customer_id IS NULL)
    AND (usage_limit IS NULL OR times_used < usage_limit);

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, 'Ogiltig rabattkod'::TEXT;
    RETURN;
  END IF;

  -- Check minimum purchase amount
  IF v_discount.min_purchase_amount IS NOT NULL AND p_purchase_amount < v_discount.min_purchase_amount THEN
    RETURN QUERY SELECT FALSE, v_discount.discount_type, v_discount.discount_value, NULL::DECIMAL,
      ('Minimiköp: ' || v_discount.min_purchase_amount || ' kr')::TEXT;
    RETURN;
  END IF;

  -- Calculate discount amount
  IF v_discount.discount_type = 'percentage' THEN
    v_discount_amount := p_purchase_amount * (v_discount.discount_value / 100);
  ELSE
    v_discount_amount := v_discount.discount_value;
  END IF;

  -- Apply max discount limit
  IF v_discount.max_discount_amount IS NOT NULL AND v_discount_amount > v_discount.max_discount_amount THEN
    v_final_discount_amount := v_discount.max_discount_amount;
  ELSE
    v_final_discount_amount := v_discount.amount;
  END IF;

  -- Increment usage count
  UPDATE discount_codes
  SET times_used = times_used + 1
  WHERE id = v_discount.id;

  RETURN QUERY SELECT TRUE, v_discount.discount_type, v_discount.discount_value, v_final_discount_amount, 'Rabattkod applicerad'::TEXT;
END;
$function$;

-- 2) Restrict notify_* functions to service_role only (prevent spam)
REVOKE EXECUTE ON FUNCTION public.notify_new_company(uuid, character varying) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_product(uuid, character varying, character varying) FROM authenticated;

-- Grant EXECUTE to service_role explicitly (in case it was inherited)
GRANT EXECUTE ON FUNCTION public.notify_new_company(uuid, character varying) TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_new_product(uuid, character varying, character varying) TO service_role;

-- 3) record_ad_* and update_goal_progress are left as-is:
--    - record_ad_*: RLS on ad_stats/ads prevents cross-tenant manipulation.
--      Spamming own ad stats is a business problem, not a security hole.
--    - update_goal_progress: trigger on entity_goals which has RLS; safe.

COMMIT;

-- Verification (run manually):
--   select proname, proargtypes::text, prosecdef::text as security_definer,
--     array_to_string(array(select rolname from pg_roles where oid = any(proacl::oid[])), ', ') as exec_grants
--   from pg_proc
--   where proname in ('use_discount_code','notify_new_company','notify_new_product')
--   order by proname;
-- Expected: use_discount_code EXEC on authenticated (with auth.uid() check),
--           notify_* EXEC only on service_role.
