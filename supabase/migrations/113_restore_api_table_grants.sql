-- Restore API table privileges in already-provisioned production databases.
-- Policies do not grant SQL privileges, and service_role still needs table ACLs.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles', 'notifications', 'products', 'product_categories',
    'community_products', 'orders', 'order_items', 'communities',
    'merchants', 'seller_profiles', 'warehouse_partners',
    'conversations', 'conversation_participants', 'messages'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', table_name);
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', table_name);
    END IF;
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO authenticated, service_role;