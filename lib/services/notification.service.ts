/**
 * Notification Service
 * Handles sending notifications via SMS and WhatsApp
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

export interface SendNotificationParams {
  institutionId: string;
  recipientType: 'MEMBER' | 'LEADER' | 'GROUP';
  recipientId: string;
  recipientPhone: string;
  templateType: string;
  variables: Record<string, string>;
  channel?: 'SMS' | 'WHATSAPP' | 'BOTH';
  documentUrl?: string; // For sending PDFs
  documentFilename?: string;
}

export interface NotificationResult {
  success: boolean;
  notificationLogId?: string;
  error?: string;
}

class NotificationService {
  /**
   * Get notification template
   */
  async getTemplate(
    institutionId: string,
    templateType: string,
    channel: 'SMS' | 'WHATSAPP' | 'BOTH' = 'BOTH',
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
  private replaceTemplateVariables(
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
   * Send notification via SMS
   */
  private async sendSMS(
    phone: string,
    message: string
  ): Promise<{ success: boolean; externalId?: string; error?: string }> {
    // SMS sending is handled via the SMS Gateway Android app which forwards MoMo messages.
    // Direct SMS sending from the web app is not implemented - use WhatsApp channel instead.
    // Integration with SMS providers (Twilio, AWS SNS) can be added if needed.
    return {
      success: false,
      error: 'SMS channel not available - use WhatsApp',
    };
  }

  /**
   * Send notification via WhatsApp
   */
  private async sendWhatsApp(
    phone: string,
    message: string,
    documentUrl?: string,
    documentFilename?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Load config from environment (in Edge Function) or Supabase
      const config = await whatsappService.loadConfigFromSupabase();
      await whatsappService.initialize(config);

      if (documentUrl && documentFilename) {
        // Send document
        const result = await whatsappService.sendDocument({
          to: phone,
          documentUrl,
          filename: documentFilename,
          caption: message,
        });
        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        };
      } else {
        // Send text message
        const result = await whatsappService.sendMessage({
          to: phone,
          message,
        });
        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Log notification to database
   */
  private async logNotification(
    params: SendNotificationParams,
    channel: 'SMS' | 'WHATSAPP',
    message: string,
    status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED',
    externalId?: string,
    errorMessage?: string
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('notification_logs')
      .insert({
        institution_id: params.institutionId,
        recipient_type: params.recipientType,
        recipient_id: params.recipientId,
        recipient_phone: params.recipientPhone,
        channel,
        template_type: params.templateType,
        message_body: message,
        status,
        external_id: externalId,
        error_message: errorMessage,
        sent_at: status === 'SENT' ? new Date().toISOString() : null,
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
   * Send notification
   */
  async sendNotification(params: SendNotificationParams): Promise<NotificationResult> {
    try {
      // Get template
      const template = await this.getTemplate(
        params.institutionId,
        params.templateType,
        params.channel || 'BOTH'
      );

      if (!template) {
        return {
          success: false,
          error: `Template not found: ${params.templateType}`,
        };
      }

      // Replace variables in template
      const message = this.replaceTemplateVariables(template.body, params.variables);
      const subject = template.subject
        ? this.replaceTemplateVariables(template.subject, params.variables)
        : undefined;

      const channels: ('SMS' | 'WHATSAPP')[] = [];
      if (template.channel === 'BOTH' || template.channel === 'SMS') {
        channels.push('SMS');
      }
      if (template.channel === 'BOTH' || template.channel === 'WHATSAPP') {
        channels.push('WHATSAPP');
      }

      // If specific channel requested, filter
      if (params.channel && params.channel !== 'BOTH') {
        const filtered = channels.filter(c => c === params.channel);
        if (filtered.length > 0) {
          channels.splice(0, channels.length, ...filtered);
        }
      }

      let lastError: string | undefined;
      let lastLogId: string | undefined;
      let successCount = 0;

      // Send via each channel
      for (const channel of channels) {
        try {
          let result: { success: boolean; externalId?: string; messageId?: string; error?: string };

          if (channel === 'WHATSAPP') {
            result = await this.sendWhatsApp(
              params.recipientPhone,
              message,
              params.documentUrl,
              params.documentFilename
            );
          } else {
            result = await this.sendSMS(params.recipientPhone, message);
          }

          const logId = await this.logNotification(
            params,
            channel,
            message,
            result.success ? 'SENT' : 'FAILED',
            result.externalId || result.messageId,
            result.error
          );

          if (result.success) {
            successCount++;
            if (!lastLogId) lastLogId = logId || undefined;
          } else {
            lastError = result.error;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          await this.logNotification(
            params,
            channel,
            message,
            'FAILED',
            undefined,
            errorMsg
          );
          lastError = errorMsg;
        }
      }

      return {
        success: successCount > 0,
        notificationLogId: lastLogId,
        error: successCount === 0 ? lastError : undefined,
      };
    } catch (error) {
      console.error('Notification send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send contribution reminder to a member
   */
  async sendContributionReminder(
    institutionId: string,
    memberId: string,
    memberName: string,
    memberPhone: string,
    groupName: string,
    expectedAmount: number,
    currency: string,
    dueDate: string,
    channel?: 'SMS' | 'WHATSAPP' | 'BOTH'
  ): Promise<NotificationResult> {
    return this.sendNotification({
      institutionId,
      recipientType: 'MEMBER',
      recipientId: memberId,
      recipientPhone: memberPhone,
      templateType: 'CONTRIBUTION_REMINDER',
      variables: {
        member_name: memberName,
        expected_amount: expectedAmount.toString(),
        currency,
        group_name: groupName,
        due_date: dueDate,
      },
      channel,
    });
  }

  /**
   * Send periodic total to a member
   */
  async sendPeriodicTotal(
    institutionId: string,
    memberId: string,
    memberName: string,
    memberPhone: string,
    groupName: string,
    period: string,
    periodTotal: number,
    overallTotal: number,
    currency: string,
    channel?: 'SMS' | 'WHATSAPP' | 'BOTH'
  ): Promise<NotificationResult> {
    return this.sendNotification({
      institutionId,
      recipientType: 'MEMBER',
      recipientId: memberId,
      recipientPhone: memberPhone,
      templateType: 'PERIODIC_TOTAL',
      variables: {
        member_name: memberName,
        period,
        period_total: periodTotal.toString(),
        overall_total: overallTotal.toString(),
        currency,
        group_name: groupName,
      },
      channel,
    });
  }

  /**
   * Send contribution confirmation to member
   */
  async sendContributionConfirmation(
    institutionId: string,
    memberId: string,
    memberName: string,
    memberPhone: string,
    groupName: string,
    contributionAmount: number,
    overallTotal: number,
    currency: string,
    arrears?: number,
    arrearsMessage?: string
  ): Promise<NotificationResult> {
    let arrearsMsg = '';
    if (arrears && arrears > 0) {
      arrearsMsg = arrearsMessage || ` You have outstanding arrears of ${arrears} ${currency}.`;
    }

    return this.sendNotification({
      institutionId,
      recipientType: 'MEMBER',
      recipientId: memberId,
      recipientPhone: memberPhone,
      templateType: 'CONTRIBUTION_CONFIRMATION',
      variables: {
        member_name: memberName,
        contribution_amount: contributionAmount.toString(),
        currency,
        group_name: groupName,
        overall_total: overallTotal.toString(),
        arrears_message: arrearsMsg,
      },
      channel: 'BOTH', // Send via both WhatsApp and SMS
    });
  }

  /**
   * Send group report to leaders
   */
  async sendGroupReport(
    institutionId: string,
    groupId: string,
    leaderId: string,
    leaderName: string,
    leaderPhone: string,
    groupName: string,
    reportType: 'WEEKLY' | 'MONTHLY' | 'OVERALL',
    periodStart: string,
    periodEnd: string,
    totalContributions: number,
    currency: string,
    memberCount: number,
    pdfUrl: string,
    pdfFilename: string
  ): Promise<NotificationResult> {
    return this.sendNotification({
      institutionId,
      recipientType: 'LEADER',
      recipientId: leaderId,
      recipientPhone: leaderPhone,
      templateType: 'GROUP_REPORT',
      variables: {
        leader_name: leaderName,
        report_type: reportType,
        group_name: groupName,
        period_start: periodStart,
        period_end: periodEnd,
        total_contributions: totalContributions.toString(),
        currency,
        member_count: memberCount.toString(),
      },
      channel: 'WHATSAPP',
      documentUrl: pdfUrl,
      documentFilename: pdfFilename,
    });
  }
}

export const notificationService = new NotificationService();
