/**
 * Skip Link Component
 * 
 * Allows keyboard users to skip repeated navigation content
 */

import React from 'react';

export interface SkipLinkProps {
    /** Target element ID to skip to */
    targetId?: string;
    /** Link text */
    children?: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
    targetId = 'main-content',
    children = 'Skip to main content'
}) => {
    return (
        <a
            href={`#${targetId}`}
            className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-2
        focus:bg-blue-600 focus:text-white
        focus:rounded-lg focus:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600
        font-medium text-sm
      "
        >
            {children}
        </a>
    );
};

export default SkipLink;
