import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from './SearchInput';
import { useState } from 'react';

const meta = {
    title: 'UI/SearchInput',
    component: SearchInput,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Accessible search input with clear button and screen reader support.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        placeholder: {
            control: 'text',
        },
        label: {
            control: 'text',
            description: 'Label for screen readers (hidden visually)',
        },
        showClearButton: {
            control: 'boolean',
        },
    },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
    args: {
        placeholder: 'Search...',
    },
};

// With custom label
export const WithLabel: Story = {
    args: {
        label: 'Search members',
        placeholder: 'Search members...',
    },
};

// Interactive with controlled state
const ControlledSearch = () => {
    const [value, setValue] = useState('');

    return (
        <div className="w-72">
            <SearchInput
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onClear={() => setValue('')}
                placeholder="Type to search..."
                label="Search items"
            />
            <p className="mt-2 text-xs text-slate-500">
                Current value: {value || '(empty)'}
            </p>
        </div>
    );
};

export const Controlled: Story = {
    render: () => <ControlledSearch />,
};

// Wide variant
export const Wide: Story = {
    args: {
        placeholder: 'Search members, groups, or transactions...',
        className: 'w-96',
    },
};

// Without clear button
export const NoClearButton: Story = {
    args: {
        placeholder: 'Search...',
        showClearButton: false,
    },
};
