/**
 * Server-Side Validation for Critical Forms
 * Validation middleware for Supabase Edge Functions
 */

import { z } from 'zod';

// ============================================================================
// VALIDATION RESULT TYPE
// ============================================================================

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: { field: string; message: string }[];
}

// ============================================================================
// CRITICAL FORM SCHEMAS
// ============================================================================

// Member Registration
export const memberRegistrationSchema = z.object({
    full_name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name too long')
        .regex(/^[a-zA-Z\s\-']+$/, 'Invalid characters in name'),
    email: z.string()
        .email('Invalid email address')
        .toLowerCase(),
    phone: z.string()
        .regex(/^(\+?25)?07[2389]\d{7}$/, 'Invalid Rwandan phone number'),
    national_id: z.string()
        .regex(/^\d{16}$/, 'National ID must be 16 digits')
        .optional(),
    date_of_birth: z.string()
        .refine((date) => {
            const dob = new Date(date);
            const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365);
            return age >= 18;
        }, 'Must be at least 18 years old'),
    address: z.string()
        .min(5, 'Address too short')
        .max(200, 'Address too long')
        .optional(),
});

// Transaction
export const transactionSchema = z.object({
    member_id: z.string().uuid('Invalid member ID'),
    amount: z.number()
        .positive('Amount must be positive')
        .max(50000000, 'Amount exceeds maximum limit'),
    type: z.enum(['deposit', 'withdrawal', 'transfer', 'loan_payment']),
    description: z.string()
        .max(500, 'Description too long')
        .optional(),
    reference: z.string()
        .max(50, 'Reference too long')
        .optional(),
});

// Group Creation
export const groupSchema = z.object({
    name: z.string()
        .min(3, 'Group name must be at least 3 characters')
        .max(100, 'Group name too long'),
    type: z.enum(['savings', 'loan', 'investment']),
    contribution_amount: z.number()
        .positive('Contribution must be positive')
        .max(10000000, 'Contribution exceeds limit'),
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
    max_members: z.number()
        .int()
        .min(2, 'At least 2 members required')
        .max(100, 'Maximum 100 members'),
    start_date: z.string()
        .refine((date) => new Date(date) >= new Date(), 'Start date must be in the future'),
});

// Loan Application
export const loanApplicationSchema = z.object({
    member_id: z.string().uuid('Invalid member ID'),
    amount: z.number()
        .positive('Loan amount must be positive')
        .min(10000, 'Minimum loan is 10,000 RWF')
        .max(50000000, 'Maximum loan is 50,000,000 RWF'),
    purpose: z.string()
        .min(10, 'Please provide more detail about loan purpose')
        .max(500, 'Purpose description too long'),
    term_months: z.number()
        .int()
        .min(1, 'Minimum term is 1 month')
        .max(60, 'Maximum term is 60 months'),
    collateral_description: z.string()
        .max(500, 'Description too long')
        .optional(),
});

// User Profile Update
export const profileUpdateSchema = z.object({
    full_name: z.string()
        .min(2, 'Name too short')
        .max(100, 'Name too long')
        .optional(),
    phone: z.string()
        .regex(/^(\+?25)?07[2389]\d{7}$/, 'Invalid phone number')
        .optional(),
    branch: z.string()
        .max(100, 'Branch name too long')
        .optional(),
    avatar_url: z.string()
        .url('Invalid avatar URL')
        .optional()
        .nullable(),
});

// Password Change
export const passwordChangeSchema = z.object({
    current_password: z.string()
        .min(1, 'Current password required'),
    new_password: z.string()
        .min(12, 'Password must be at least 12 characters')
        .regex(/[A-Z]/, 'Password must contain uppercase letter')
        .regex(/[a-z]/, 'Password must contain lowercase letter')
        .regex(/[0-9]/, 'Password must contain number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
    confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
});

// ============================================================================
// VALIDATION FUNCTION
// ============================================================================

/**
 * Validate request body against schema
 * @param schema Zod schema
 * @param data Request data
 * @returns ValidationResult
 */
export function validateRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): ValidationResult<T> {
    try {
        const parsed = schema.parse(data);
        return { success: true, data: parsed };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                errors: error.issues.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            };
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }],
        };
    }
}

/**
 * Create validation middleware for edge function
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
    return (data: unknown): ValidationResult<T> => validateRequest(schema, data);
}

// ============================================================================
// EDGE FUNCTION RESPONSE HELPER
// ============================================================================

/**
 * Return validation error response
 */
export function validationErrorResponse(errors: { field: string; message: string }[]) {
    return new Response(
        JSON.stringify({
            error: 'Validation failed',
            details: errors,
        }),
        {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export const validators = {
    memberRegistration: createValidator(memberRegistrationSchema),
    transaction: createValidator(transactionSchema),
    group: createValidator(groupSchema),
    loanApplication: createValidator(loanApplicationSchema),
    profileUpdate: createValidator(profileUpdateSchema),
    passwordChange: createValidator(passwordChangeSchema),
};

export default validators;
