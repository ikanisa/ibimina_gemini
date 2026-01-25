/**
 * Hook to send WhatsApp messages
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth';
import type { WhatsAppMessageRequest, MessageSendResult } from '../types';

interface UseSendWhatsAppResult {
    sending: boolean;
    result: MessageSendResult | null;
    sendMessage: (request: WhatsAppMessageRequest) => Promise<MessageSendResult>;
    reset: () => void;
}

export function useSendWhatsApp(): UseSendWhatsAppResult {
    const { institutionId } = useAuth();
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<MessageSendResult | null>(null);

    const sendMessage = useCallback(async (request: WhatsAppMessageRequest): Promise<MessageSendResult> => {
        setSending(true);
        setResult(null);

        try {
            if (!institutionId) {
                throw new Error('Institution not found');
            }

            // Call the send-whatsapp Edge Function
            const { data, error } = await supabase.functions.invoke('send-whatsapp', {
                body: {
                    to: request.recipientPhone,
                    message: request.message,
                    documentUrl: request.pdfUrl,
                    documentFilename: request.pdfFilename,
                    idempotencyKey: `${request.recipientId}-${Date.now()}`,
                },
            });

            if (error) {
                const errorResult: MessageSendResult = {
                    success: false,
                    error: error.message
                };
                setResult(errorResult);

                // Log failed attempt
                await logNotification(
                    institutionId,
                    request,
                    errorResult
                );

                return errorResult;
            }

            const sendResult: MessageSendResult = {
                success: data?.success ?? false,
                messageId: data?.messageId,
                error: data?.error,
                sentAt: data?.success ? new Date().toISOString() : undefined,
            };

            // Log the notification
            const logId = await logNotification(
                institutionId,
                request,
                sendResult
            );
            sendResult.logId = logId || undefined;

            setResult(sendResult);
            return sendResult;
        } catch (err) {
            const errorResult: MessageSendResult = {
                success: false,
                error: err instanceof Error ? err.message : 'Failed to send message',
            };
            setResult(errorResult);
            return errorResult;
        } finally {
            setSending(false);
        }
    }, [institutionId]);

    const reset = useCallback(() => {
        setResult(null);
    }, []);

    return { sending, result, sendMessage, reset };
}

// Helper function to log notification
async function logNotification(
    institutionId: string,
    request: WhatsAppMessageRequest,
    result: MessageSendResult
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('notification_logs')
            .insert({
                institution_id: institutionId,
                recipient_type: request.recipientType,
                recipient_id: request.recipientId,
                recipient_phone: request.recipientPhone,
                channel: 'WHATSAPP',
                template_type: request.messageType,
                message_body: request.message,
                status: result.success ? 'SENT' : 'FAILED',
                external_id: result.messageId,
                error_message: result.error,
                sent_at: result.success ? new Date().toISOString() : null,
                metadata: {
                    recipient_name: request.recipientName,
                    pdf_attached: request.attachPdf || false,
                },
            })
            .select('id')
            .single();

        if (error) {
            console.error('Failed to log notification:', error);
            return null;
        }

        return data.id;
    } catch (err) {
        console.error('Error logging notification:', err);
        return null;
    }
}
