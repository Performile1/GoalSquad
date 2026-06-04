-- =====================================================================
-- GOALSQUAD MIGRATION: FAS 5 - GROUP SALES STRUCTURE
-- =====================================================================
-- Adds groups and group_members tables for campaign/group sales functionality
-- Uses existing organizations and campaigns tables

BEGIN;

-- ---------------------------------------------------------------------
-- 1. GROUPS TABLE (Sub-entities within organizations/campaigns)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT UNIQUE,
    target_quantity INTEGER DEFAULT 0,
    current_quantity INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_groups_organization ON public.groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_groups_campaign ON public.groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_groups_leader ON public.groups(leader_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);


-- ---------------------------------------------------------------------
-- 2. GROUP_MEMBERS TABLE (Membership tracking)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member', 'admin')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    contribution_quantity INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);


-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 3.1 POLICIES FOR: groups
CREATE POLICY "Users can view groups in their organization" ON public.groups
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT id FROM public.organizations 
            WHERE id IN (
                SELECT organization_id FROM public.profiles WHERE id = auth.uid()
            )
        )
        OR campaign_id IN (
            SELECT id FROM public.campaigns 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Group leaders can update their group" ON public.groups
    FOR UPDATE
    TO authenticated
    USING (leader_id = auth.uid())
    WITH CHECK (leader_id = auth.uid());

CREATE POLICY "Admins can manage groups" ON public.groups
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role = 'admin' OR detailed_role = 'platform_admin'
    ));

-- 3.2 POLICIES FOR: group_members
CREATE POLICY "Users can view their group memberships" ON public.group_members
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Group leaders can view their group members" ON public.group_members
    FOR SELECT
    TO authenticated
    USING (
        group_id IN (
            SELECT id FROM public.groups WHERE leader_id = auth.uid()
        )
    );

CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Group leaders can manage members" ON public.group_members
    FOR UPDATE
    TO authenticated
    USING (
        group_id IN (
            SELECT id FROM public.groups WHERE leader_id = auth.uid()
        )
    )
    WITH CHECK (
        group_id IN (
            SELECT id FROM public.groups WHERE leader_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all group members" ON public.group_members
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role = 'admin' OR detailed_role = 'platform_admin'
    ));


-- ---------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------

-- Update updated_at on groups
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('groups', 'group_members')
ORDER BY table_name, ordinal_position;
