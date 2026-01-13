/**
 * Input Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
    it('should render input element', () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should accept value changes', () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} />);

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'test value' } });

        expect(handleChange).toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
        render(<Input disabled />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should have min height for touch target', () => {
        render(<Input data-testid="input" />);
        const input = screen.getByRole('textbox');
        expect(input.className).toContain('min-h-');
    });

    it('should show error state', () => {
        render(<Input error />);
        const input = screen.getByRole('textbox');
        expect(input.className).toContain('border-error');
        expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not show error state by default', () => {
        render(<Input />);
        const input = screen.getByRole('textbox');
        expect(input.className).not.toContain('border-error');
        expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should display helper text', () => {
        render(<Input helperText="This is helper text" />);
        expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });

    it('should display error helper text with error styling', () => {
        render(<Input error helperText="Error message" />);
        const helper = screen.getByText('Error message');
        expect(helper.className).toContain('text-error');
    });

    it('should display normal helper text without error styling', () => {
        render(<Input helperText="Help text" />);
        const helper = screen.getByText('Help text');
        expect(helper.className).toContain('text-neutral');
    });

    it('should merge custom className', () => {
        render(<Input className="custom-input" />);
        const input = screen.getByRole('textbox');
        expect(input.className).toContain('custom-input');
    });

    it('should forward ref', () => {
        const ref = vi.fn();
        render(<Input ref={ref} />);
        expect(ref).toHaveBeenCalled();
    });

    it('should support different input types', () => {
        render(<Input type="email" data-testid="email-input" />);
        expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
    });

    it('should support password type', () => {
        render(<Input type="password" data-testid="password-input" />);
        expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
    });

    it('should support required attribute', () => {
        render(<Input required />);
        expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('should support pattern attribute', () => {
        render(<Input pattern="[0-9]+" />);
        expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[0-9]+');
    });

    it('should show focus ring on focus', () => {
        render(<Input />);
        const input = screen.getByRole('textbox');
        expect(input.className).toContain('focus:ring');
    });
});
