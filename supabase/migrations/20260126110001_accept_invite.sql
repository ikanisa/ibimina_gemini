-- ============================================================================
-- Migration: Accept Invite Function
-- Purpose: Allow users to join a group using a valid invite token
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_invite(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_group_id uuid;
    v_group_institution_id uuid;
    v_expires_at timestamptz;
    v_usage_limit int;
    v_used_count int;
    v_existing_member_id uuid;
    v_membership_id uuid;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    if v_user_id is null then
        return jsonb_build_object('status', 'error', 'message', 'Not authenticated');
    end if;

    -- 1. Validate Token & Get Group
    SELECT group_id, expires_at, usage_limit, used_count
    INTO v_group_id, v_expires_at, v_usage_limit, v_used_count
    FROM public.group_invites
    WHERE token = p_token;

    IF v_group_id IS NULL THEN
        return jsonb_build_object('status', 'error', 'message', 'Invalid invite');
    END IF;

    IF v_expires_at < now() THEN
        return jsonb_build_object('status', 'error', 'message', 'Invite expired');
    END IF;

    IF v_usage_limit IS NOT NULL AND v_used_count >= v_usage_limit THEN
        return jsonb_build_object('status', 'error', 'message', 'Invite usage limit reached');
    END IF;

    -- 2. Check if user is already a member
    SELECT id INTO v_existing_member_id
    FROM public.group_members
    WHERE group_id = v_group_id AND member_id = v_user_id AND status IN ('GOOD_STANDING', 'SUSPENDED');

    IF v_existing_member_id IS NOT NULL THEN
         return jsonb_build_object('status', 'already_member', 'group_id', v_group_id);
    END IF;

    -- 3. Get Institution ID (if needed for group_members)
    SELECT institution_id INTO v_group_institution_id
    FROM public.groups
    WHERE id = v_group_id;

    -- 4. Add Member
    -- Note: Ensure Enforce One-Group rule if applicable. 
    -- The previous schema had a partial unique index: idx_group_members_single_active.
    -- This insert will fail if specific constraint is violated.
    BEGIN
        INSERT INTO public.group_members (
            institution_id,
            group_id,
            member_id,
            role,
            status,
            user_id -- Link to auth.users if column exists (it was added in previous migration)
        ) VALUES (
            v_group_institution_id,
            v_group_id,
            v_user_id,
            'MEMBER',
            'GOOD_STANDING',
            v_user_id
        ) RETURNING id INTO v_membership_id;
    EXCEPTION WHEN unique_violation THEN
        return jsonb_build_object('status', 'error', 'message', 'User already in a group (One Group Policy)');
    END;

    -- 5. Update Invite Usage
    UPDATE public.group_invites
    SET used_count = used_count + 1
    WHERE token = p_token;

    return jsonb_build_object('status', 'joined', 'group_id', v_group_id, 'membership_id', v_membership_id);
END;
$$;
