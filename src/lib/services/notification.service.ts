/**
 * Notification Service
 * Handles sending manual WhatsApp messages triggered by staff
 * 
 * NOTE: Automated SMS/WhatsApp notifications have been removed.
 * All messages are now triggered manually by staff.
 */

import { supabase } from '../supabase';
import { whatsappService } from './whatsapp.service';

export interface NotificationTemplate {
  id: string;
  template_type: string;
  channel: 'SMS' | 'WHATSAPP' | 'BOTH';
  language: string;
  subject?: string;
  body: string;
  variables: Record<string, string>;
}

export interface SendWhatsAppMessageParams {
  institutionId: string;
  recipientType: 'MEMBER' | 'LEADER' | 'GROUP';
  recipientId: string;
  recipientPhone: string;
  messageType: string;
  message: string;
  documentUrl?: string;
  documentFilename?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  notificationLogId?: string;
  messageId?: string;
  error?: string;
}

class NotificationService {
  /**
   * Get notification template
   */
  async getTemplate(
    institutionId: string,
    templateType: string,
    channel: 'SMS' | 'WHATSAPP' | 'BOTH' = 'WHATSAPP',
    language: string = 'en'
  ): Promise<NotificationTemplate | null> {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('template_type', templateType)
      .eq('is_active', true)
      .or(`channel.eq.${channel},channel.eq.BOTH`)
      .eq('language', language)
      .single();

    if (error || !data) {
      console.error('Template not found:', error);
      return null;
    }

    return {
      id: data.id,
      template_type: data.template_type,
      channel: data.channel as 'SMS' | 'WHATSAPP' | 'BOTH',
      language: data.language,
      subject: data.subject,
      body: data.body,
      variables: data.variables || {},
    };
  }

  /**
   * Replace template variables with actual values
   */
  replaceTemplateVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  /**
   * Send WhatsApp message directly (manual trigger by staff)
   */
  async sendWhatsAppMessage(
    params: SendWhatsAppMessageParams
  ): Promise<NotificationResult> {
    try {
      // Load WhatsApp config
      const config = await whatsappService.loadConfigFromSupabase();
      await whatsappService.initialize(config);

      let result: { success: boolean; messageId?: string; error?: string };

      if (params.documentUrl && params.documentFilename) {
        // Send document with message
        result = await whatsappService.sendDocument({
          to: params.recipientPhone,
          documentUrl: params.documentUrl,
          filename: params.documentFilename,
          caption: params.message,
        });
      } else {
        // Send text message
        result = await whatsappService.sendMessage({
          to: params.recipientPhone,
          message: params.message,
        });
      }

      // Log the notification
      const logId = await this.logNotification(params, result);

      return {
        success: result.success,
        notificationLogId: logId || undefined,
        messageId: result.messageId,
        error: result.error,
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      // Log failed attempt
      await this.logNotification(params, { success: false, error: errorMsg });

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Log notification to database for audit trail
   */
  private async logNotification(
    params: SendWhatsAppMessageParams,
    result: { success: boolean; messageId?: string; error?: string }
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('notification_logs')
      .insert({
        institution_id: params.institutionId,
        recipient_type: params.recipientType,
        recipient_id: params.recipientId,
        recipient_phone: params.recipientPhone,
        channel: 'WHATSAPP',
        template_type: params.messageType,
        message_body: params.message,
        status: result.success ? 'SENT' : 'FAILED',
        external_id: result.messageId,
        error_message: result.error,
        sent_at: result.success ? new Date().toISOString() : null,
        metadata: params.metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log notification:', error);
      return null;
    }

    return data.id;
  }

  /**
   * Send via Edge Function (for server-side sending)
   */
  async sendViaEdgeFunction(
    params: SendWhatsAppMessageParams
  ): Promise<NotificationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          to: params.recipientPhone,
          message: params.message,
          documentUrl: params.documentUrl,
          documentFilename: params.documentFilename,
          idempotencyKey: `${params.recipientId}-${Date.now()}`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Log the notification
      const logId = await this.logNotification(params, {
        success: data?.success ?? false,
        messageId: data?.messageId,
        error: data?.error,
      });

      return {
        success: data?.success ?? false,
        notificationLogId: logId || undefined,
        messageId: data?.messageId,
        error: data?.error,
      };
    } catch (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const notificationService = new NotificationService();
