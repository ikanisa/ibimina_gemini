/**
 * Card Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';

describe('Card', () => {
    it('should render children', () => {
        render(<Card>Card content</Card>);
        expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply default padding', () => {
        const { container } = render(<Card>Content</Card>);
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('p-6');
    });

    it('should apply small padding', () => {
        const { container } = render(<Card padding="sm">Small padding</Card>);
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('p-4');
    });

    it('should apply large padding', () => {
        const { container } = render(<Card padding="lg">Large padding</Card>);
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('p-8');
    });

    it('should apply no padding', () => {
        const { container } = render(<Card padding="none">No padding</Card>);
        const card = container.firstChild as HTMLElement;
        expect(card.className).not.toContain('p-4');
        expect(card.className).not.toContain('p-6');
        expect(card.className).not.toContain('p-8');
    });

    it('should apply hover effects when hover prop is true', () => {
        const { container } = render(<Card hover>Hover card</Card>);
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('transition');
    });

    it('should call onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<Card onClick={handleClick}>Clickable</Card>);

        fireEvent.click(screen.getByText('Clickable'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have button role when onClick is provided', () => {
        const handleClick = vi.fn();
        render(<Card onClick={handleClick}>Clickable</Card>);

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle keyboard Enter for click', () => {
        const handleClick = vi.fn();
        render(<Card onClick={handleClick}>Clickable</Card>);

        const card = screen.getByRole('button');
        fireEvent.keyDown(card, { key: 'Enter' });
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard Space for click', () => {
        const handleClick = vi.fn();
        render(<Card onClick={handleClick}>Clickable</Card>);

        const card = screen.getByRole('button');
        fireEvent.keyDown(card, { key: ' ' });
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer when onClick is provided', () => {
        const handleClick = vi.fn();
        render(<Card onClick={handleClick}>Clickable</Card>);

        const card = screen.getByRole('button');
        expect(card.className).toContain('cursor-pointer');
    });

    it('should merge custom className', () => {
        const { container } = render(<Card className="custom-class">Custom</Card>);
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('custom-class');
    });
});

describe('CardHeader', () => {
    it('should render children', () => {
        render(<CardHeader>Header</CardHeader>);
        expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('should have border-bottom', () => {
        render(<CardHeader>Header</CardHeader>);
        const header = screen.getByText('Header');
        expect(header.className).toContain('border-b');
    });

    it('should merge custom className', () => {
        render(<CardHeader className="custom-header">Header</CardHeader>);
        expect(screen.getByText('Header').className).toContain('custom-header');
    });
});

describe('CardTitle', () => {
    it('should render as h3', () => {
        render(<CardTitle>Title</CardTitle>);
        expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should render children', () => {
        render(<CardTitle>My Title</CardTitle>);
        expect(screen.getByText('My Title')).toBeInTheDocument();
    });

    it('should merge custom className', () => {
        render(<CardTitle className="custom-title">Title</CardTitle>);
        expect(screen.getByText('Title').className).toContain('custom-title');
    });
});

describe('CardContent', () => {
    it('should render children', () => {
        render(<CardContent>Content</CardContent>);
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should merge custom className', () => {
        render(<CardContent className="custom-content">Content</CardContent>);
        expect(screen.getByText('Content').className).toContain('custom-content');
    });
});
