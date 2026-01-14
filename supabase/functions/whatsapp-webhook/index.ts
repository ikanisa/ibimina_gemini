/**
 * Supabase Edge Function: WhatsApp Webhook
 * Handles inbound webhooks from Meta WhatsApp Business API
 * 
 * Authentication: HMAC-SHA256 signature verification
 * Observability: Request ID tracing + inbound message logging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { generateRequestId, createLogger } from '../_shared/request-context.ts';
import type { WhatsAppWebhookPayload, WhatsAppInboundMessage, WhatsAppMessageStatus } from '../_shared/types.ts';

const functionName = 'whatsapp-webhook';

/**
 * Verify Meta webhook signature (HMAC-SHA256)
 */
async function verifyWebhookSignature(
    body: string,
    signature: string | null,
    secret: string
): Promise<boolean> {
    if (!signature || !signature.startsWith('sha256=')) {
        return false;
    }

    const signatureHash = signature.replace('sha256=', '');

    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signatureBuffer = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(body)
        );

        const hashArray = Array.from(new Uint8Array(signatureBuffer));
        const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return computedHash === signatureHash;
    } catch {
        return false;
    }
}

Deno.serve(async (req) => {
    const requestId = generateRequestId();
    const logger = createLogger(requestId, functionName);

    // =========================================================================
    // Handle webhook verification (GET request from Meta)
    // =========================================================================
    if (req.method === 'GET') {
        const url = new URL(req.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        const verifyToken = Deno.env.get('WA_WEBHOOK_VERIFY_TOKEN') || Deno.env.get('WHATSAPP_VERIFY_TOKEN');

        if (mode === 'subscribe' && token === verifyToken) {
            logger.info('Webhook verification successful');
            return new Response(challenge, { status: 200 });
        }

        logger.warn('Webhook verification failed', { mode, tokenMatch: token === verifyToken });
        return new Response('Forbidden', { status: 403 });
    }

    // =========================================================================
    // Handle CORS preflight
    // =========================================================================
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // =========================================================================
    // Handle webhook POST
    // =========================================================================
    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405, { 'X-Request-Id': requestId });
    }

    try {
        const bodyText = await req.text();

        // =========================================================================
        // Verify webhook signature
        // =========================================================================
        const appSecret = Deno.env.get('WA_APP_SECRET') || Deno.env.get('WHATSAPP_APP_SECRET');
        const signature = req.headers.get('x-hub-signature-256');

        if (appSecret) {
            const isValid = await verifyWebhookSignature(bodyText, signature, appSecret);
            if (!isValid) {
                logger.warn('Invalid webhook signature');
                return errorResponse('Invalid signature', 401, { 'X-Request-Id': requestId });
            }
        } else {
            logger.warn('WA_APP_SECRET not configured - skipping signature verification');
        }

        // =========================================================================
        // Parse webhook payload
        // =========================================================================
        let payload: WhatsAppWebhookPayload;
        try {
            payload = JSON.parse(bodyText);
        } catch {
            logger.error('Invalid JSON payload');
            return errorResponse('Invalid JSON', 400, { 'X-Request-Id': requestId });
        }

        if (payload.object !== 'whatsapp_business_account') {
            logger.info('Ignoring non-WhatsApp webhook', { object: payload.object });
            return jsonResponse({ success: true, message: 'Ignored' }, 200, { 'X-Request-Id': requestId });
        }

        // =========================================================================
        // Initialize Supabase
        // =========================================================================
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            logger.error('Missing Supabase configuration');
            return errorResponse('Server configuration error', 500, { 'X-Request-Id': requestId });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        // =========================================================================
        // Process webhook entries
        // =========================================================================
        for (const entry of payload.entry) {
            for (const change of entry.changes) {
                const value = change.value;

                // Process inbound messages
                if (value.messages) {
                    for (const message of value.messages) {
                        await processInboundMessage(supabase, message, value.metadata.phone_number_id, requestId, logger);
                    }
                }

                // Process message status updates
                if (value.statuses) {
                    for (const status of value.statuses) {
                        await processStatusUpdate(supabase, status, requestId, logger);
                    }
                }
            }
        }

        logger.info('Webhook processed successfully');
        return jsonResponse({ success: true }, 200, { 'X-Request-Id': requestId });

    } catch (error) {
        logger.error('Webhook processing error', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Unknown error',
            500,
            { 'X-Request-Id': requestId }
        );
    }
});

/**
 * Process an inbound WhatsApp message
 */
async function processInboundMessage(
    supabase: ReturnType<typeof createClient>,
    message: WhatsAppInboundMessage,
    phoneNumberId: string,
    requestId: string,
    logger: ReturnType<typeof createLogger>
) {
    logger.info('Processing inbound message', { messageId: message.id, from: message.from, type: message.type });

    // Extract content based on message type
    let content: string | null = null;
    if (message.type === 'text' && message.text) {
        content = message.text.body;
    } else if (message.type === 'button' && message.button) {
        content = message.button.text;
    } else if (message.type === 'interactive' && message.interactive) {
        content = message.interactive.button_reply?.title || message.interactive.list_reply?.title || null;
    }

    // Try to find matching institution by phone number ID
    let institutionId: string | null = null;
    const { data: settings } = await supabase
        .from('institution_settings')
        .select('institution_id')
        .or(`whatsapp_phone_id.eq.${phoneNumberId},whatsapp_phone_number_id.eq.${phoneNumberId}`)
        .limit(1)
        .maybeSingle();

    if (settings) {
        institutionId = settings.institution_id;
    }

    // Log inbound message
    const { error } = await supabase.from('whatsapp_inbound_log').insert({
        institution_id: institutionId,
        from_phone: message.from,
        message_id: message.id,
        message_type: message.type,
        content,
        raw_payload: message as unknown as Record<string, unknown>,
        processed: false,
        webhook_received_at: new Date().toISOString(),
    });

    if (error) {
        logger.error('Failed to log inbound message', error);
    }

    // Audit log
    if (institutionId) {
        await supabase.from('audit_log').insert({
            institution_id: institutionId,
            action: 'receive_whatsapp',
            entity_type: 'whatsapp_message',
            entity_id: message.id,
            request_id: requestId,
            metadata: {
                from: message.from,
                type: message.type,
                has_content: !!content,
            },
        });
    }
}

/**
 * Process a message status update
 */
async function processStatusUpdate(
    supabase: ReturnType<typeof createClient>,
    status: WhatsAppMessageStatus,
    requestId: string,
    logger: ReturnType<typeof createLogger>
) {
    logger.info('Processing status update', { messageId: status.id, status: status.status });

    // Update whatsapp_message_log with new status
    const { error } = await supabase
        .from('whatsapp_message_log')
        .update({
            status: status.status,
            error_message: status.errors?.[0]?.message || null,
            updated_at: new Date().toISOString(),
        })
        .eq('message_id', status.id);

    if (error) {
        logger.warn('Failed to update message status', { messageId: status.id, error: error.message });
    }
}
