/**
 * Validation Schemas using Zod
 * Centralized validation for all API inputs and form data
 */

import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid ID format');

export const phoneSchema = z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^\+?[0-9]+$/, 'Invalid phone number format');

export const emailSchema = z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters');

export const currencySchema = z.enum(['RWF', 'USD', 'EUR', 'KES', 'UGX', 'TZS']);

export const paginationSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
}).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            return new Date(data.startDate) <= new Date(data.endDate);
        }
        return true;
    },
    { message: 'Start date must be before end date' }
);

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const passwordSchema = z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
}).refine(
    (data) => data.password === data.confirmPassword,
    { message: 'Passwords do not match', path: ['confirmPassword'] }
);

export const passwordResetRequestSchema = z.object({
    email: emailSchema,
});

export const passwordResetSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
}).refine(
    (data) => data.password === data.confirmPassword,
    { message: 'Passwords do not match', path: ['confirmPassword'] }
);

// ============================================================================
// MEMBER SCHEMAS
// ============================================================================

export const memberCreateSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: phoneSchema,
    email: emailSchema.optional(),
    branch: z.string().max(100).optional(),
    institutionId: uuidSchema,
});

export const memberUpdateSchema = z.object({
    fullName: z.string().min(2).max(100).optional(),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    branch: z.string().max(100).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'CLOSED']).optional(),
    kycStatus: z.enum(['VERIFIED', 'PENDING', 'REJECTED']).optional(),
});

// ============================================================================
// GROUP SCHEMAS
// ============================================================================

export const groupCreateSchema = z.object({
    groupName: z.string().min(2, 'Group name must be at least 2 characters').max(100),
    institutionId: uuidSchema,
    expectedAmount: z.number().positive('Expected amount must be positive'),
    frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
    graceDays: z.number().int().min(0).max(30).default(7),
    currency: currencySchema.default('RWF'),
    meetingDay: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']).optional(),
});

export const groupUpdateSchema = z.object({
    groupName: z.string().min(2).max(100).optional(),
    expectedAmount: z.number().positive().optional(),
    frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
    graceDays: z.number().int().min(0).max(30).optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']).optional(),
    meetingDay: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']).optional(),
});

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

export const transactionCreateSchema = z.object({
    memberId: uuidSchema.optional(),
    groupId: uuidSchema.optional(),
    institutionId: uuidSchema,
    amount: z.number().positive('Amount must be positive').max(100000000, 'Amount exceeds maximum limit'),
    type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'LOAN_REPAYMENT', 'GROUP_CONTRIBUTION', 'TOKEN_PURCHASE', 'TOKEN_REDEEM']),
    channel: z.enum(['CASH', 'MOMO_NFC', 'MOMO_USSD', 'BANK_TRANSFER', 'TOKEN', 'SYSTEM']),
    currency: currencySchema.default('RWF'),
    reference: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
});

export const transactionFilterSchema = z.object({
    memberId: uuidSchema.optional(),
    groupId: uuidSchema.optional(),
    type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'LOAN_REPAYMENT', 'GROUP_CONTRIBUTION', 'TOKEN_PURCHASE', 'TOKEN_REDEEM']).optional(),
    status: z.enum(['COMPLETED', 'PENDING', 'FAILED', 'REVERSED']).optional(),
    channel: z.enum(['CASH', 'MOMO_NFC', 'MOMO_USSD', 'BANK_TRANSFER', 'TOKEN', 'SYSTEM']).optional(),
    minAmount: z.number().positive().optional(),
    maxAmount: z.number().positive().optional(),
    ...dateRangeSchema.shape,
    ...paginationSchema.shape,
});

// ============================================================================
// CONTRIBUTION SCHEMAS
// ============================================================================

export const contributionCreateSchema = z.object({
    groupId: uuidSchema,
    memberId: uuidSchema,
    amount: z.number().positive('Contribution amount must be positive'),
    method: z.enum(['CASH', 'MOMO', 'BANK_TRANSFER']),
    reference: z.string().max(100).optional(),
});

// ============================================================================
// STAFF SCHEMAS
// ============================================================================

export const staffCreateSchema = z.object({
    email: emailSchema,
    fullName: z.string().min(2).max(100),
    role: z.enum(['PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR']),
    institutionId: uuidSchema.optional(),
    branch: z.string().max(100).optional(),
});

export const staffUpdateSchema = z.object({
    fullName: z.string().min(2).max(100).optional(),
    role: z.enum(['PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR']).optional(),
    branch: z.string().max(100).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});

// ============================================================================
// SETTINGS SCHEMAS
// ============================================================================

export const settingsUpdateSchema = z.object({
    systemName: z.string().min(2).max(100).optional(),
    supportEmail: emailSchema.optional(),
    baseCurrency: currencySchema.optional(),
    momoShortcode: z.string().max(20).optional(),
    momoMerchantId: z.string().max(50).optional(),
    autoReconcile: z.boolean().optional(),
    notificationsEnabled: z.boolean().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type GroupCreateInput = z.infer<typeof groupCreateSchema>;
export type GroupUpdateInput = z.infer<typeof groupUpdateSchema>;
export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
export type ContributionCreateInput = z.infer<typeof contributionCreateSchema>;
export type StaffCreateInput = z.infer<typeof staffCreateSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
