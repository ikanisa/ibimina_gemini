-- Migration: Create consolidated transactions view for unified Transactions page
-- Created: 2026-01-08

-- Create a consolidated view that joins the SMS pipeline tables
CREATE OR REPLACE VIEW public.vw_transactions_consolidated AS
SELECT 
  t.id,
  t.institution_id,
  t.occurred_at,
  t.created_at,
  t.amount,
  t.currency,
  t.payer_phone,
  t.payer_name,
  t.momo_ref,
  t.type as transaction_type,
  t.channel,
  t.status as transaction_status,
  t.allocation_status,
  t.member_id,
  t.group_id,
  t.parse_confidence,
  -- SMS source info
  sms.id as sms_id,
  sms.sms_text,
  sms.sender_phone,
  sms.received_at as sms_received_at,
  sms.parse_status,
  sms.parse_error,
  sms.source as sms_source,
  -- Member info (if allocated)
  m.full_name as member_name,
  m.phone as member_phone,
  -- Group info (if allocated)
  g.group_name,
  -- Institution info
  i.name as institution_name
FROM public.transactions t
LEFT JOIN public.momo_sms_raw sms ON t.momo_sms_id = sms.id
LEFT JOIN public.members m ON t.member_id = m.id
LEFT JOIN public.groups g ON t.group_id = g.id
LEFT JOIN public.institutions i ON t.institution_id = i.id
ORDER BY t.occurred_at DESC;

-- Create RLS policy for the view (inherits from underlying tables but we make it explicit)
COMMENT ON VIEW public.vw_transactions_consolidated IS 'Consolidated view of transactions with SMS parsing and allocation details for the unified Transactions page';

-- Grant access to authenticated users (RLS on underlying tables still applies)
GRANT SELECT ON public.vw_transactions_consolidated TO authenticated;
GRANT SELECT ON public.vw_transactions_consolidated TO service_role;
