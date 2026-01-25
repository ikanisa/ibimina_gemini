/**
 * Section Component
 * Content section wrapper with optional title and header actions
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { cn } from '@/lib/utils/cn';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  title,
  children,
  className,
  headerActions,
}) => {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{title}</CardTitle>
            {headerActions}
          </div>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
};
