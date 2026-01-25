-- ============================================================================
-- Migration: Group Invites & Opaque Tokens
-- Purpose: Secure invites via opaque UUID tokens, deep link support
-- ============================================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.group_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    usage_limit INT, -- NULL means unlimited
    used_count INT DEFAULT 0,
    CONSTRAINT unique_token UNIQUE (token)
);

-- 2. Enable RLS
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_group_invites_token ON public.group_invites(token);
CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON public.group_invites(group_id);

-- 4. RLS Policies

-- Policy: Admins/Owners can create invites for their groups
CREATE POLICY "Admins can create invites" ON public.group_invites
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_invites.group_id
        AND gm.member_id = auth.uid()
        AND gm.role IN ('ADMIN', 'OWNER')
        AND gm.status = 'GOOD_STANDING'
    )
);

-- Policy: Admins/Owners can view invites for their groups
CREATE POLICY "Admins can view invites" ON public.group_invites
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_invites.group_id
        AND gm.member_id = auth.uid()
        AND gm.role IN ('ADMIN', 'OWNER')
        AND gm.status = 'GOOD_STANDING'
    )
);

-- Policy: Admins/Owners can delete invites
CREATE POLICY "Admins can delete invites" ON public.group_invites
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_invites.group_id
        AND gm.member_id = auth.uid()
        AND gm.role IN ('ADMIN', 'OWNER')
        AND gm.status = 'GOOD_STANDING'
    )
);


-- 5. Secure Function to Resolve Invite Token (The "Privacy Implementation")
-- This allows resolving a token to group metadata WITHOUT giving public access to the groups table.
CREATE OR REPLACE FUNCTION public.get_invite_details(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_group_id uuid;
    v_group_name text;
    v_member_count int;
    v_expires_at timestamptz;
BEGIN
    -- Validate token
    SELECT group_id, expires_at INTO v_group_id, v_expires_at
    FROM public.group_invites
    WHERE token = p_token;

    IF v_group_id IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invalid token');
    END IF;

    IF v_expires_at < now() THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Token expired');
    END IF;

    -- Fetch limited group details
    SELECT name INTO v_group_name
    FROM public.groups
    WHERE id = v_group_id;

    -- Count members
    SELECT count(*) INTO v_member_count
    FROM public.group_members
    WHERE group_id = v_group_id AND status = 'GOOD_STANDING';

    RETURN jsonb_build_object(
        'valid', true,
        'group_name', v_group_name,
        'member_count', v_member_count,
        'group_id', v_group_id
    );
END;
$$;
