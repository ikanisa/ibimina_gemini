/**
 * Reusable Form Field Component
 * 
 * Accessible form field wrapper with proper label associations
 */

import React, { useId } from 'react';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  /** Optional explicit ID - if not provided, children should handle their own ID */
  htmlFor?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  hint,
  children,
  className = '',
  htmlFor
}) => {
  // Generate IDs for hint and error messages
  const generatedId = useId();
  const fieldId = htmlFor || generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  // Clone children to add aria-describedby if they support it
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement<React.HTMLAttributes<HTMLElement>>(child)) {
      const describedBy = [
        hint && !error ? hintId : null,
        error ? errorId : null,
      ].filter(Boolean).join(' ');

      return React.cloneElement(child, {
        id: htmlFor ? (child.props as { id?: string }).id : fieldId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      });
    }
    return child;
  });

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-hidden="true">*</span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </label>
      {enhancedChildren}
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

