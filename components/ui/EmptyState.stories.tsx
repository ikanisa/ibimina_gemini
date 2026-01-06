import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';
import { Users, FileSearch, Inbox } from 'lucide-react';
import { Button } from './Button';

const meta: Meta<typeof EmptyState> = {
    title: 'UI/EmptyState',
    component: EmptyState,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Empty state placeholder for when there is no data to display.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
    args: {
        title: 'No results found',
        description: 'Try adjusting your search or filters.',
    },
};

// With icon
export const WithIcon: Story = {
    args: {
        icon: <Users size={48} className="text-slate-300" />,
        title: 'No members yet',
        description: 'Start by adding your first member to the system.',
    },
};

// With action
export const WithAction: Story = {
    args: {
        icon: <Inbox size={48} className="text-slate-300" />,
        title: 'No messages',
        description: 'Your inbox is empty. New messages will appear here.',
        action: <Button size="sm">Compose Message</Button>,
    },
};

// Search empty
export const SearchEmpty: Story = {
    args: {
        icon: <FileSearch size={48} className="text-slate-300" />,
        title: 'No matches',
        description: 'We couldn\'t find anything matching your search. Try different keywords.',
        action: <Button variant="secondary" size="sm">Clear Search</Button>,
    },
};

// In container
export const InContainer: Story = {
    render: () => (
        <div className="w-96 h-64 bg-white border rounded-lg flex items-center justify-center">
            <EmptyState
                icon={<Users size={40} className="text-slate-300" />}
                title="No groups"
                description="Create your first group to get started."
                action={<Button size="sm">Create Group</Button>}
            />
        </div>
    ),
    args: {
        title: '',
    },
};
