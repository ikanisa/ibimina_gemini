import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
    stories: [
        '../components/**/*.stories.@(js|jsx|ts|tsx)',
        '../components/**/*.mdx'
    ],
    addons: [
        '@storybook/addon-essentials',
        '@storybook/addon-a11y',
    ],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    viteFinal: async (config) => {
        // Customize Vite config here if needed
        return config;
    },
    docs: {
        autodocs: 'tag',
    },
};

export default config;
