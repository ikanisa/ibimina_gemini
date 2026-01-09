/**
 * Shared Settings Hook
 * Provides common state management for settings pages
 */

import { useState, useCallback, useMemo } from 'react';

export interface UseSettingsOptions<T> {
  initialData: T | null;
  onSave: (data: T) => Promise<T>;
  onLoad?: () => Promise<T>;
  compareFn?: (a: T, b: T) => boolean;
}

export function useSettings<T>({
  initialData,
  onSave,
  onLoad,
  compareFn
}: UseSettingsOptions<T>) {
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initial, setInitial] = useState<T | null>(initialData);
  const [draft, setDraft] = useState<T | null>(initialData);

  const isDirty = useMemo(() => {
    if (!initial || !draft) return false;
    if (compareFn) {
      return !compareFn(initial, draft);
    }
    return JSON.stringify(initial) !== JSON.stringify(draft);
  }, [initial, draft, compareFn]);

  const load = useCallback(async () => {
    if (!onLoad) return;
    setLoading(true);
    setError(null);
    try {
      const data = await onLoad();
      setInitial(data);
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [onLoad]);

  const save = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await onSave(draft);
      setInitial(saved);
      setDraft(saved);
      return saved;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [draft, onSave]);

  const cancel = useCallback(() => {
    if (initial) {
      setDraft(initial);
      setError(null);
    }
  }, [initial]);

  const updateDraft = useCallback((updates: Partial<T>) => {
    setDraft((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return {
    loading,
    saving,
    error,
    initial,
    draft,
    isDirty,
    setDraft,
    updateDraft,
    load,
    save,
    cancel,
    setError
  };
}
