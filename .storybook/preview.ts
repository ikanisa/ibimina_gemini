import type { Preview } from '@storybook/react';
import '../index.css';

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#f8fafc' },
                { name: 'dark', value: '#0f172a' },
                { name: 'white', value: '#ffffff' },
            ],
        },
        a11y: {
            // axe-core configurations
            config: {
                rules: [
                    { id: 'color-contrast', enabled: true },
                    { id: 'label', enabled: true },
                ],
            },
        },
    },
    globalTypes: {
        theme: {
            description: 'Global theme for components',
            defaultValue: 'light',
            toolbar: {
                title: 'Theme',
                icon: 'circlehollow',
                items: ['light', 'dark'],
                dynamicTitle: true,
            },
        },
    },
};

export default preview;
