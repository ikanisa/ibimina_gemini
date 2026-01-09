/**
 * Supabase Edge Function: Process Pending Notifications
 * Background job to process pending notifications from notification_logs
 * Should be called periodically (e.g., every minute via cron)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify request (should be from cron job with secret)
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret !== expectedSecret && expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending notifications (limit to avoid timeout)
    const { data: notifications, error: fetchError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })
      .limit(50); // Process 50 at a time

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending notifications' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Process each notification
    for (const notification of notifications) {
      try {
        let sendResult: any = { success: false };

        if (notification.channel === 'WHATSAPP') {
          // Send via WhatsApp
          const { data: waResult, error: waError } = await supabase.functions.invoke('send-whatsapp', {
            body: {
              to: notification.recipient_phone,
              message: notification.message_body,
              documentUrl: notification.metadata?.document_url,
              documentFilename: notification.metadata?.document_filename,
            },
          });

          if (waError) {
            sendResult = { success: false, error: waError.message };
          } else {
            sendResult = waResult || { success: false, error: 'No response from WhatsApp function' };
          }
        } else if (notification.channel === 'SMS') {
          // Send via SMS (implement your SMS provider here)
          // For now, we'll use a placeholder
          // TODO: Integrate with your SMS provider (Twilio, AWS SNS, etc.)
          sendResult = { success: true, messageId: 'sms-' + Date.now() };
        }

        // Update notification status
        const updateData: any = {
          status: sendResult.success ? 'SENT' : 'FAILED',
          sent_at: sendResult.success ? new Date().toISOString() : null,
          external_id: sendResult.messageId || sendResult.message_id || null,
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
        console.error(`Error processing notification ${notification.id}:`, error);
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

    return new Response(
      JSON.stringify({
        success: true,
        processed: notifications.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
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
