-- ============================================================================
-- Seed Data: Reports Demo Data
-- Purpose: Ensure sufficient transaction data across groups/members for reports
-- ============================================================================

-- This seed file adds additional transactions to make reports meaningful.
-- It assumes groups and members already exist from previous seeds (010_groups_members_demo_data.sql)

-- Generate additional allocated transactions for the last 60 days
-- to ensure reports have meaningful data
do $$
declare
  v_institution_id uuid;
  v_group record;
  v_member record;
  v_days_ago int;
  v_amount numeric;
  v_tx_date timestamptz;
begin
  -- Get first institution
  select id into v_institution_id from public.institutions limit 1;
  
  if v_institution_id is null then
    raise notice 'No institution found, skipping reports seed data';
    return;
  end if;

  -- Loop through each group
  for v_group in 
    select id, group_name from public.groups 
    where institution_id = v_institution_id 
    limit 10
  loop
    -- Loop through each member in the group
    for v_member in 
      select id, full_name from public.members 
      where group_id = v_group.id 
      limit 10
    loop
      -- Generate 5-10 transactions per member over last 60 days
      for v_days_ago in 1..60 by (floor(random() * 10 + 5)::int) loop
        v_amount := floor(random() * 15000 + 5000)::numeric; -- 5,000 to 20,000 RWF
        v_tx_date := now() - (v_days_ago * interval '1 day') + (floor(random() * 12) * interval '1 hour');
        
        -- Insert allocated transaction
        insert into public.transactions (
          institution_id, member_id, group_id, amount, currency, type, channel,
          status, allocation_status, occurred_at, payer_phone, payer_name,
          momo_ref, allocated_at, allocated_by
        ) values (
          v_institution_id,
          v_member.id,
          v_group.id,
          v_amount,
          'RWF',
          'CONTRIBUTION',
          'MOMO',
          'COMPLETED',
          'allocated',
          v_tx_date,
          '0788' || lpad(floor(random() * 999999 + 100000)::text, 6, '0'),
          v_member.full_name,
          'REF' || to_char(v_tx_date, 'YYYYMMDDHH24MISS') || floor(random() * 1000)::text,
          v_tx_date + interval '1 hour',
          null -- system allocated
        )
        on conflict do nothing;
      end loop;
    end loop;
  end loop;

  raise notice 'Reports demo data generation complete for institution %', v_institution_id;
end $$;

-- Add some unallocated transactions for the last 7 days (for reports to show)
do $$
declare
  v_institution_id uuid;
  v_i int;
  v_amount numeric;
  v_tx_date timestamptz;
begin
  select id into v_institution_id from public.institutions limit 1;
  
  if v_institution_id is null then
    return;
  end if;

  -- Add 15 unallocated transactions
  for v_i in 1..15 loop
    v_amount := floor(random() * 25000 + 2000)::numeric;
    v_tx_date := now() - (floor(random() * 7) * interval '1 day') - (floor(random() * 12) * interval '1 hour');
    
    insert into public.transactions (
      institution_id, amount, currency, type, channel,
      status, allocation_status, occurred_at, payer_phone, payer_name,
      momo_ref
    ) values (
      v_institution_id,
      v_amount,
      'RWF',
      'CONTRIBUTION',
      'MOMO',
      'COMPLETED',
      'unallocated',
      v_tx_date,
      '0788' || lpad(floor(random() * 999999 + 100000)::text, 6, '0'),
      'Unknown Payer ' || v_i,
      'REF' || to_char(v_tx_date, 'YYYYMMDDHH24MISS') || floor(random() * 1000)::text
    )
    on conflict do nothing;
  end loop;

  raise notice 'Added 15 unallocated transactions for reports testing';
end $$;

-- Add some error transactions
do $$
declare
  v_institution_id uuid;
  v_i int;
  v_amount numeric;
  v_tx_date timestamptz;
begin
  select id into v_institution_id from public.institutions limit 1;
  
  if v_institution_id is null then
    return;
  end if;

  -- Add 5 error transactions
  for v_i in 1..5 loop
    v_amount := floor(random() * 100000 + 50000)::numeric; -- Larger amounts with errors
    v_tx_date := now() - (floor(random() * 14) * interval '1 day');
    
    insert into public.transactions (
      institution_id, amount, currency, type, channel,
      status, allocation_status, occurred_at, payer_phone, payer_name,
      momo_ref, flag_reason
    ) values (
      v_institution_id,
      v_amount,
      'RWF',
      'CONTRIBUTION',
      'MOMO',
      'COMPLETED',
      'error',
      v_tx_date,
      '0788' || lpad(floor(random() * 999999 + 100000)::text, 6, '0'),
      'Error Sender ' || v_i,
      'REF' || to_char(v_tx_date, 'YYYYMMDDHH24MISS') || floor(random() * 1000)::text,
      case v_i 
        when 1 then 'Parse failed'
        when 2 then 'Unknown sender'
        when 3 then 'Duplicate reference detected'
        when 4 then 'Parsing confidence low'
        else 'Manual review required'
      end
    )
    on conflict do nothing;
  end loop;

  raise notice 'Added 5 error transactions for reports testing';
end $$;

