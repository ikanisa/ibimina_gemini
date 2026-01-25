/**
 * Table Component
 * Consistent table layout with header, rows, and cells
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className }) => (
  <div className="overflow-x-auto">
    <table className={cn('w-full text-left', className)}>
      {children}
    </table>
  </div>
);

export interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className, glass = false }) => (
  <thead className={cn(
    glass
      ? 'bg-white/70 dark:bg-neutral-800/70 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-700/50'
      : 'bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700',
    className
  )}>
    {children}
  </thead>
);

export interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className,
  onClick,
  hover = true,
}) => (
  <tr
    className={cn(
      'border-b border-neutral-100 dark:border-neutral-700/50',
      hover && 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
      onClick && 'cursor-pointer',
      className
    )}
    onClick={onClick}
  >
    {children}
  </tr>
);

export interface TableHeadProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className, onClick }) => (
  <th
    className={cn(
      'px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider',
      onClick && 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700/50',
      className
    )}
    onClick={onClick}
  >
    {children}
  </th>
);


export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className }) => (
  <td className={cn('px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100', className)}>
    {children}
  </td>
);
