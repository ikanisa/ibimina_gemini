/**
 * SimpleForm Component
 * Simplified form wrapper with consistent styling
 */

import React from 'react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { ErrorDisplay } from './ErrorDisplay';

interface SimpleFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export const SimpleForm: React.FC<SimpleFormProps> = ({
  children,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  error,
  className,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <Card>
        <CardContent padding="lg">
          {error && (
            <div className="mb-4">
              <ErrorDisplay error={error} variant="inline" />
            </div>
          )}
          <div className="space-y-4">{children}</div>
          {(onSubmit || onCancel) && (
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
              {onCancel && (
                <Button type="button" variant="secondary" onClick={onCancel}>
                  {cancelLabel}
                </Button>
              )}
              {onSubmit && (
                <Button type="submit" variant="primary" isLoading={isLoading}>
                  {submitLabel}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
};
