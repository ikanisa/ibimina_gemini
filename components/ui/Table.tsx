/**
 * Table Component
 * Consistent table layout with header, rows, and cells
 */

import React from 'react';
import { cn } from '../../lib/utils/cn';

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
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => (
  <thead className={cn('bg-slate-50 border-b border-slate-200', className)}>
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
      'border-b border-slate-100',
      hover && 'hover:bg-slate-50',
      onClick && 'cursor-pointer',
      className
    )}
    onClick={onClick}
  >
    {children}
  </tr>
);

export interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className }) => (
  <th
    className={cn(
      'px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider',
      className
    )}
  >
    {children}
  </th>
);

export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className }) => (
  <td className={cn('px-4 py-3 text-sm text-slate-900', className)}>
    {children}
  </td>
);
