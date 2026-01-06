/**
 * Button Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
    it('should render with children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should call onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);

        fireEvent.click(screen.getByText('Click me'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);

        const button = screen.getByText('Disabled');
        expect(button).toBeDisabled();
    });

    it('should not call onClick when disabled', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick} disabled>Disabled</Button>);

        fireEvent.click(screen.getByText('Disabled'));
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('should show loading state when isLoading is true', () => {
        render(<Button isLoading>Submit</Button>);

        // Button should be disabled while loading
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        // Should show loading text
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should apply primary variant styles by default', () => {
        render(<Button>Primary</Button>);

        const button = screen.getByRole('button');
        expect(button.className).toContain('bg-blue');
    });

    it('should apply secondary variant styles', () => {
        render(<Button variant="secondary">Secondary</Button>);

        const button = screen.getByRole('button');
        expect(button.className).toContain('bg-slate');
    });

    it('should apply danger variant styles', () => {
        render(<Button variant="danger">Danger</Button>);

        const button = screen.getByRole('button');
        expect(button.className).toContain('bg-red');
    });

    it('should apply outline variant with border', () => {
        render(<Button variant="outline">Outline</Button>);

        const button = screen.getByRole('button');
        expect(button.className).toContain('border');
    });

    it('should apply small size styles', () => {
        render(<Button size="sm">Small</Button>);

        const button = screen.getByRole('button');
        expect(button.className).toContain('px-3');
    });

    it('should apply large size styles', () => {
        render(<Button size="lg">Large</Button>);

        const button = screen.getByRole('button');
        expect(button.className).toContain('px-6');
    });

    it('should merge custom className', () => {
        render(<Button className="custom-class">Custom</Button>);

        const button = screen.getByRole('button');
        expect(button.className).toContain('custom-class');
    });

    it('should support type attribute', () => {
        render(<Button type="submit">Submit</Button>);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render left icon', () => {
        render(<Button leftIcon={<span data-testid="left-icon">←</span>}>With Icon</Button>);

        expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
        render(<Button rightIcon={<span data-testid="right-icon">→</span>}>With Icon</Button>);

        expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
});
