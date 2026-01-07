// ============================================================================
// Edge Function: sms-ingest
// Purpose: Secure SMS ingestion endpoint for MoMo SMS messages
// Authentication: API key (x-api-key header) or HMAC signature
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface IngestRequest {
  device_identifier: string
  sender_phone: string
  sms_text: string
  received_at: string  // ISO 8601
  sim_slot?: number
  message_id?: string
}

interface IngestResponse {
  success: boolean
  sms_id?: string
  transaction_id?: string
  duplicate?: boolean
  error?: string
  parse_status?: string
}

// Validate API key
function validateApiKey(providedKey: string | null, expectedKey: string | null): boolean {
  if (!expectedKey) {
    console.warn('SMS_INGEST_API_KEY not configured - allowing all requests (NOT FOR PRODUCTION)')
    return true
  }
  return providedKey === expectedKey
}

// Validate HMAC signature
function validateHmacSignature(
  body: string,
  providedSignature: string | null,
  secret: string | null
): boolean {
  if (!secret || !providedSignature) {
    return false
  }
  
  // In production, implement proper HMAC-SHA256 verification
  // For now, we rely on API key authentication
  return false
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Step 1: Authentication
    const apiKey = req.headers.get('x-api-key')
    const signature = req.headers.get('x-signature')
    const expectedApiKey = Deno.env.get('SMS_INGEST_API_KEY')
    const webhookSecret = Deno.env.get('SMS_WEBHOOK_SECRET')
    
    const bodyText = await req.text()
    
    // Try API key first, then HMAC signature
    const isAuthenticated = 
      validateApiKey(apiKey, expectedApiKey) ||
      validateHmacSignature(bodyText, signature, webhookSecret)

    if (!isAuthenticated && expectedApiKey) {
      console.error('Authentication failed: invalid API key or signature')
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Parse and validate request body
    let body: IngestRequest
    try {
      body = JSON.parse(bodyText)
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { device_identifier, sender_phone, sms_text, received_at, sim_slot, message_id } = body

    // Validate required fields
    if (!device_identifier) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: device_identifier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!sender_phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: sender_phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!sms_text) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: sms_text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!received_at) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: received_at' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate received_at is a valid ISO date
    const receivedDate = new Date(received_at)
    if (isNaN(receivedDate.getTime())) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid received_at format (expected ISO 8601)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    // Step 4: Call the ingest_sms RPC function
    const { data: ingestResult, error: ingestError } = await supabase.rpc('ingest_sms', {
      p_device_identifier: device_identifier,
      p_sender_phone: sender_phone,
      p_sms_text: sms_text,
      p_received_at: receivedDate.toISOString(),
      p_sim_slot: sim_slot ?? null,
      p_message_id: message_id ?? null
    })

    if (ingestError) {
      console.error('Ingest RPC error:', ingestError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: ingestError.message || 'Failed to ingest SMS' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if ingestion was successful
    if (!ingestResult?.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: ingestResult?.error || 'Unknown ingestion error',
          device_identifier
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If duplicate, return early with success
    if (ingestResult.duplicate) {
      return new Response(
        JSON.stringify({
          success: true,
          sms_id: ingestResult.sms_id,
          duplicate: true,
          message: 'SMS already ingested'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 5: Trigger parsing immediately
    const smsId = ingestResult.sms_id
    
    const { data: parseResult, error: parseError } = await supabase.rpc('parse_sms_deterministic', {
      p_sms_id: smsId
    })

    if (parseError) {
      console.error('Parse RPC error:', parseError)
      // Don't fail the ingest - SMS is saved, parsing failed
      return new Response(
        JSON.stringify({
          success: true,
          sms_id: smsId,
          parse_status: 'error',
          parse_error: parseError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 6: Check if AI fallback is needed and enabled
    if (!parseResult?.success && parseResult?.needs_ai_fallback) {
      // Check institution settings for AI fallback
      const { data: settings } = await supabase
        .from('institution_settings')
        .select('enable_ai_fallback')
        .eq('institution_id', ingestResult.institution_id)
        .single()

      if (settings?.enable_ai_fallback) {
        // Call the AI parsing function (existing parse-momo-sms)
        console.log('Triggering AI fallback parsing...')
        
        // Get SMS text for AI parsing
        const { data: smsData } = await supabase
          .from('momo_sms_raw')
          .select('sms_text, sender_phone, received_at')
          .eq('id', smsId)
          .single()

        if (smsData) {
          // Call existing AI parser via Edge Function invocation
          // Note: This is a simplified approach - in production you might use
          // Supabase's pg_net or a queue system
          try {
            const aiParseResponse = await fetch(
              `${supabaseUrl}/functions/v1/parse-momo-sms`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${serviceRoleKey}`
                },
                body: JSON.stringify({
                  sms_id: smsId,
                  sms_text: smsData.sms_text,
                  sender_phone: smsData.sender_phone,
                  received_at: smsData.received_at,
                  institution_id: ingestResult.institution_id
                })
              }
            )

            if (aiParseResponse.ok) {
              const aiResult = await aiParseResponse.json()
              return new Response(
                JSON.stringify({
                  success: true,
                  sms_id: smsId,
                  transaction_id: aiResult.transaction_id,
                  parse_status: aiResult.success ? 'success' : 'error',
                  parser_type: aiResult.ai_provider || 'ai_fallback'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          } catch (aiError) {
            console.error('AI fallback error:', aiError)
            // Continue with deterministic parse result
          }
        }
      }
    }

    // Return parse result
    const response: IngestResponse = {
      success: true,
      sms_id: smsId,
      duplicate: parseResult?.duplicate ?? false,
      parse_status: parseResult?.success ? 'success' : 'pending'
    }

    if (parseResult?.transaction_id) {
      response.transaction_id = parseResult.transaction_id
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Ingest error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

