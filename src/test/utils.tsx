/**
 * Test Utilities
 * 
 * Common utilities and mocks for testing
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';


// Custom render that wraps components with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    // Add any custom options here
}

function customRender(
    ui: ReactElement,
    options?: CustomRenderOptions
) {
    return render(ui, {
        wrapper: ({ children }) => (
            <AuthProvider>
                {children}
            </AuthProvider>
        ),
        ...options,
    });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Mock Supabase client
export const mockSupabase = {
    from: () => ({
        select: () => ({
            eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
                single: () => Promise.resolve({ data: null, error: null }),
            }),
            order: () => ({
                limit: () => Promise.resolve({ data: [], error: null }),
            }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({
            eq: () => Promise.resolve({ data: null, error: null }),
        }),
        delete: () => ({
            eq: () => Promise.resolve({ data: null, error: null }),
        }),
    }),
    auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    },
};

// Mock user for testing authenticated components
export const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
        institution_id: 'test-institution-id',
        role: 'INSTITUTION_ADMIN',
        full_name: 'Test User',
    },
};

// Mock profile
export const mockProfile = {
    user_id: 'test-user-id',
    institution_id: 'test-institution-id',
    role: 'INSTITUTION_ADMIN',
    email: 'test@example.com',
    full_name: 'Test User',
    branch: 'Main',
    status: 'ACTIVE',
};
