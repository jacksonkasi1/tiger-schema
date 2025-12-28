'use client';

import { useHotkeys } from 'react-hotkeys-hook';
import { useStore } from '@/lib/store';

/**
 * Helper to check if target is an editable element
 */
function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
}

/**
 * Hook that provides global keyboard shortcuts for undo/redo functionality.
 *
 * Supports:
 * - Mac: ⌘Z for undo, ⌘⇧Z for redo
 * - Windows/Linux: Ctrl+Z for undo, Ctrl+Y or Ctrl+Shift+Z for redo
 *
 * The shortcuts are disabled when typing in form fields to prevent
 * interfering with normal text editing undo/redo.
 */
export function useUndoRedoShortcuts() {
  // Mac: ⌘Z for undo
  useHotkeys(
    'meta+z',
    (e) => {
      if (isEditableElement(e.target)) return;
      e.preventDefault();
      // Get fresh state at the time of keypress
      const state = useStore.getState();
      if (state.canUndo()) state.undo();
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  );

  // Mac: ⌘⇧Z for redo
  useHotkeys(
    'meta+shift+z',
    (e) => {
      if (isEditableElement(e.target)) return;
      e.preventDefault();
      // Get fresh state at the time of keypress
      const state = useStore.getState();
      if (state.canRedo()) state.redo();
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  );

  // Windows/Linux: Ctrl+Z for undo
  useHotkeys(
    'ctrl+z',
    (e) => {
      if (isEditableElement(e.target)) return;
      e.preventDefault();
      // Get fresh state at the time of keypress
      const state = useStore.getState();
      if (state.canUndo()) state.undo();
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  );

  // Windows/Linux: Ctrl+Y or Ctrl+Shift+Z for redo
  useHotkeys(
    'ctrl+y, ctrl+shift+z',
    (e) => {
      if (isEditableElement(e.target)) return;
      e.preventDefault();
      // Get fresh state at the time of keypress
      const state = useStore.getState();
      if (state.canRedo()) state.redo();
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  );
}

/**
 * Hook that tracks if there are unsaved changes in history
 * (useful for warning before leaving page)
 */
export function useHasUnsavedChanges(): boolean {
  const history = useStore((state) => state.history);
  return history.currentIndex > 0;
}

/**
 * Returns current history stats for debugging or display
 */
export function useHistoryStats() {
  const history = useStore((state) => state.history);

  return {
    totalEntries: history.entries.length,
    currentIndex: history.currentIndex,
    canUndo: history.currentIndex > 0,
    canRedo: history.currentIndex < history.entries.length - 1,
  };
}
