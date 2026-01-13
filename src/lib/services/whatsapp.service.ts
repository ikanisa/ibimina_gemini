/**
 * WhatsApp Business API Service
 * Handles sending messages via Meta WhatsApp Business API
 */

export interface WhatsAppConfig {
  phoneId: string;
  businessId: string;
  accessToken: string;
  verifyToken?: string;
  appSecret?: string;
}

export interface SendMessageParams {
  to: string; // Phone number in international format (e.g., +250788123456)
  message: string;
  templateName?: string;
  templateParams?: Record<string, string>;
}

export interface SendDocumentParams {
  to: string;
  documentUrl: string;
  filename: string;
  caption?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private config: WhatsAppConfig | null = null;
  private baseUrl = 'https://graph.facebook.com/v21.0';

  /**
   * Initialize WhatsApp service with configuration
   */
  async initialize(config: WhatsAppConfig): Promise<void> {
    this.config = config;
  }

  /**
   * Get configuration from Supabase secrets
   */
  async loadConfigFromSupabase(): Promise<WhatsAppConfig> {
    // This will be called from a Supabase Edge Function or server-side
    // For now, return a placeholder - actual implementation will fetch from Supabase secrets
    const phoneId = Deno.env.get('WA_PHONE_ID') || '';
    const businessId = Deno.env.get('META_WABA_BUSINESS_ID') || '';
    const accessToken = Deno.env.get('WA_TOKEN') || Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
    const verifyToken = Deno.env.get('WA_VERIFY_TOKEN') || '';
    const appSecret = Deno.env.get('WA_APP_SECRET') || '';

    if (!phoneId || !businessId || !accessToken) {
      throw new Error('WhatsApp configuration is incomplete. Missing required credentials.');
    }

    return {
      phoneId,
      businessId,
      accessToken,
      verifyToken,
      appSecret,
    };
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendMessage(params: SendMessageParams): Promise<WhatsAppResponse> {
    if (!this.config) {
      throw new Error('WhatsApp service not initialized. Call initialize() first.');
    }

    const { to, message } = params;
    const phoneNumberId = this.config.phoneId;

    try {
      const url = `${this.baseUrl}/${phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API Error:', data);
        return {
          success: false,
          error: data.error?.message || 'Failed to send WhatsApp message',
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a document (PDF) via WhatsApp
   */
  async sendDocument(params: SendDocumentParams): Promise<WhatsAppResponse> {
    if (!this.config) {
      throw new Error('WhatsApp service not initialized. Call initialize() first.');
    }

    const { to, documentUrl, filename, caption } = params;
    const phoneNumberId = this.config.phoneId;

    try {
      const url = `${this.baseUrl}/${phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type: 'document',
        document: {
          link: documentUrl,
          filename: filename,
          caption: caption || '',
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API Error:', data);
        return {
          success: false,
          error: data.error?.message || 'Failed to send WhatsApp document',
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (error) {
      console.error('WhatsApp send document error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a template message (for approved templates)
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    parameters?: string[]
  ): Promise<WhatsAppResponse> {
    if (!this.config) {
      throw new Error('WhatsApp service not initialized. Call initialize() first.');
    }

    const phoneNumberId = this.config.phoneId;

    try {
      const url = `${this.baseUrl}/${phoneNumberId}/messages`;
      
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
        },
      };

      if (parameters && parameters.length > 0) {
        payload.template.components = [
          {
            type: 'body',
            parameters: parameters.map(param => ({
              type: 'text',
              text: param,
            })),
          },
        ];
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp Template API Error:', data);
        return {
          success: false,
          error: data.error?.message || 'Failed to send WhatsApp template message',
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (error) {
      console.error('WhatsApp template send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify webhook signature (for incoming messages)
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Implementation of signature verification using HMAC SHA256
    // This should match Meta's webhook verification
    try {
      // In a real implementation, you'd use crypto.subtle or a crypto library
      // For now, this is a placeholder
      return true; // Simplified - implement proper HMAC verification
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it doesn't start with country code, assume Rwanda (+250)
    if (!cleaned.startsWith('250')) {
      // If it starts with 0, replace with 250
      if (cleaned.startsWith('0')) {
        cleaned = '250' + cleaned.substring(1);
      } else {
        // Assume it's already in international format or add 250
        if (cleaned.length === 9) {
          cleaned = '250' + cleaned;
        }
      }
    }
    
    return '+' + cleaned;
  }
}

export const whatsappService = new WhatsAppService();
