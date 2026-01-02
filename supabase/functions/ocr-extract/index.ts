// Supabase Edge Function for Gemini OCR extraction
// Uses server-side GEMINI_API_KEY for security

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OcrRequest {
    image: string; // base64 encoded image
    extractType: 'members' | 'groups';
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash-exp'

        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured')
        }

        const { image, extractType }: OcrRequest = await req.json()

        if (!image || !extractType) {
            throw new Error('Missing required fields: image, extractType')
        }

        // Build prompt based on extraction type
        let prompt = ''
        if (extractType === 'members') {
            prompt = `Extract member information from this document. Return a JSON array of objects with these fields:
- full_name: the person's full name
- phone: phone number (format as +250XXXXXXXXX if Rwandan)
- group_name: the group/ibimina name if mentioned

Return ONLY valid JSON array, no other text. Example:
[{"full_name": "Jean Pierre", "phone": "+250788123456", "group_name": "Ibimina ya Gasabo"}]

If you cannot extract valid data, return an empty array: []`
        } else if (extractType === 'groups') {
            prompt = `Extract savings group (Ibimina) information from this document. Return a JSON array of objects with these fields:
- group_name: the group/ibimina name (required)
- meeting_day: day of week (Monday, Tuesday, etc.) if mentioned
- frequency: contribution frequency - must be one of: "Daily", "Weekly", "Monthly"
- expected_amount: the contribution amount if mentioned (number only, no currency)

Return ONLY valid JSON array, no other text. Example:
[{"group_name": "Ibimina ya Gasabo", "meeting_day": "Monday", "frequency": "Weekly", "expected_amount": 5000}]

If you cannot extract valid data, return an empty array: []`
        } else {
            throw new Error('Invalid extractType. Must be "members" or "groups"')
        }

        // Determine mime type from base64
        let mimeType = 'image/png'
        if (image.startsWith('data:')) {
            const match = image.match(/data:([^;]+);/)
            if (match) mimeType = match[1]
        }

        // Extract base64 data
        const base64Data = image.includes(',') ? image.split(',')[1] : image

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Data
                                }
                            },
                            { text: prompt }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 4096
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
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

        // Parse the JSON from Gemini response
        const jsonMatch = textContent.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
            return new Response(
                JSON.stringify({ data: [], message: 'No data extracted' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const extractedData = JSON.parse(jsonMatch[0])

        return new Response(
            JSON.stringify({ data: extractedData, success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('OCR extraction error:', error)
        return new Response(
            JSON.stringify({ error: error.message, data: [] }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
