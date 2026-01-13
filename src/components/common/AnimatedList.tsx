/**
 * Animated List Component
 * Renders list items with staggered entrance animations
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface AnimatedListProps {
    children: React.ReactNode[];
    className?: string;
    staggerDelay?: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.2,
        },
    },
};

export const AnimatedList: React.FC<AnimatedListProps> = ({
    children,
    className = '',
    staggerDelay = 0.05,
}) => {
    const customContainerVariants = {
        ...containerVariants,
        visible: {
            ...containerVariants.visible,
            transition: {
                staggerChildren: staggerDelay,
            },
        },
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={customContainerVariants}
            className={className}
        >
            {React.Children.map(children, (child, index) => (
                <motion.div key={index} variants={itemVariants}>
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
};

// Individual list item wrapper
export const AnimatedListItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = '',
}) => {
    return (
        <motion.div variants={itemVariants} className={className}>
            {children}
        </motion.div>
    );
};

export default AnimatedList;
