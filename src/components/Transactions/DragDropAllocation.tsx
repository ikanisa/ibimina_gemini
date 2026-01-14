/**
 * Drag and Drop Allocation Component
 * 
 * Allows dragging transactions to members/groups for allocation
 */

import React, { useState, useCallback } from 'react';
import { User, Users, Loader2, CheckCircle2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { handleError, getUserFriendlyMessage } from '../../lib/errors/ErrorHandler';
import { captureError } from '../../lib/sentry';
import { Button } from '../ui';

interface DragDropAllocationProps {
  transactionId: string;
  transactionAmount: number;
  transactionCurrency: string;
  onAllocationComplete?: () => void;
  className?: string;
}

interface Member {
  id: string;
  full_name: string;
  phone: string;
  member_code: string | null;
  group_id: string;
  group_name?: string;
}

interface Group {
  id: string;
  name: string;
  member_count?: number;
}

export const DragDropAllocation: React.FC<DragDropAllocationProps> = ({
  transactionId,
  transactionAmount,
  transactionCurrency,
  onAllocationComplete,
  className = '',
}) => {
  const { institutionId, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [draggedTransaction, setDraggedTransaction] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Load members and groups
  React.useEffect(() => {
    if (!institutionId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Load members
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, full_name, phone, member_code, group_id, groups(name)')
          .eq('institution_id', institutionId)
          .order('full_name');

        if (membersError) throw membersError;

        const formattedMembers = (membersData || []).map((m: any) => ({
          id: m.id,
          full_name: m.full_name,
          phone: m.phone,
          member_code: m.member_code,
          group_id: m.group_id,
          group_name: m.groups?.name,
        }));

        setMembers(formattedMembers);

        // Load groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('id, name')
          .eq('institution_id', institutionId)
          .order('name');

        if (groupsError) throw groupsError;

        setGroups((groupsData || []) as Group[]);
      } catch (err) {
        const appError = handleError(err, {
          component: 'DragDropAllocation',
          operation: 'loadData',
          institutionId,
        });
        setError(getUserFriendlyMessage(appError));
        captureError(err, {
          component: 'DragDropAllocation',
          operation: 'loadData',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [institutionId]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, transactionId: string) => {
    setDraggedTransaction(transactionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', transactionId);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, targetId: string, type: 'member' | 'group') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(`${type}-${targetId}`);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  // Handle drop - allocate transaction
  const handleDrop = useCallback(async (
    e: React.DragEvent,
    targetId: string,
    type: 'member' | 'group'
  ) => {
    e.preventDefault();
    setDragOverTarget(null);

    if (!draggedTransaction || allocating) return;

    setAllocating(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: any = {
        allocation_status: 'allocated',
        allocated_at: new Date().toISOString(),
        allocated_by: user?.id || null,
      };

      if (type === 'member') {
        updateData.member_id = targetId;
        // Get group_id from member
        const member = members.find(m => m.id === targetId);
        if (member) {
          updateData.group_id = member.group_id;
        }
      } else {
        updateData.group_id = targetId;
      }

      const { error: updateError } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', draggedTransaction);

      if (updateError) throw updateError;

      setSuccess(true);
      setDraggedTransaction(null);

      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onAllocationComplete?.();
      }, 2000);
    } catch (err) {
      const appError = handleError(err, {
        component: 'DragDropAllocation',
        operation: 'allocate',
        transactionId: draggedTransaction,
        targetId,
        type,
      });
      setError(getUserFriendlyMessage(appError));
      captureError(err, {
        component: 'DragDropAllocation',
        operation: 'allocate',
      });
    } finally {
      setAllocating(false);
    }
  }, [draggedTransaction, allocating, members, user, onAllocationComplete]);

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading members and groups...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Transaction allocated successfully!</span>
        </div>
      )}

      {/* Drag instruction */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <p className="font-medium mb-1">Drag and drop to allocate:</p>
        <p className="text-xs">
          Drag the transaction (amount: {transactionAmount.toLocaleString()} {transactionCurrency})
          to a member or group below to allocate it.
        </p>
      </div>

      {/* Members Section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <User size={16} />
          Members ({members.length})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {members.map((member) => {
            const isDragOver = dragOverTarget === `member-${member.id}`;
            return (
              <div
                key={member.id}
                onDragOver={(e) => handleDragOver(e, member.id, 'member')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, member.id, 'member')}
                className={`
                  p-3 rounded-lg border-2 transition-all cursor-pointer
                  ${isDragOver
                    ? 'border-blue-500 bg-blue-50 scale-105'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }
                  ${allocating && draggedTransaction === transactionId ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{member.full_name}</div>
                    <div className="text-xs text-slate-500">
                      {member.phone} {member.member_code && `• ${member.member_code}`}
                    </div>
                    {member.group_name && (
                      <div className="text-xs text-slate-400 mt-1">Group: {member.group_name}</div>
                    )}
                  </div>
                  {isDragOver && (
                    <div className="text-blue-600">
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {members.length === 0 && (
            <div className="text-sm text-slate-400 text-center py-4">
              No members found
            </div>
          )}
        </div>
      </div>

      {/* Groups Section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <Users size={16} />
          Groups ({groups.length})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {groups.map((group) => {
            const isDragOver = dragOverTarget === `group-${group.id}`;
            return (
              <div
                key={group.id}
                onDragOver={(e) => handleDragOver(e, group.id, 'group')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, group.id, 'group')}
                className={`
                  p-3 rounded-lg border-2 transition-all cursor-pointer
                  ${isDragOver
                    ? 'border-blue-500 bg-blue-50 scale-105'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }
                  ${allocating && draggedTransaction === transactionId ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{group.name}</div>
                    {group.member_count !== undefined && (
                      <div className="text-xs text-slate-500">
                        {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  {isDragOver && (
                    <div className="text-blue-600">
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {groups.length === 0 && (
            <div className="text-sm text-slate-400 text-center py-4">
              No groups found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Draggable Transaction Item
 * Wraps a transaction to make it draggable
 */
interface DraggableTransactionProps {
  transactionId: string;
  amount: number;
  currency: string;
  children: React.ReactNode;
  className?: string;
}

export const DraggableTransaction: React.FC<DraggableTransactionProps> = ({
  transactionId,
  amount,
  currency,
  children,
  className = '',
  style,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', transactionId);
    e.dataTransfer.setData('application/json', JSON.stringify({ amount, currency }));
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `
      <div style="padding: 8px 12px; background: white; border: 2px solid #3b82f6; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="font-weight: bold; color: #059669;">${amount.toLocaleString()} ${currency}</div>
        <div style="font-size: 12px; color: #64748b;">Drag to allocate</div>
      </div>
    `;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
};
