-- WhatsApp Message Logging Tables
-- For Meta WhatsApp Business API integration
-- Migration: 20260114_whatsapp_logs_table.sql

-- ============================================================================
-- ENSURE set_updated_at FUNCTION EXISTS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- OUTBOUND MESSAGE LOG (messages we send)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  
  -- Message details
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  phone_number TEXT NOT NULL,
  message_id TEXT, -- WhatsApp message ID (from API response)
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'template', 'document', 'image', 'button', 'interactive')),
  content TEXT, -- Message body or caption
  template_name TEXT, -- For template messages
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  
  -- Idempotency
  idempotency_key TEXT,
  
  -- Metadata
  request_id UUID, -- For request tracing
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_message_log_idempotency 
  ON whatsapp_message_log(institution_id, idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_institution_id 
  ON whatsapp_message_log(institution_id);
  
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_phone_number 
  ON whatsapp_message_log(phone_number);
  
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_message_id 
  ON whatsapp_message_log(message_id) 
  WHERE message_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_status 
  ON whatsapp_message_log(status);
  
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_created_at 
  ON whatsapp_message_log(created_at DESC);

-- ============================================================================
-- INBOUND LOG (webhook payloads from Meta)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_inbound_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  
  -- Message details
  from_phone TEXT NOT NULL,
  message_id TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT, -- Extracted message content
  
  -- Raw data
  raw_payload JSONB NOT NULL,
  
  -- Processing status
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  -- Timestamps
  webhook_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_inbound_log_from_phone 
  ON whatsapp_inbound_log(from_phone);
  
CREATE INDEX IF NOT EXISTS idx_whatsapp_inbound_log_message_id 
  ON whatsapp_inbound_log(message_id);
  
CREATE INDEX IF NOT EXISTS idx_whatsapp_inbound_log_processed 
  ON whatsapp_inbound_log(processed) 
  WHERE processed = FALSE;
  
CREATE INDEX IF NOT EXISTS idx_whatsapp_inbound_log_created_at 
  ON whatsapp_inbound_log(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.whatsapp_message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_inbound_log ENABLE ROW LEVEL SECURITY;

-- Message log: institution-scoped access
DROP POLICY IF EXISTS "whatsapp_message_log_access" ON public.whatsapp_message_log;
CREATE POLICY "whatsapp_message_log_access"
ON public.whatsapp_message_log
FOR ALL
USING (
  public.is_platform_admin() 
  OR institution_id = public.current_institution_id()
)
WITH CHECK (
  public.is_platform_admin() 
  OR institution_id = public.current_institution_id()
);

-- Inbound log: institution-scoped or null (unmatched)
DROP POLICY IF EXISTS "whatsapp_inbound_log_access" ON public.whatsapp_inbound_log;
CREATE POLICY "whatsapp_inbound_log_access"
ON public.whatsapp_inbound_log
FOR ALL
USING (
  public.is_platform_admin() 
  OR institution_id = public.current_institution_id()
  OR institution_id IS NULL -- Allow access to unmatched inbound messages for processing
)
WITH CHECK (
  public.is_platform_admin() 
  OR institution_id = public.current_institution_id()
  OR institution_id IS NULL
);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
DROP TRIGGER IF EXISTS set_whatsapp_message_log_updated_at ON public.whatsapp_message_log;
CREATE TRIGGER set_whatsapp_message_log_updated_at
BEFORE UPDATE ON public.whatsapp_message_log
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ADD request_id COLUMN TO audit_log (if not exists)
-- ============================================================================
ALTER TABLE public.audit_log 
  ADD COLUMN IF NOT EXISTS request_id UUID;

CREATE INDEX IF NOT EXISTS idx_audit_log_request_id 
  ON public.audit_log(request_id) 
  WHERE request_id IS NOT NULL;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_message_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_inbound_log TO authenticated;

-- Service role (Edge Functions) needs full access
GRANT ALL ON public.whatsapp_message_log TO service_role;
GRANT ALL ON public.whatsapp_inbound_log TO service_role;

COMMENT ON TABLE public.whatsapp_message_log IS 'Tracks all WhatsApp messages (outbound and status updates)';
COMMENT ON TABLE public.whatsapp_inbound_log IS 'Stores inbound WhatsApp webhooks from Meta API';
