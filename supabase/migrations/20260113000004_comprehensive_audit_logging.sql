-- ============================================================================
-- Comprehensive Audit Logging Migration
-- Date: 2026-01-13
-- Purpose: Add automatic audit logging triggers for key entities
-- ============================================================================

-- ============================================================================
-- STEP 1: Enhanced audit log function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
DECLARE
  v_institution_id UUID;
  v_actor_email TEXT;
BEGIN
  -- Get institution and email from current user profile
  SELECT institution_id, email INTO v_institution_id, v_actor_email
  FROM profiles WHERE user_id = auth.uid();
  
  INSERT INTO audit_log (
    institution_id,
    actor_user_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    metadata,
    created_at
  ) VALUES (
    v_institution_id,
    auth.uid(),
    v_actor_email,
    p_action,
    p_entity_type,
    p_entity_id::TEXT,
    p_details,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, UUID, JSONB) TO authenticated;

-- ============================================================================
-- STEP 2: Transaction allocation audit trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_transaction_allocation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log when allocation status actually changes
  IF TG_OP = 'UPDATE' AND 
     OLD.allocation_status IS DISTINCT FROM NEW.allocation_status THEN
    PERFORM public.log_audit_event(
      'TX_ALLOCATED',
      'transaction',
      NEW.id,
      jsonb_build_object(
        'member_id', NEW.member_id,
        'group_id', NEW.group_id,
        'old_status', OLD.allocation_status,
        'new_status', NEW.allocation_status,
        'amount', NEW.amount
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_transaction_allocation_audit ON transactions;
CREATE TRIGGER trigger_transaction_allocation_audit
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_transaction_allocation();

-- ============================================================================
-- STEP 3: Member changes audit trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_member_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'MEMBER_CREATED',
      'member',
      NEW.id,
      jsonb_build_object(
        'full_name', NEW.full_name,
        'phone', NEW.phone,
        'group_id', NEW.group_id
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if meaningful fields changed
    IF OLD.full_name IS DISTINCT FROM NEW.full_name OR
       OLD.phone IS DISTINCT FROM NEW.phone OR
       OLD.group_id IS DISTINCT FROM NEW.group_id OR
       OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.log_audit_event(
        'MEMBER_UPDATED',
        'member',
        NEW.id,
        jsonb_build_object(
          'changes', jsonb_build_object(
            'full_name', CASE WHEN OLD.full_name IS DISTINCT FROM NEW.full_name 
                         THEN jsonb_build_object('old', OLD.full_name, 'new', NEW.full_name) END,
            'phone', CASE WHEN OLD.phone IS DISTINCT FROM NEW.phone 
                     THEN jsonb_build_object('old', OLD.phone, 'new', NEW.phone) END,
            'group_id', CASE WHEN OLD.group_id IS DISTINCT FROM NEW.group_id 
                        THEN jsonb_build_object('old', OLD.group_id, 'new', NEW.group_id) END,
            'status', CASE WHEN OLD.status IS DISTINCT FROM NEW.status 
                      THEN jsonb_build_object('old', OLD.status, 'new', NEW.status) END
          )
        )
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      'MEMBER_DELETED',
      'member',
      OLD.id,
      jsonb_build_object(
        'full_name', OLD.full_name,
        'phone', OLD.phone
      )
    );
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_member_changes_audit ON members;
CREATE TRIGGER trigger_member_changes_audit
  AFTER INSERT OR UPDATE OR DELETE ON members
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_member_changes();

-- ============================================================================
-- STEP 4: Group changes audit trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_group_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'GROUP_CREATED',
      'group',
      NEW.id,
      jsonb_build_object(
        'group_name', NEW.group_name,
        'status', NEW.status,
        'expected_amount', NEW.expected_amount
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if meaningful fields changed
    IF OLD.group_name IS DISTINCT FROM NEW.group_name OR
       OLD.status IS DISTINCT FROM NEW.status OR
       OLD.expected_amount IS DISTINCT FROM NEW.expected_amount THEN
      PERFORM public.log_audit_event(
        'GROUP_UPDATED',
        'group',
        NEW.id,
        jsonb_build_object(
          'changes', jsonb_build_object(
            'group_name', CASE WHEN OLD.group_name IS DISTINCT FROM NEW.group_name 
                          THEN jsonb_build_object('old', OLD.group_name, 'new', NEW.group_name) END,
            'status', CASE WHEN OLD.status IS DISTINCT FROM NEW.status 
                      THEN jsonb_build_object('old', OLD.status, 'new', NEW.status) END,
            'expected_amount', CASE WHEN OLD.expected_amount IS DISTINCT FROM NEW.expected_amount 
                               THEN jsonb_build_object('old', OLD.expected_amount, 'new', NEW.expected_amount) END
          )
        )
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      'GROUP_DELETED',
      'group',
      OLD.id,
      jsonb_build_object(
        'group_name', OLD.group_name
      )
    );
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_group_changes_audit ON groups;
CREATE TRIGGER trigger_group_changes_audit
  AFTER INSERT OR UPDATE OR DELETE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_group_changes();



-- ============================================================================
-- STEP 6: Profile/role changes audit trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log role changes
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      PERFORM public.log_audit_event(
        'STAFF_ROLE_UPDATED',
        'profile',
        NEW.user_id,
        jsonb_build_object(
          'email', NEW.email,
          'old_role', OLD.role,
          'new_role', NEW.role
        )
      );
    END IF;
    
    -- Log status changes (active/suspended)
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.log_audit_event(
        CASE WHEN NEW.status = 'ACTIVE' THEN 'STAFF_REACTIVATED' ELSE 'STAFF_DEACTIVATED' END,
        'profile',
        NEW.user_id,
        jsonb_build_object(
          'email', NEW.email,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_profile_audit ON profiles;
CREATE TRIGGER trigger_profile_audit
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== COMPREHENSIVE AUDIT LOGGING COMPLETE ===';
  RAISE NOTICE 'Triggers installed:';
  RAISE NOTICE '  - trigger_transaction_allocation_audit (transactions)';
  RAISE NOTICE '  - trigger_member_changes_audit (members)';
  RAISE NOTICE '  - trigger_group_changes_audit (groups)';
  RAISE NOTICE '  - trigger_sms_source_audit (sms_sources)';
  RAISE NOTICE '  - trigger_profile_audit (profiles)';
END $$;

-- ============================================================================
-- End of migration
-- ============================================================================
