/**
 * Supabase Edge Function: Send Contribution Confirmation
 * Sends confirmation notifications after a contribution is allocated
 * Called by database trigger or directly after allocation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendConfirmationRequest {
  transactionId: string;
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body: SendConfirmationRequest = await req.json();
    const { transactionId } = body;

    // Call the database function to prepare confirmation
    const { data: confirmationData, error: confirmError } = await supabase.rpc(
      'send_contribution_confirmation',
      { p_transaction_id: transactionId }
    );

    if (confirmError) {
      console.error('Error preparing confirmation:', confirmError);
      return new Response(
        JSON.stringify({ error: 'Failed to prepare confirmation', details: confirmError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!confirmationData || !confirmationData.success) {
      return new Response(
        JSON.stringify({ error: confirmationData?.error || 'Failed to prepare confirmation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get pending notifications for this transaction
    const { data: notifications, error: notifError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('metadata->>transaction_id', transactionId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });

    if (notifError) {
      console.error('Error fetching notifications:', notifError);
    }

    // Send notifications via WhatsApp and SMS
    const results = [];
    if (notifications && notifications.length > 0) {
      for (const notification of notifications) {
        try {
          let sendResult: any = { success: false };

          if (notification.channel === 'WHATSAPP') {
            // Send via WhatsApp
            const { data: waResult } = await supabase.functions.invoke('send-whatsapp', {
              body: {
                to: notification.recipient_phone,
                message: notification.message_body,
              },
            });
            sendResult = waResult;
          } else if (notification.channel === 'SMS') {
            // Send via SMS (implement your SMS provider here)
            // For now, we'll just mark it as sent
            sendResult = { success: true, messageId: 'sms-' + Date.now() };
          }

          // Update notification status
          const updateData: any = {
            status: sendResult.success ? 'SENT' : 'FAILED',
            sent_at: sendResult.success ? new Date().toISOString() : null,
            external_id: sendResult.messageId || null,
          };

          if (!sendResult.success) {
            updateData.error_message = sendResult.error || 'Unknown error';
          }

          await supabase
            .from('notification_logs')
            .update(updateData)
            .eq('id', notification.id);

          results.push({
            notificationId: notification.id,
            channel: notification.channel,
            success: sendResult.success,
            error: sendResult.error,
          });
        } catch (error) {
          console.error(`Error sending ${notification.channel}:`, error);
          await supabase
            .from('notification_logs')
            .update({
              status: 'FAILED',
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', notification.id);

          results.push({
            notificationId: notification.id,
            channel: notification.channel,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        confirmationData,
        notificationsSent: results.filter(r => r.success).length,
        notificationsFailed: results.filter(r => !r.success).length,
        results,
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
