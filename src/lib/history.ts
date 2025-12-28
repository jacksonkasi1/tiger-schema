import { TableState, EnumTypeDefinition } from './types';
import { RelationshipType } from '@/types/flow';

// ============================================================================
// History Types for Undo/Redo Support
// ============================================================================

/**
 * Snapshot of the schema state at a point in time
 */
export interface HistorySnapshot {
  tables: TableState;
  enumTypes: Record<string, EnumTypeDefinition>;
  edgeRelationships: Record<string, RelationshipType>;
}

/**
 * A single entry in the history stack
 *
 * IMPORTANT: Each entry represents the state AFTER an action was performed.
 * The label describes the action that led to this state.
 *
 * Example timeline:
 * - Entry 0: { state: initial, label: "Initial state" }
 * - Entry 1: { state: after_move_A, label: "Move table A" }
 * - Entry 2: { state: after_move_B, label: "Move table B" }
 *
 * Undo from entry 2 → entry 1: restores state after move A (before move B)
 * Redo from entry 1 → entry 2: restores state after move B
 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  label: string; // Human-readable description of the action that created this state
  snapshot: HistorySnapshot;
}

/**
 * The complete history state
 */
export interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number; // Points to current state in entries (-1 means no history)
  maxEntries: number; // Maximum number of history entries to keep (default: 100)
}

/**
 * Serializable version of HistoryState for localStorage
 */
export interface SerializedHistoryState {
  entries: HistoryEntry[];
  currentIndex: number;
  maxEntries: number;
}

// ============================================================================
// History Constants
// ============================================================================

export const DEFAULT_MAX_HISTORY_ENTRIES = 100;
export const HISTORY_STORAGE_KEY = 'schema-history';

// ============================================================================
// History Helper Functions
// ============================================================================

/**
 * Creates the initial empty history state
 */
export function createInitialHistoryState(): HistoryState {
  return {
    entries: [],
    currentIndex: -1,
    maxEntries: DEFAULT_MAX_HISTORY_ENTRIES,
  };
}

/**
 * Creates a deep clone of an object using structuredClone
 * Falls back to JSON parse/stringify if structuredClone is not available
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj);
  }
  // Fallback for older environments
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Creates a new history entry from the current state
 *
 * IMPORTANT: Call this AFTER the action has been performed,
 * so the snapshot contains the resulting state.
 */
export function createHistoryEntry(
  label: string,
  tables: TableState,
  enumTypes: Record<string, EnumTypeDefinition>,
  edgeRelationships: Record<string, RelationshipType>,
): HistoryEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    label,
    snapshot: {
      tables: deepClone(tables),
      enumTypes: deepClone(enumTypes),
      edgeRelationships: deepClone(edgeRelationships),
    },
  };
}

/**
 * Adds a new entry to the history, truncating any "future" entries
 * if we're not at the end of the stack (i.e., after an undo)
 */
export function pushHistoryEntry(
  history: HistoryState,
  entry: HistoryEntry,
): HistoryState {
  // Truncate any "future" entries if we're not at the end
  const entries = history.entries.slice(0, history.currentIndex + 1);
  entries.push(entry);

  // Enforce max entries limit by removing oldest entries
  while (entries.length > history.maxEntries) {
    entries.shift();
  }

  return {
    ...history,
    entries,
    currentIndex: entries.length - 1,
  };
}

/**
 * Checks if undo is available
 * Can undo if we're not at the first entry (index 0)
 */
export function canUndo(history: HistoryState): boolean {
  return history.currentIndex > 0;
}

/**
 * Checks if redo is available
 * Can redo if there are entries after the current one
 */
export function canRedo(history: HistoryState): boolean {
  return history.currentIndex < history.entries.length - 1;
}

/**
 * Gets the label for the action that would be undone
 * This is the label of the CURRENT entry (the action that brought us here)
 */
export function getUndoLabel(history: HistoryState): string | null {
  if (!canUndo(history)) return null;
  // The current entry's label describes what we'd undo
  return history.entries[history.currentIndex].label;
}

/**
 * Gets the label for the action that would be redone
 * This is the label of the NEXT entry
 */
export function getRedoLabel(history: HistoryState): string | null {
  if (!canRedo(history)) return null;
  return history.entries[history.currentIndex + 1].label;
}

/**
 * Serializes history state for localStorage
 * Note: We limit the serialized entries to save space
 */
export function serializeHistory(
  history: HistoryState,
  maxEntriesToSave: number = 50,
): string {
  // Only save the most recent entries to avoid localStorage quota issues
  const startIndex = Math.max(0, history.entries.length - maxEntriesToSave);
  const entriesToSave = history.entries.slice(startIndex);

  // Adjust currentIndex relative to the saved entries
  const adjustedIndex = history.currentIndex - startIndex;

  const serialized: SerializedHistoryState = {
    entries: entriesToSave,
    currentIndex: Math.max(0, adjustedIndex),
    maxEntries: history.maxEntries,
  };

  return JSON.stringify(serialized);
}

/**
 * Deserializes history state from localStorage
 */
export function deserializeHistory(json: string): HistoryState | null {
  try {
    const parsed = JSON.parse(json) as SerializedHistoryState;

    // Validate the structure
    if (
      !Array.isArray(parsed.entries) ||
      typeof parsed.currentIndex !== 'number'
    ) {
      console.warn('[History] Invalid history format in localStorage');
      return null;
    }

    // Validate currentIndex bounds
    const validIndex = Math.max(
      -1,
      Math.min(parsed.currentIndex, parsed.entries.length - 1),
    );

    return {
      entries: parsed.entries,
      currentIndex: validIndex,
      maxEntries: parsed.maxEntries || DEFAULT_MAX_HISTORY_ENTRIES,
    };
  } catch (error) {
    console.error('[History] Error deserializing history:', error);
    return null;
  }
}

/**
 * Compares two snapshots to check if they're meaningfully different
 * Used to prevent duplicate history entries for identical states
 */
export function areSnapshotsDifferent(
  snapshot1: HistorySnapshot,
  snapshot2: HistorySnapshot,
): boolean {
  // Quick check: different number of tables
  const tables1Keys = Object.keys(snapshot1.tables);
  const tables2Keys = Object.keys(snapshot2.tables);

  if (tables1Keys.length !== tables2Keys.length) {
    return true;
  }

  // Check each table
  for (const key of tables1Keys) {
    if (!snapshot2.tables[key]) {
      return true;
    }

    const table1 = snapshot1.tables[key];
    const table2 = snapshot2.tables[key];

    // Check position changes
    if (
      table1.position?.x !== table2.position?.x ||
      table1.position?.y !== table2.position?.y
    ) {
      return true;
    }

    // Check color changes
    if (table1.color !== table2.color) {
      return true;
    }

    // Check title changes
    if (table1.title !== table2.title) {
      return true;
    }

    // Check columns length
    if ((table1.columns?.length || 0) !== (table2.columns?.length || 0)) {
      return true;
    }

    // Deep check columns if lengths match
    if (table1.columns && table2.columns) {
      for (let i = 0; i < table1.columns.length; i++) {
        const col1 = table1.columns[i];
        const col2 = table2.columns[i];

        if (
          col1.title !== col2.title ||
          col1.type !== col2.type ||
          col1.format !== col2.format ||
          col1.fk !== col2.fk ||
          col1.pk !== col2.pk ||
          col1.required !== col2.required
        ) {
          return true;
        }
      }
    }
  }

  // Check enum types
  const enum1Keys = Object.keys(snapshot1.enumTypes);
  const enum2Keys = Object.keys(snapshot2.enumTypes);

  if (enum1Keys.length !== enum2Keys.length) {
    return true;
  }

  for (const key of enum1Keys) {
    const enum1 = snapshot1.enumTypes[key];
    const enum2 = snapshot2.enumTypes[key];

    if (!enum2 || enum1.name !== enum2.name || enum1.schema !== enum2.schema) {
      return true;
    }

    if (JSON.stringify(enum1.values) !== JSON.stringify(enum2.values)) {
      return true;
    }
  }

  // Check edge relationships
  const edge1Keys = Object.keys(snapshot1.edgeRelationships);
  const edge2Keys = Object.keys(snapshot2.edgeRelationships);

  if (edge1Keys.length !== edge2Keys.length) {
    return true;
  }

  for (const key of edge1Keys) {
    if (snapshot1.edgeRelationships[key] !== snapshot2.edgeRelationships[key]) {
      return true;
    }
  }

  return false;
}

/**
 * History action labels - standardized labels for different operations
 */
export const HistoryLabels = {
  // Table operations
  addTable: (name: string) => `Add table: ${name}`,
  deleteTable: (name: string) => `Delete table: ${name}`,
  renameTable: (oldName: string, newName: string) =>
    `Rename table: ${oldName} → ${newName}`,
  moveTable: (name: string) => `Move table: ${name}`,
  moveTables: (count: number) => `Move ${count} tables`,
  changeTableColor: (name: string) => `Change color: ${name}`,
  updateTableComment: (name: string) => `Update comment: ${name}`,

  // Column operations
  addColumn: (table: string, column: string) =>
    `Add column: ${table}.${column}`,
  deleteColumn: (table: string, column: string) =>
    `Delete column: ${table}.${column}`,
  updateColumn: (table: string, column: string) =>
    `Update column: ${table}.${column}`,
  reorderColumns: (table: string) => `Reorder columns in ${table}`,

  // Relationship operations
  updateRelationship: () => `Update relationship`,

  // Enum operations
  createEnum: (name: string) => `Create enum: ${name}`,
  updateEnum: (name: string) => `Update enum: ${name}`,
  deleteEnum: (name: string) => `Delete enum: ${name}`,
  renameEnum: (oldName: string, newName: string) =>
    `Rename enum: ${oldName} → ${newName}`,

  // Bulk operations
  importSQL: () => `Import SQL schema`,
  applySQLChanges: () => `Apply SQL changes`,
  autoArrange: () => `Auto arrange tables`,
  bulkAddTables: (count: number) => `Add ${count} tables`,
  clearSchema: () => `Clear schema`,

  // Initial state
  initialState: () => `Initial state`,
} as const;
