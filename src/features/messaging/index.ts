/**
 * Messaging Feature Exports
 */

// Components
export { WhatsAppMessaging } from './components/WhatsAppMessaging';

// Hooks
export { useMemberStatement } from './hooks/useMemberStatement';
export { useSendWhatsApp } from './hooks/useSendWhatsApp';
export { useGroupReport } from './hooks/useGroupReport';

// Utils
export { generateStatementMessage, generateGroupReportMessage } from './utils/messageGenerators';
export { generateMemberStatementPDF } from './utils/memberStatementPDF';

// Types
export type {
    MemberStatement,
    GroupReportData,
    MessageType,
    WhatsAppMessageRequest,
    MessageSendResult
} from './types';
