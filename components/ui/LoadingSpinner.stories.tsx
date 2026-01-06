import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
    title: 'UI/LoadingSpinner',
    component: LoadingSpinner,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Loading indicator with configurable size and text.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        text: {
            control: 'text',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
    args: {},
};

// With text
export const WithText: Story = {
    args: {
        text: 'Loading...',
    },
};

// Small
export const Small: Story = {
    args: {
        size: 'sm',
    },
};

// Medium
export const Medium: Story = {
    args: {
        size: 'md',
    },
};

// Large
export const Large: Story = {
    args: {
        size: 'lg',
        text: 'Loading data...',
    },
};

// In a container
export const InContainer: Story = {
    render: () => (
        <div className="w-64 h-40 bg-slate-100 rounded-lg flex items-center justify-center">
            <LoadingSpinner size="md" text="Fetching..." />
        </div>
    ),
    args: {},
};

// All sizes
export const AllSizes: Story = {
    render: () => (
        <div className="flex items-end gap-8">
            <div className="text-center">
                <LoadingSpinner size="sm" />
                <p className="text-xs text-slate-500 mt-2">Small</p>
            </div>
            <div className="text-center">
                <LoadingSpinner size="md" />
                <p className="text-xs text-slate-500 mt-2">Medium</p>
            </div>
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-xs text-slate-500 mt-2">Large</p>
            </div>
        </div>
    ),
    args: {},
};
