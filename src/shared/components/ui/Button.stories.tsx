import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Plus, ArrowRight, Save, Trash2 } from 'lucide-react';

const meta = {
    title: 'UI/Button',
    component: Button,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Primary button component with multiple variants and sizes.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'danger', 'ghost', 'outline'],
            description: 'Visual style variant',
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Button size',
        },
        isLoading: {
            control: 'boolean',
            description: 'Shows loading spinner',
        },
        disabled: {
            control: 'boolean',
        },
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Primary variant
export const Primary: Story = {
    args: {
        children: 'Primary Button',
        variant: 'primary',
    },
};

// Secondary variant
export const Secondary: Story = {
    args: {
        children: 'Secondary Button',
        variant: 'secondary',
    },
};

// Danger variant
export const Danger: Story = {
    args: {
        children: 'Delete',
        variant: 'danger',
        leftIcon: <Trash2 size={16} />,
    },
};

// Ghost variant
export const Ghost: Story = {
    args: {
        children: 'Ghost Button',
        variant: 'ghost',
    },
};

// Outline variant
export const Outline: Story = {
    args: {
        children: 'Outline Button',
        variant: 'outline',
    },
};

// With left icon
export const WithLeftIcon: Story = {
    args: {
        children: 'Add Item',
        leftIcon: <Plus size={16} />,
        variant: 'primary',
    },
};

// With right icon
export const WithRightIcon: Story = {
    args: {
        children: 'Continue',
        rightIcon: <ArrowRight size={16} />,
        variant: 'primary',
    },
};

// Loading state
export const Loading: Story = {
    args: {
        children: 'Save Changes',
        isLoading: true,
        leftIcon: <Save size={16} />,
    },
};

// Disabled state
export const Disabled: Story = {
    args: {
        children: 'Cannot Click',
        disabled: true,
    },
};

// Size variants
export const Small: Story = {
    args: {
        children: 'Small',
        size: 'sm',
    },
};

export const Medium: Story = {
    args: {
        children: 'Medium',
        size: 'md',
    },
};

export const Large: Story = {
    args: {
        children: 'Large',
        size: 'lg',
    },
};

// All variants showcase
export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
            </div>
            <div className="flex gap-4 items-center">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
            </div>
        </div>
    ),
};
