# GOALSQUAD - Database Analysis
## Comprehensive Deep Dive into Database Schema

**Date:** April 17, 2026
**Purpose:** Analyze all database files to determine what tables/features need to be in the database

---

## 1. CURRENT DATABASE STATE (from validation)

**Tables Currently in Database (8 tables):**
- ✅ organizations
- ✅ profiles
- ✅ communities
- ✅ community_members
- ✅ merchants
- ✅ products
- ✅ community_products (with badge fields)
- ✅ blog_posts

---

## 2. DATABASE FOLDER FILES ANALYSIS

### A. CORE SCHEMA FILES

#### schema.sql (22,514 bytes)
- **Purpose:** Core database structure
- **Tables:** organizations, merchants, signatures, products
- **Status:** Already integrated into 001_safe_setup.sql

#### schema-extended.sql (22,382 bytes)
- **Purpose:** Extended schema with additional tables
- **Tables:** (to be analyzed)

#### auth-and-members.sql (11,062 bytes)
- **Purpose:** Authentication & Member Management
- **Tables:**
  - profiles (extends auth.users)
  - community_members
  - invitations
- **Status:** Partially integrated (profiles, community_members done, invitations missing)

### B. PRODUCT-RELATED FILES

#### product-attributes.sql (11,758 bytes)
- **Purpose:** Enhanced Product Attributes
- **Adds to products table:**
  - ean, gs1_gtin, sku, brand, manufacturer
  - Physical attributes (weight_grams, length_mm, width_mm, height_mm, volume_ml)
  - Product details (ingredients, allergens, nutritional_info, country_of_origin, expiry_date, batch_number)
  - Packaging (package_type, units_per_package, recyclable, eco_friendly)
  - Certifications, age_restriction
  - attributes JSONB
- **Status:** NOT in database
- **Codebase usage:** Unknown - need to check

#### product-categories.sql (6,126 bytes)
- **Purpose:** Product Categories & Search
- **Tables:**
  - product_categories (hierarchical categories)
- **Adds to products:**
  - category_id, tags, search_vector
- **Indexes:** Full-text search indexes
- **Status:** Partially integrated (product_categories table exists, but search features missing)
- **Codebase usage:** Referenced in `/api/products/route.ts`

#### product-flow-tracking.sql (14,636 bytes)
- **Purpose:** Track real product movements
- **Tables:**
  - warehouse_inventory
  - product_shipments (Merchant → Warehouse)
  - product_flow_summary
- **Status:** product_flow_summary table missing, warehouse_inventory missing
- **Codebase usage:** Referenced in `/api/products/[id]/flow-summary/route.ts`

### C. WAREHOUSE & MOQ FILES

#### moq-and-warehouses.sql (13,575 bytes)
- **Purpose:** Minimum Order Quantities & Consolidation Warehouses
- **Adds to products:**
  - minimum_order_quantity, moq_unit, moq_enabled, moq_discount_percentage, allow_partial_orders, consolidation_required
- **Tables:**
  - consolidation_warehouses
  - warehouse_partners
- **Status:** NOT in database
- **Codebase usage:** Referenced in codebase (warehouses folder)

#### moq-enhancements.sql (11,366 bytes)
- **Purpose:** MOQ enhancements
- **Status:** To be analyzed

#### warehouse-sample-data.sql (4,901 bytes)
- **Purpose:** Sample warehouse data
- **Status:** Sample data only - not critical

### D. MESSAGING SYSTEM

#### messaging-system.sql (11,974 bytes)
- **Purpose:** Messaging System
- **Tables:**
  - conversations
  - conversation_participants
  - messages
- **Status:** conversation_participants and messages tables exist (from 001_safe_setup.sql), but conversations table missing
- **Codebase usage:** Referenced in `/api/messages/conversations/route.ts`, `/api/messages/[conversationId]/route.ts`

### E. BRANDING & LOGOS

#### merchant-branding.sql (5,208 bytes)
- **Purpose:** Merchant Branding & Company Information
- **Adds to merchants:**
  - logo_url, logo_square_url, logo_horizontal_url, brand_colors, company_description, founded_year, employee_count, annual_revenue, company_registration, vat_number, website_url, social media URLs
- **Tables:**
  - merchant_contacts
- **Status:** NOT in database
- **Codebase usage:** Unknown - need to check

#### community-logos.sql (2,327 bytes)
- **Purpose:** Community Logos & Branding
- **Adds to communities:**
  - logo_url, logo_banner_url, logo_icon_url, brand_colors, show_on_homepage
- **Status:** Partially integrated (logo_url exists, but others missing)
- **Codebase usage:** Unknown - need to check

### F. SECURITY & SHIPPING

#### security-hardening.sql (18,390 bytes)
- **Purpose:** Security Hardening
- **Tables:**
  - audit_vault.immutable_signatures (separate schema)
- **Features:**
  - Immutable audit logs (WORM behavior)
  - Prevent modifications to audit logs
- **Status:** NOT in database
- **Codebase usage:** Unknown - likely not critical for MVP

#### shipping-restrictions.sql (6,620 bytes)
- **Purpose:** Shipping Restrictions & Consolidation Rules
- **Adds to products:**
  - can_consolidate, shipping_restrictions, requires_cold_chain, requires_frozen, is_fragile, is_hazardous, max_stack_weight, shipping_notes, separate_packaging_required
- **Tables:**
  - shipping_restriction_categories
- **Status:** NOT in database
- **Codebase usage:** Unknown - likely not critical for MVP

### G. WEBHOOKS & SAMPLE DATA

#### webhook-queue.sql (4,816 bytes)
- **Purpose:** Warehouse Webhook Message Queue
- **Tables:**
  - webhook_queue
- **Features:**
  - Async processing to prevent race conditions
- **Status:** NOT in database
- **Codebase usage:** Referenced in `/api/webhooks/warehouse/route.ts` (uses warehouse_partners, warehouse_events, asn_notices, shipments)

#### sample-calculator-data.sql (7,923 bytes)
- **Purpose:** Sample Calculator Data
- **Status:** Sample data only - not critical for schema

### H. MASTER SETUP FILES

These are large aggregate files that combine multiple features:
- CLEAN_INSTALL.sql (32,040 bytes)
- COMPLETE_MASTER_SETUP.sql (61,870 bytes)
- COMPLETE_SETUP.sql (30,050 bytes)
- FINAL_COMPLETE_SETUP.sql (35,069 bytes)
- MASTER_SETUP.sql (25,667 bytes)
- PRODUCTION_READY.sql (35,878 bytes)
- RLS_FIX.sql (11,797 bytes)
- VERIFIED_COMPLETE.sql (37,442 bytes)
- VERIFY_SETUP.sql (5,574 bytes)

**Status:** These are aggregate files - features should be extracted individually

---

## 3. SUPABASE MIGRATIONS

### Current Migrations:
- 000_validate_database.sql - Validation script
- 001_safe_setup.sql - Core tables (organizations, profiles, communities, community_members, merchants, products, community_products, blog_posts)
- blog_posts.sql - Blog posts table (redundant with 001_safe_setup.sql)
- organizations.sql - Organizations table (redundant with 001_safe_setup.sql)

---

## 4. CODEBASE TABLE REFERENCES

From grep analysis:

**Tables referenced in codebase:**
- profiles ✅ (exists)
- organizations ✅ (exists)
- communities ✅ (exists)
- community_members ✅ (exists)
- merchants ✅ (exists)
- products ✅ (exists)
- community_products ✅ (exists)
- blog_posts ✅ (exists)
- seller_profiles ❌ (missing)
- warehouse_partners ❌ (missing)
- warehouse_events ❌ (missing)
- asn_notices ❌ (missing)
- shipments ❌ (missing)
- warehouse_inventory ❌ (missing)
- consolidation_warehouses ❌ (missing)
- orders ❌ (missing)
- campaigns ❌ (missing)
- conversation_participants ✅ (exists)
- messages ✅ (exists)
- conversations ❌ (missing)
- merchant_community_messages ❌ (missing)
- product_categories ✅ (exists)
- product_flow_summary ❌ (missing)
- user_achievements ❌ (missing)
- avatar_items ❌ (missing)
- order_items ❌ (missing)

---

## 5. PRIORITY TABLES TO ADD

### HIGH PRIORITY (Used in codebase):
1. **seller_profiles** - Used in seller dashboard and shop pages
2. **warehouse_partners** - Used in warehouse webhooks
3. **warehouse_inventory** - Used in warehouse API
4. **consolidation_warehouses** - Used in warehouse API
5. **product_flow_summary** - Used in product flow API
6. **orders** - Used in stats calculator
7. **order_items** - Used in merchant showcase
8. **conversations** - Used in messaging system
9. **merchant_community_messages** - Used in merchant messaging

### MEDIUM PRIORITY (Used in database files but not in codebase yet):
1. **invitations** - For community invitations
2. **product_categories** - Already exists, but needs search features
3. **merchant_contacts** - For merchant contact persons
4. **shipping_restriction_categories** - For shipping rules

### LOW PRIORITY (Advanced features):
1. **product_attributes** - Enhanced product details
2. **moq features** - Minimum order quantities
3. **merchant_branding** - Branding fields
4. **community_logos** - Logo variants
5. **security_hardening** - Audit vault
6. **shipping_restrictions** - Shipping rules
7. **webhook_queue** - Webhook processing
8. **user_achievements** - Gamification
9. **avatar_items** - Avatar customization

---

## 6. RECOMMENDED ACTION PLAN

### Phase 1: Add Critical Missing Tables (High Priority)
Create migration to add:
1. seller_profiles
2. warehouse_partners
3. warehouse_inventory
4. consolidation_warehouses
5. product_flow_summary
6. orders
7. order_items
8. conversations
9. merchant_community_messages
10. invitations

### Phase 2: Add Product Features (Medium Priority)
1. Complete product_categories (add search_vector, tags)
2. Add product_attributes to products table
3. Add MOQ features to products table
4. Add merchant_contacts table
5. Add merchant_branding fields to merchants table
6. Add community_logo fields to communities table

### Phase 3: Advanced Features (Low Priority)
1. shipping_restrictions
2. security_hardening (audit vault)
3. webhook_queue
4. user_achievements
5. avatar_items

---

## 7. NEXT STEPS

1. ✅ Analyze all database files
2. ✅ Check codebase for table references
3. ⏳ Create comprehensive migration for Phase 1 tables
4. ⏳ Test migration in Supabase
5. ⏳ Add Phase 2 features
6. ⏳ Add Phase 3 features if needed
