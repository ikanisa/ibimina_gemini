// ============================================================================
// Edge Function: parse-momo-sms
// Purpose: Parse MoMo SMS using AI (OpenAI primary, Gemini fallback)
// NOTE: This is the AI FALLBACK parser. Deterministic parsing happens first
//       via the parse_sms_deterministic RPC function.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParseRequest {
  sms_id: string
  sms_text: string
  sender_phone: string
  received_at?: string
  institution_id?: string
}

interface ParsedSMS {
  amount: number
  currency?: string
  momo_ref?: string
  momo_tx_id?: string
  payer_name?: string
  occurred_at?: string
  confidence: number
  error?: string
}

const SMS_PARSE_PROMPT = `Extract transaction details from this Mobile Money SMS. Return ONLY a JSON object with these fields:
- amount: numeric amount (required, no currency symbols or commas)
- currency: currency code (default "RWF" if not specified)
- momo_ref: transaction reference number if present
- momo_tx_id: unique transaction ID if different from ref
- payer_name: name of payer if mentioned
- occurred_at: ISO 8601 timestamp if date/time mentioned, otherwise use null
- confidence: your confidence in the parse (0.0 to 1.0)

SMS Text: "{SMS_TEXT}"

Return ONLY valid JSON, no other text. Example:
{"amount": 5000, "currency": "RWF", "momo_ref": "ABC123", "momo_tx_id": "TXN456", "payer_name": "John Doe", "occurred_at": "2025-01-07T10:30:00Z", "confidence": 0.95}

If you cannot extract a valid amount, return: {"error": "Unable to parse SMS", "confidence": 0}`

// Parse SMS using OpenAI
async function parseWithOpenAI(smsText: string, apiKey: string): Promise<ParsedSMS> {
  const prompt = SMS_PARSE_PROMPT.replace('{SMS_TEXT}', smsText)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise data extraction assistant. Extract transaction details from Mobile Money SMS messages. Always return valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 512
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenAI API error:', errorText)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const textContent = data.choices?.[0]?.message?.content || '{}'

  const jsonMatch = textContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in OpenAI response')
  }

  return JSON.parse(jsonMatch[0])
}

// Parse SMS using Gemini (fallback)
async function parseWithGemini(smsText: string, apiKey: string, model: string): Promise<ParsedSMS> {
  const prompt = SMS_PARSE_PROMPT.replace('{SMS_TEXT}', smsText)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', errorText)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

  const jsonMatch = textContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in Gemini response')
  }

  return JSON.parse(jsonMatch[0])
}

// ============================================================================
// Rate Limiting (In-Memory)
// ============================================================================

const RATE_LIMIT = 50 // requests per minute (lower than sms-ingest since this is more expensive)
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds

const rateLimitMap = new Map<string, number[]>()

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(clientId) || []

  // Filter timestamps within the rate limit window
  const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW)

  if (recentTimestamps.length >= RATE_LIMIT) {
    console.warn(`Rate limit exceeded for: ${clientId}`)
    return false // Rate limited
  }

  // Add current timestamp
  recentTimestamps.push(now)
  rateLimitMap.set(clientId, recentTimestamps)

  // Cleanup old entries periodically
  if (Math.random() < 0.1) { // 10% chance to cleanup
    cleanupRateLimitMap()
  }

  return true
}

function cleanupRateLimitMap() {
  const now = Date.now()
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW)
    if (recent.length === 0) {
      rateLimitMap.delete(key)
    } else {
      rateLimitMap.set(key, recent)
    }
  }
}

// ============================================================================
// IP Allowlisting (Optional)
// ============================================================================

function isIPAllowed(clientIP: string | null): boolean {
  const allowedIPs = Deno.env.get('SMS_WEBHOOK_ALLOWED_IPS')

  // If no allowlist configured, allow all (backward compatible)
  if (!allowedIPs) {
    return true
  }

  // Parse comma-separated list of allowed IPs
  const allowedIPList = allowedIPs.split(',').map(ip => ip.trim())

  // Check if client IP is in allowlist
  if (!clientIP) {
    return false
  }

  // Support CIDR notation or exact IPs
  return allowedIPList.some(allowedIP => {
    if (allowedIP.includes('/')) {
      // CIDR notation (simplified check - for production use a proper CIDR library)
      const [network, prefix] = allowedIP.split('/')
      // For now, just check if IP starts with network (simplified)
      return clientIP.startsWith(network)
    } else {
      return clientIP === allowedIP
    }
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // ============================================================================
    // Step 1: Get client information for rate limiting and IP allowlisting
    // ============================================================================
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null
    const authHeader = req.headers.get('Authorization')

    // ============================================================================
    // Step 2: IP Allowlisting (if configured)
    // ============================================================================
    if (!isIPAllowed(clientIP)) {
      console.warn(`IP not allowed: ${clientIP}`)
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: IP not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================================================
    // Step 3: Rate Limiting
    // ============================================================================
    // Use IP or auth token as client identifier
    const clientId = authHeader ? `auth-${authHeader.substring(0, 20)}` : `ip-${clientIP || 'unknown'}`

    if (!checkRateLimit(clientId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many requests. Please slow down.',
          retryAfter: 60
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      )
    }

    // ============================================================================
    // Step 4: Continue with existing logic
    // ============================================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify authorization header exists
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { sms_id, sms_text, sender_phone, received_at, institution_id }: ParseRequest = await req.json()

    if (!sms_id || !sms_text || !sender_phone) {
      throw new Error('Missing required fields: sms_id, sms_text, sender_phone')
    }

    // For service role calls, use provided institution_id
    // For user calls, verify permission and get institution from profile
    let effective_institution_id = institution_id

    if (!authHeader.includes(serviceRoleKey)) {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      )

      if (userError || !user) {
        throw new Error('Unauthorized')
      }

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('institution_id, role')
        .eq('user_id', user.id)
        .single()

      effective_institution_id = institution_id || profile?.institution_id
    }

    if (!effective_institution_id) {
      throw new Error('Institution ID required')
    }

    // Get API keys
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash-exp'

    if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
      throw new Error('No AI API keys configured (OPENAI_API_KEY or GEMINI_API_KEY required)')
    }

    let parsed: ParsedSMS
    let aiProvider = 'unknown'
    let attemptNo = 2 // Assuming deterministic was attempt 1

    // Get current attempt count
    const { data: attempts } = await supabaseClient
      .from('sms_parse_attempts')
      .select('attempt_no')
      .eq('sms_id', sms_id)
      .order('attempt_no', { ascending: false })
      .limit(1)

    if (attempts && attempts.length > 0) {
      attemptNo = attempts[0].attempt_no + 1
    }

    // Try OpenAI first, fallback to Gemini
    if (OPENAI_API_KEY) {
      try {
        console.log(`[${sms_id}] Attempting parse with OpenAI...`)
        parsed = await parseWithOpenAI(sms_text, OPENAI_API_KEY)
        aiProvider = 'openai'
        console.log(`[${sms_id}] OpenAI parse successful`)
      } catch (openaiError) {
        console.error(`[${sms_id}] OpenAI failed:`, (openaiError as Error).message)

        // Log failed OpenAI attempt
        await supabaseClient.from('sms_parse_attempts').insert({
          sms_id,
          attempt_no: attemptNo,
          parser_type: 'openai',
          status: 'error',
          error_message: (openaiError as Error).message,
          duration_ms: Date.now() - startTime
        })
        attemptNo++

        // Fallback to Gemini
        if (GEMINI_API_KEY) {
          console.log(`[${sms_id}] Falling back to Gemini...`)
          parsed = await parseWithGemini(sms_text, GEMINI_API_KEY, GEMINI_MODEL)
          aiProvider = 'gemini'
          console.log(`[${sms_id}] Gemini parse successful`)
        } else {
          throw openaiError
        }
      }
    } else if (GEMINI_API_KEY) {
      console.log(`[${sms_id}] Using Gemini (no OpenAI key)...`)
      parsed = await parseWithGemini(sms_text, GEMINI_API_KEY, GEMINI_MODEL)
      aiProvider = 'gemini'
    } else {
      throw new Error('No AI API keys available')
    }

    const durationMs = Date.now() - startTime

    if (parsed.error) {
      // Update SMS with error
      await supabaseClient
        .from('momo_sms_raw')
        .update({
          parse_status: 'error',
          parse_error: parsed.error
        })
        .eq('id', sms_id)

      // Log failed attempt
      await supabaseClient.from('sms_parse_attempts').insert({
        sms_id,
        attempt_no: attemptNo,
        parser_type: aiProvider,
        status: 'error',
        error_message: parsed.error,
        confidence: parsed.confidence || 0,
        duration_ms: durationMs
      })

      return new Response(
        JSON.stringify({ success: false, error: parsed.error, ai_provider: aiProvider }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    if (!parsed.amount || parsed.amount <= 0) {
      const errorMsg = 'Invalid amount extracted from SMS'

      await supabaseClient
        .from('momo_sms_raw')
        .update({
          parse_status: 'error',
          parse_error: errorMsg
        })
        .eq('id', sms_id)

      await supabaseClient.from('sms_parse_attempts').insert({
        sms_id,
        attempt_no: attemptNo,
        parser_type: aiProvider,
        status: 'error',
        error_message: errorMsg,
        parsed_fields: parsed,
        duration_ms: durationMs
      })

      throw new Error(errorMsg)
    }

    // Get institution settings for dedupe window
    const { data: settings } = await supabaseClient
      .from('institution_settings')
      .select('dedupe_window_minutes')
      .eq('institution_id', effective_institution_id)
      .single()

    const dedupeWindow = settings?.dedupe_window_minutes || 60

    // Compute transaction fingerprint for dedupe
    const { data: fingerprint } = await supabaseClient.rpc('compute_txn_fingerprint', {
      p_amount: parsed.amount,
      p_payer_phone: sender_phone,
      p_occurred_at: parsed.occurred_at || received_at || new Date().toISOString(),
      p_momo_ref: parsed.momo_ref || '',
      p_dedupe_window_minutes: dedupeWindow
    })

    // Create transaction
    const { data: transaction, error: txnError } = await supabaseClient
      .from('transactions')
      .insert({
        institution_id: effective_institution_id,
        source_sms_id: sms_id,
        type: 'Deposit',
        amount: parsed.amount,
        currency: parsed.currency || 'RWF',
        channel: 'MoMo',
        status: 'COMPLETED',
        occurred_at: parsed.occurred_at || received_at || new Date().toISOString(),
        payer_phone: sender_phone,
        payer_name: parsed.payer_name || null,
        momo_ref: parsed.momo_ref || null,
        momo_tx_id: parsed.momo_tx_id || null,
        txn_fingerprint: parsed.momo_tx_id ? null : fingerprint,
        parse_confidence: parsed.confidence || 0.8,
        parse_version: `${aiProvider}-v1.0`,
        allocation_status: 'unallocated'
      })
      .select('id')
      .single()

    if (txnError) {
      // Check if it's a duplicate
      if (txnError.code === '23505') { // unique_violation
        // Update SMS status
        await supabaseClient
          .from('momo_sms_raw')
          .update({
            parse_status: 'success',
            parse_error: 'Duplicate transaction (ignored)'
          })
          .eq('id', sms_id)

        await supabaseClient.from('sms_parse_attempts').insert({
          sms_id,
          attempt_no: attemptNo,
          parser_type: aiProvider,
          status: 'success',
          error_message: 'Duplicate transaction',
          confidence: parsed.confidence,
          parsed_fields: parsed,
          duration_ms: durationMs
        })

        return new Response(
          JSON.stringify({
            success: true,
            duplicate: true,
            ai_provider: aiProvider,
            message: 'Duplicate transaction detected'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.error('Database error:', txnError)
      throw txnError
    }

    // Update SMS status to success
    await supabaseClient
      .from('momo_sms_raw')
      .update({
        parse_status: 'success',
        parse_error: null
      })
      .eq('id', sms_id)

    // Log successful attempt
    await supabaseClient.from('sms_parse_attempts').insert({
      sms_id,
      attempt_no: attemptNo,
      parser_type: aiProvider,
      status: 'success',
      confidence: parsed.confidence,
      parsed_fields: parsed,
      duration_ms: durationMs
    })

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transaction?.id,
        ai_provider: aiProvider,
        parsed_data: {
          amount: parsed.amount,
          currency: parsed.currency || 'RWF',
          momo_ref: parsed.momo_ref,
          momo_tx_id: parsed.momo_tx_id,
          payer_name: parsed.payer_name,
          confidence: parsed.confidence || 0.8
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Parse error:', error)

    // Log error with context standardized
    const { logError } = await import('../_shared/sentry.ts');
    logError(error, {
      functionName: 'parse-momo-sms',
      institutionId: effective_institution_id,
      requestId: req.headers.get('x-request-id') || undefined,
    });

    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
