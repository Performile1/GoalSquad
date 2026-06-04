-- =====================================================================
-- GOALSQUAD MIGRATION: MOQ CAMPAIGN RULES & STATUS
-- =====================================================================
-- MOQ Fas 1: Utöka community_campaigns med statusar och affärsregler

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Uppdatera status CHECK constraint för att inkludera nya kampanjstatusar
-- ---------------------------------------------------------------------
-- Först måste vi ta bort befintlig constraint om den finns
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;

-- Lägg till ny CHECK constraint med alla statusar
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_status_check 
CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'moq_succeeded', 'moq_failed'));

-- ---------------------------------------------------------------------
-- 2. Lägg till affärsregelfält för dynamisk kampanjhantering
-- ---------------------------------------------------------------------
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS grace_period_hours INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_extend_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_extend_days INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS auto_extend_threshold_pct INT DEFAULT 90,
ADD COLUMN IF NOT EXISTS manual_dispense_granted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS moq_target INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- ---------------------------------------------------------------------
-- 3. Index för snabb utvärdering av kampanjer som ska stängas
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_campaigns_eval_status 
ON public.campaigns(end_date, status) 
WHERE status = 'active';

-- ---------------------------------------------------------------------
-- 4. Index för spårning av bearbetade kampanjer
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_campaigns_processed_at 
ON public.campaigns(processed_at) 
WHERE processed_at IS NOT NULL;

COMMIT;

-- =====================================================================
-- NOTERINGAR
-- =====================================================================
-- Denna migration lägger till:
-- 1. Nya kampanjstatusar: moq_succeeded, moq_failed
-- 2. Affärsregelfält för grace period, auto-extend och manuell dispens
-- 3. Index för snabb utvärdering av aktiva kampanjer som nått slutdatum
--
-- Statusar:
-- - draft: Kampanj under utveckling
-- - active: Kampanj är live och tar emot ordrar
-- - paused: Kampanj pausad temporärt
-- - completed: Kampanj slutförd manuellt
-- - cancelled: Kampanj avbruten
-- - moq_succeeded: MOQ uppnådd - ordrar ska debiteras
-- - moq_failed: MOQ misslyckad - ordrar ska återkallas
