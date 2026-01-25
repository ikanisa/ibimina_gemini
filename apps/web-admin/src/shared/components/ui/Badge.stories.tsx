import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
    title: 'UI/Badge',
    component: Badge,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Status badge/pill component for labels and indicators.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'success', 'warning', 'error', 'info'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
    args: {
        children: 'Default',
    },
};

// Success variant
export const Success: Story = {
    args: {
        children: 'Active',
        variant: 'success',
    },
};

// Warning variant
export const Warning: Story = {
    args: {
        children: 'Pending',
        variant: 'warning',
    },
};

// Error variant
export const Error: Story = {
    args: {
        children: 'Failed',
        variant: 'danger',
    },
};

// Info variant
export const Info: Story = {
    args: {
        children: 'New',
        variant: 'info',
    },
};

// Small size
export const Small: Story = {
    args: {
        children: 'Small',
        size: 'sm',
    },
};

// All variants showcase
export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Error</Badge>
            <Badge variant="info">Info</Badge>
        </div>
    ),
    args: {
        children: '',
    },
};

// Use cases
export const UseCases: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="info">Admin</Badge>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Payment:</span>
                <Badge variant="warning">Overdue</Badge>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Loan:</span>
                <Badge variant="danger">Defaulted</Badge>
            </div>
        </div>
    ),
    args: {
        children: '',
    },
};
