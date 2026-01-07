// ============================================================================
// Edge Function: parse-momo-sms
// Purpose: Parse MoMo SMS text and create transactions
// AI: OpenAI (primary) → Gemini (fallback)
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

interface ParsedSMS {
  amount: number
  currency?: string
  momo_ref?: string
  payer_name?: string
  occurred_at?: string
  confidence: number
  error?: string
}

const SMS_PARSE_PROMPT = `Extract transaction details from this Mobile Money SMS. Return ONLY a JSON object with these fields:
- amount: numeric amount (required)
- currency: currency code (default "RWF" if not specified)
- momo_ref: transaction reference number if present
- payer_name: name of payer if mentioned
- occurred_at: ISO 8601 timestamp if date/time mentioned, otherwise use null
- confidence: your confidence in the parse (0.0 to 1.0)

SMS Text: "{SMS_TEXT}"

Return ONLY valid JSON, no other text. Example:
{"amount": 5000, "currency": "RWF", "momo_ref": "ABC123", "payer_name": "John Doe", "occurred_at": "2025-01-07T10:30:00Z", "confidence": 0.95}

If you cannot extract valid data, return: {"error": "Unable to parse SMS"}`

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
        { role: 'system', content: 'You are a precise data extraction assistant. Extract transaction details from Mobile Money SMS messages.' },
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

    // Get API keys
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash-exp'

    if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
      throw new Error('No AI API keys configured (OPENAI_API_KEY or GEMINI_API_KEY required)')
    }

    let parsed: ParsedSMS
    let aiProvider = 'unknown'

    // Try OpenAI first, fallback to Gemini
    if (OPENAI_API_KEY) {
      try {
        console.log('Attempting parse with OpenAI...')
        parsed = await parseWithOpenAI(sms_text, OPENAI_API_KEY)
        aiProvider = 'openai'
        console.log('OpenAI parse successful')
      } catch (openaiError) {
        console.error('OpenAI failed:', openaiError.message)
        
        // Fallback to Gemini
        if (GEMINI_API_KEY) {
          console.log('Falling back to Gemini...')
          parsed = await parseWithGemini(sms_text, GEMINI_API_KEY, GEMINI_MODEL)
          aiProvider = 'gemini'
          console.log('Gemini parse successful')
        } else {
          throw openaiError
        }
      }
    } else if (GEMINI_API_KEY) {
      // Only Gemini available
      console.log('Using Gemini (no OpenAI key)...')
      parsed = await parseWithGemini(sms_text, GEMINI_API_KEY, GEMINI_MODEL)
      aiProvider = 'gemini'
    } else {
      throw new Error('No AI API keys available')
    }

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
        JSON.stringify({ success: false, error: parsed.error, ai_provider: aiProvider }),
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
        ai_provider: aiProvider,
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
