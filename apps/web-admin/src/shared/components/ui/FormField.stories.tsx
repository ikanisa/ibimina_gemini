import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './FormField';
import { useState } from 'react';

const meta: Meta<typeof FormField> = {
    title: 'UI/FormField',
    component: FormField,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Accessible form field wrapper with label, hint, and error support.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text' },
        required: { control: 'boolean' },
        error: { control: 'text' },
        hint: { control: 'text' },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
    args: {
        label: 'Email Address',
        children: (
            <input
                type="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email"
            />
        ),
    },
};

// Required field
export const Required: Story = {
    args: {
        label: 'Full Name',
        required: true,
        children: (
            <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Enter name"
            />
        ),
    },
};

// With hint
export const WithHint: Story = {
    args: {
        label: 'Password',
        required: true,
        hint: 'Must be at least 8 characters',
        children: (
            <input
                type="password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Enter password"
            />
        ),
    },
};

// With error
export const WithError: Story = {
    args: {
        label: 'Email Address',
        required: true,
        error: 'Invalid email format',
        children: (
            <input
                type="email"
                className="w-full px-3 py-2 border border-red-300 bg-red-50 rounded-lg"
                defaultValue="invalid-email"
            />
        ),
    },
};

// Select field
export const SelectField: Story = {
    args: {
        label: 'Role',
        required: true,
        children: (
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option>Select role...</option>
                <option>Admin</option>
                <option>Manager</option>
                <option>User</option>
            </select>
        ),
    },
};

// Textarea
export const TextareaField: Story = {
    args: {
        label: 'Description',
        hint: 'Maximum 500 characters',
        children: (
            <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                rows={4}
                placeholder="Enter description..."
            />
        ),
    },
};

// Form layout example
const FormExample = () => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        setErrors({
            email: 'Email is required',
            password: 'Password must be at least 8 characters',
        });
    };

    return (
        <div className="w-80 space-y-4 p-4 bg-white rounded-lg border">
            <FormField label="Email" required error={errors.email}>
                <input
                    type="email"
                    className={`w-full px-3 py-2 border rounded-lg ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
                        }`}
                />
            </FormField>
            <FormField
                label="Password"
                required
                hint="Min 8 characters"
                error={errors.password}
            >
                <input
                    type="password"
                    className={`w-full px-3 py-2 border rounded-lg ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
                        }`}
                />
            </FormField>
            <button
                type="button"
                onClick={validate}
                className="w-full py-2 bg-blue-600 text-white rounded-lg"
            >
                Submit (trigger errors)
            </button>
        </div>
    );
};

export const FormLayout: Story = {
    render: () => <FormExample />,
    args: {
        label: '',
        children: null,
    },
};
