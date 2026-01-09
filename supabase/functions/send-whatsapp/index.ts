/**
 * Supabase Edge Function: Send WhatsApp Message
 * Sends a WhatsApp message using Meta WhatsApp Business API
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendWhatsAppRequest {
  to: string;
  message: string;
  documentUrl?: string;
  documentFilename?: string;
  caption?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: SendWhatsAppRequest = await req.json();
    const { to, message, documentUrl, documentFilename, caption } = body;

    // Get WhatsApp credentials from environment
    const phoneId = Deno.env.get('WA_PHONE_ID') || Deno.env.get('WHATSAPP_PHONE_ID');
    const accessToken = Deno.env.get('WA_TOKEN') || Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneId || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (ensure international format)
    let phoneNumber = to.replace(/\D/g, '');
    if (!phoneNumber.startsWith('250')) {
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '250' + phoneNumber.substring(1);
      } else if (phoneNumber.length === 9) {
        phoneNumber = '250' + phoneNumber;
      }
    }
    phoneNumber = '+' + phoneNumber;

    const baseUrl = 'https://graph.facebook.com/v21.0';
    const url = `${baseUrl}/${phoneId}/messages`;

    let payload: any;

    if (documentUrl && documentFilename) {
      // Send document
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'document',
        document: {
          link: documentUrl,
          filename: documentFilename,
          caption: caption || message || '',
        },
      };
    } else {
      // Send text message
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API Error:', data);
      return new Response(
        JSON.stringify({
          success: false,
          error: data.error?.message || 'Failed to send WhatsApp message',
          details: data.error,
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: data.messages?.[0]?.id,
        data,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
