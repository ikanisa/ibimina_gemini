/**
 * Supabase Edge Function: Send WhatsApp Message
 * Sends a WhatsApp message using Meta WhatsApp Business API
 * 
 * RBAC: Requires STAFF+ role
 * Observability: Request ID tracing + audit logging
 * Idempotency: Dedup by idempotency key
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse, corsHeaders } from '../_shared/cors.ts';
import { requireStaff } from '../_shared/rbac.ts';
import type { WhatsAppMessage, WhatsAppSendResult, AuditLogEntry } from '../_shared/types.ts';

interface SendWhatsAppRequest extends WhatsAppMessage {
  idempotencyKey?: string; // Optional dedup key
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const functionName = 'send-whatsapp';

  try {
    // =========================================================================
    // RBAC: Require authenticated STAFF+ role
    // =========================================================================
    const rbacResult = await requireStaff(req, functionName);

    if (!rbacResult.success) {
      return rbacResult.error!;
    }

    const { user, logger, requestId } = rbacResult;
    logger!.info('Processing WhatsApp send request', { userId: user!.userId });

    // =========================================================================
    // Parse and validate request body
    // =========================================================================
    let body: SendWhatsAppRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400, { 'X-Request-Id': requestId! });
    }

    const { to, message, documentUrl, documentFilename, caption, idempotencyKey } = body;

    if (!to) {
      return errorResponse('Missing required field: to', 400, { 'X-Request-Id': requestId! });
    }

    if (!message && !documentUrl) {
      return errorResponse('Missing required field: message or documentUrl', 400, { 'X-Request-Id': requestId! });
    }

    // =========================================================================
    // Initialize Supabase client
    // =========================================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      logger!.error('Missing Supabase configuration');
      return errorResponse('Server configuration error', 500, { 'X-Request-Id': requestId! });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // =========================================================================
    // Idempotency check
    // =========================================================================
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('whatsapp_message_log')
        .select('id, message_id, status')
        .eq('idempotency_key', idempotencyKey)
        .eq('institution_id', user!.institutionId)
        .single();

      if (existing) {
        logger!.info('Duplicate request detected', { idempotencyKey, existingId: existing.id });
        return jsonResponse({
          success: true,
          messageId: existing.message_id,
          duplicate: true,
          status: existing.status,
        }, 200, { 'X-Request-Id': requestId! });
      }
    }

    // =========================================================================
    // Get WhatsApp credentials
    // =========================================================================
    const phoneId = Deno.env.get('WA_PHONE_ID') || Deno.env.get('WHATSAPP_PHONE_ID');
    const accessToken = Deno.env.get('WA_TOKEN') || Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneId || !accessToken) {
      logger!.error('WhatsApp credentials not configured');
      return errorResponse('WhatsApp credentials not configured', 500, { 'X-Request-Id': requestId! });
    }

    // =========================================================================
    // Format phone number (ensure international format)
    // =========================================================================
    let phoneNumber = to.replace(/\D/g, '');
    if (!phoneNumber.startsWith('250')) {
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '250' + phoneNumber.substring(1);
      } else if (phoneNumber.length === 9) {
        phoneNumber = '250' + phoneNumber;
      }
    }
    phoneNumber = '+' + phoneNumber;

    // =========================================================================
    // Build WhatsApp API payload
    // =========================================================================
    const baseUrl = 'https://graph.facebook.com/v21.0';
    const url = `${baseUrl}/${phoneId}/messages`;

    let payload: Record<string, unknown>;

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

    // =========================================================================
    // Log outbound message (pending status)
    // =========================================================================
    const { data: logEntry, error: logError } = await supabase
      .from('whatsapp_message_log')
      .insert({
        institution_id: user!.institutionId,
        direction: 'outbound',
        phone_number: phoneNumber,
        message_type: documentUrl ? 'document' : 'text',
        content: message || caption || null,
        status: 'pending',
        idempotency_key: idempotencyKey || null,
        request_id: requestId,
        metadata: {
          document_url: documentUrl || null,
          document_filename: documentFilename || null,
          sent_by: user!.userId,
        },
      })
      .select('id')
      .single();

    if (logError) {
      logger!.warn('Failed to create message log', { error: logError.message });
      // Continue anyway - don't block sending
    }

    // =========================================================================
    // Send WhatsApp message
    // =========================================================================
    logger!.info('Sending WhatsApp message', { to: phoneNumber, type: payload.type });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // =========================================================================
    // Update message log with result
    // =========================================================================
    const messageId = data.messages?.[0]?.id;
    const waStatus = response.ok ? 'sent' : 'failed';

    if (logEntry?.id) {
      await supabase
        .from('whatsapp_message_log')
        .update({
          message_id: messageId || null,
          status: waStatus,
          error_message: response.ok ? null : (data.error?.message || 'Unknown error'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', logEntry.id);
    }

    // =========================================================================
    // Audit log
    // =========================================================================
    const auditEntry: AuditLogEntry = {
      actor_user_id: user!.userId,
      institution_id: user!.institutionId,
      action: 'send_whatsapp',
      entity_type: 'whatsapp_message',
      entity_id: messageId || logEntry?.id || null,
      request_id: requestId,
      metadata: {
        to: phoneNumber,
        message_type: payload.type,
        success: response.ok,
        wa_message_id: messageId,
      },
    };

    await supabase.from('audit_log').insert(auditEntry);

    // =========================================================================
    // Response
    // =========================================================================
    if (!response.ok) {
      logger!.error('WhatsApp API error', { error: data.error });
      return jsonResponse<WhatsAppSendResult>({
        success: false,
        error: data.error?.message || 'Failed to send WhatsApp message',
      }, response.status, { 'X-Request-Id': requestId! });
    }

    logger!.info('WhatsApp message sent successfully', { messageId });

    return jsonResponse<WhatsAppSendResult>({
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
    }, 200, { 'X-Request-Id': requestId! });

  } catch (error) {
    console.error('Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
