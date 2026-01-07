import React from 'react';
import { Save, X, Loader2 } from 'lucide-react';

interface SaveBarProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
}

export const SaveBar: React.FC<SaveBarProps> = ({
  isDirty,
  isSaving,
  onSave,
  onCancel,
  saveLabel = 'Save Changes'
}) => {
  if (!isDirty) return null;

  return (
    <>
      {/* Desktop - inline */}
      <div className="hidden md:flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg mt-4">
        <div className="flex-1">
          <p className="text-sm text-slate-600">You have unsaved changes</p>
        </div>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? 'Saving...' : saveLabel}
        </button>
      </div>

      {/* Mobile - fixed bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg z-30 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg disabled:opacity-50"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? 'Saving...' : saveLabel}
          </button>
        </div>
      </div>
    </>
  );
};

export default SaveBar;


