import type { Meta, StoryFn } from '@storybook/react';
import { Modal, ModalProps } from './Modal';
import { Button } from './Button';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
    title: 'UI/Modal',
    component: Modal,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Accessible modal dialog with focus trap and keyboard navigation.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg', 'xl', 'full'],
        },
        showCloseButton: {
            control: 'boolean',
        },
        closeOnOverlayClick: {
            control: 'boolean',
        },
    },
};

export default meta;

// Interactive modal story
const InteractiveModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Sample Modal"
            >
                <div className="p-6">
                    <p className="text-slate-600 mb-4">
                        This is an accessible modal with focus trap and keyboard navigation.
                        Press Escape or click outside to close.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => setIsOpen(false)}>
                            Confirm
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export const Interactive: StoryFn<ModalProps> = () => <InteractiveModal />;

// Size variants
const SizeDemo = ({ size }: { size: 'sm' | 'md' | 'lg' | 'xl' }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>Open {size.toUpperCase()} Modal</Button>
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={`${size.toUpperCase()} Modal`}
                size={size}
            >
                <div className="p-6">
                    <p className="text-slate-600">This is a {size} sized modal.</p>
                </div>
            </Modal>
        </>
    );
};

export const Small: StoryFn<ModalProps> = () => <SizeDemo size="sm" />;
export const Medium: StoryFn<ModalProps> = () => <SizeDemo size="md" />;
export const Large: StoryFn<ModalProps> = () => <SizeDemo size="lg" />;
export const ExtraLarge: StoryFn<ModalProps> = () => <SizeDemo size="xl" />;

// Form modal example
const FormModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>Open Form Modal</Button>
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Create New Item"
                size="md"
            >
                <form className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter email"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Create
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export const WithForm: StoryFn<ModalProps> = () => <FormModal />;

