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
            className="skip-link"
        >
            {children}
        </a>
    );
};

export default SkipLink;
