-- ============================================================================
-- Seed: Groups & Members Demo Data
-- Purpose: Add 10+ groups and 100+ members for meaningful testing
-- ============================================================================

DO $$
DECLARE
  v_institution_id uuid;
  v_group_ids uuid[] := ARRAY[]::uuid[];
  v_group_id uuid;
  v_member_id uuid;
  i int;
  j int;
  v_group_names text[] := ARRAY[
    'Ibimina y''Urubyiruko',
    'Twisungane Savings',
    'Duterimbere Group',
    'Kunda Umurimo',
    'Terimbere Together',
    'Ejo Heza',
    'Umwalimu Savings',
    'Abadahigwa',
    'Ineza Group',
    'Ubumwe Savings',
    'Kigali Savers',
    'Vision 2050 Group'
  ];
  v_meeting_days text[] := ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  v_first_names text[] := ARRAY[
    'Jean', 'Marie', 'Pierre', 'Claire', 'Emmanuel', 'Grace', 'Divine', 'Patrick',
    'Alice', 'Robert', 'Jeanne', 'Michel', 'Aline', 'Eric', 'Claudine', 'Didier',
    'Esperance', 'Felix', 'Goretti', 'Innocent', 'Jacqueline', 'Kevin', 'Liliane', 'Marcel'
  ];
  v_last_names text[] := ARRAY[
    'Habimana', 'Uwimana', 'Niyonzima', 'Mukamana', 'Bizimana', 'Uwase', 'Ndayisaba',
    'Mugabo', 'Ishimwe', 'Kwizera', 'Nshimiyimana', 'Ingabire', 'Mutesi', 'Rugamba',
    'Kayitesi', 'Dusabe', 'Muhire', 'Nyiransabimana', 'Kabera', 'Munyaneza'
  ];
BEGIN
  -- Get first institution
  SELECT id INTO v_institution_id
  FROM public.institutions
  LIMIT 1;

  IF v_institution_id IS NULL THEN
    RAISE NOTICE 'No institutions found, skipping seed';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding groups and members for institution: %', v_institution_id;

  -- ============================================================================
  -- 1. Create 12 groups with unique codes
  -- ============================================================================
  FOR i IN 1..12 LOOP
    INSERT INTO public.groups (
      institution_id,
      group_name,
      group_code,
      meeting_day,
      frequency,
      expected_amount,
      status,
      created_at
    ) VALUES (
      v_institution_id,
      v_group_names[i],
      'GRP-' || lpad(i::text, 3, '0'),
      v_meeting_days[(i % 6) + 1],
      CASE WHEN i % 3 = 0 THEN 'Monthly' ELSE 'Weekly' END,
      CASE WHEN i % 3 = 0 THEN 20000 ELSE 5000 END,
      'ACTIVE',
      now() - (i * interval '1 day')
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NOT NULL THEN
      v_group_ids := array_append(v_group_ids, v_group_id);
    ELSE
      -- Get existing group id by code
      SELECT id INTO v_group_id
      FROM public.groups
      WHERE institution_id = v_institution_id AND group_code = 'GRP-' || lpad(i::text, 3, '0');
      IF v_group_id IS NOT NULL THEN
        v_group_ids := array_append(v_group_ids, v_group_id);
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE 'Created/found % groups', array_length(v_group_ids, 1);

  -- ============================================================================
  -- 2. Create 100+ members distributed across groups
  -- ============================================================================
  FOR i IN 1..120 LOOP
    -- Pick a random group
    v_group_id := v_group_ids[(i % array_length(v_group_ids, 1)) + 1];

    INSERT INTO public.members (
      institution_id,
      group_id,
      full_name,
      member_code,
      phone,
      phone_alt,
      status,
      created_at
    ) VALUES (
      v_institution_id,
      v_group_id,
      v_first_names[(i % 24) + 1] || ' ' || v_last_names[(i % 20) + 1],
      'M-' || lpad(i::text, 4, '0'),
      '0788' || lpad((100000 + i)::text, 6, '0'),
      CASE WHEN i % 5 = 0 THEN '0789' || lpad((200000 + i)::text, 6, '0') ELSE NULL END,
      CASE WHEN i % 20 = 0 THEN 'INACTIVE' ELSE 'ACTIVE' END,
      now() - (i * interval '2 hours')
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_member_id;

    -- Also add to group_members junction table
    IF v_member_id IS NOT NULL AND v_group_id IS NOT NULL THEN
      INSERT INTO public.group_members (
        institution_id,
        group_id,
        member_id,
        role,
        status,
        joined_date
      ) VALUES (
        v_institution_id,
        v_group_id,
        v_member_id,
        CASE 
          WHEN i % 12 = 1 THEN 'CHAIRPERSON'
          WHEN i % 12 = 2 THEN 'TREASURER'
          WHEN i % 12 = 3 THEN 'SECRETARY'
          ELSE 'MEMBER'
        END,
        CASE WHEN i % 15 = 0 THEN 'SUSPENDED' ELSE 'GOOD_STANDING' END,
        current_date - (i % 365)
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RAISE NOTICE 'Created 120 members';

  -- ============================================================================
  -- 3. Add some members without groups (to test the wizard flow)
  -- ============================================================================
  FOR i IN 1..10 LOOP
    INSERT INTO public.members (
      institution_id,
      group_id,
      full_name,
      member_code,
      phone,
      status,
      created_at
    ) VALUES (
      v_institution_id,
      NULL,  -- No group
      'Unassigned Member ' || i,
      'M-UN' || lpad(i::text, 3, '0'),
      '0787' || lpad((900000 + i)::text, 6, '0'),
      'ACTIVE',
      now()
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Created 10 unassigned members';

  -- ============================================================================
  -- 4. Log the seeding action
  -- ============================================================================
  INSERT INTO public.audit_log (
    actor_user_id,
    institution_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    NULL,
    v_institution_id,
    'seed_groups_members',
    'system',
    NULL,
    jsonb_build_object(
      'groups_count', array_length(v_group_ids, 1),
      'members_count', 130,
      'seeded_at', now()
    )
  );

  RAISE NOTICE 'Groups & Members seed complete!';

END $$;

-- ============================================================================
-- Summary:
-- - 12 groups with unique codes (GRP-001 to GRP-012)
-- - 120 members distributed across groups (M-0001 to M-0120)
-- - 10 unassigned members (M-UN001 to M-UN010)
-- - Various roles: Chairperson, Treasurer, Secretary, Member
-- - Mix of active/inactive/suspended statuses
-- ============================================================================

