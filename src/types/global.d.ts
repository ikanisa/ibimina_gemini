/// <reference types="vitest" />
/// <reference types="vite/client" />

// Extend Vitest with jest-dom matchers
// This is a module file because of the import
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
    interface Assertion<T = any> extends TestingLibraryMatchers<T, void> { }
}
