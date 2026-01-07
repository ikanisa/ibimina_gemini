// ============================================================================
// Edge Function: parse-momo-sms
// Purpose: Parse MoMo SMS text and create transactions
// ============================================================================
// This function is called when a new SMS is received (via Android gateway or manual import)
// It uses AI (Gemini) to extract transaction details from SMS text
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { sms_id, sms_text, sender_phone, received_at, institution_id }: ParseRequest = await req.json()

    if (!sms_id || !sms_text || !sender_phone) {
      throw new Error('Missing required fields: sms_id, sms_text, sender_phone')
    }

    // Get user from token to determine institution if not provided
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user profile to determine institution
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('institution_id, role')
      .eq('user_id', user.id)
      .single()

    const effective_institution_id = institution_id || profile?.institution_id
    if (!effective_institution_id) {
      throw new Error('Institution ID required')
    }

    // Call Gemini to parse SMS
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash-exp'

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const prompt = `Extract transaction details from this Mobile Money SMS. Return ONLY a JSON object with these fields:
- amount: numeric amount (required)
- currency: currency code (default "RWF" if not specified)
- momo_ref: transaction reference number if present
- payer_name: name of payer if mentioned
- occurred_at: ISO 8601 timestamp if date/time mentioned, otherwise use null
- confidence: your confidence in the parse (0.0 to 1.0)

SMS Text: "${sms_text}"

Return ONLY valid JSON, no other text. Example:
{"amount": 5000, "currency": "RWF", "momo_ref": "ABC123", "payer_name": "John Doe", "occurred_at": "2025-01-07T10:30:00Z", "confidence": 0.95}

If you cannot extract valid data, return: {"error": "Unable to parse SMS"}`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

    // Parse JSON from Gemini response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (parsed.error) {
      // Update SMS with error
      await supabaseClient
        .from('momo_sms_raw')
        .update({
          parse_status: 'error',
          parse_error: parsed.error
        })
        .eq('id', sms_id)

      return new Response(
        JSON.stringify({ success: false, error: parsed.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    if (!parsed.amount || parsed.amount <= 0) {
      throw new Error('Invalid amount extracted from SMS')
    }

    // Call database function to create transaction
    // Note: parameter order matters - p_payer_phone must come before p_currency
    const { data: transaction_id, error: dbError } = await supabaseClient.rpc('parse_momo_sms', {
      p_sms_id: sms_id,
      p_institution_id: effective_institution_id,
      p_amount: parsed.amount,
      p_payer_phone: sender_phone,
      p_currency: parsed.currency || 'RWF',
      p_payer_name: parsed.payer_name || null,
      p_momo_ref: parsed.momo_ref || null,
      p_occurred_at: parsed.occurred_at || received_at || new Date().toISOString(),
      p_parse_confidence: parsed.confidence || 0.9
    })

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id,
        parsed_data: {
          amount: parsed.amount,
          currency: parsed.currency || 'RWF',
          momo_ref: parsed.momo_ref,
          payer_name: parsed.payer_name,
          confidence: parsed.confidence || 0.9
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Parse error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

