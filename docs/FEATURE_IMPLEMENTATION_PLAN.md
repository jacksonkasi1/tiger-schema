# Feature Implementation Plan

## Overview

This document outlines the implementation plan for four major features:
1. **Postgres Enum Support** (including multi-value enum columns) ✅ **COMPLETED**
2. **Global Undo/Redo** (Figma-like history system)
3. **SQL Editor Syntax Highlighting**
4. **SQL Suggestions/Autocomplete**

---

## Current Architecture Summary

### State Management
- **Zustand store** (`src/lib/store.ts`) manages all application state
- Tables stored as `TableState` (`Record<string, Table>`)
- Enum types stored as `enumTypes: Record<string, EnumTypeDefinition>`
- Debounced localStorage persistence

### Data Types (from `src/lib/types.ts`)
```typescript
interface Column {
  title: string;
  format: string;
  type: string;
  default?: any;
  required?: boolean;
  pk?: boolean;
  fk?: string;
  unique?: boolean;
  enumValues?: string[];      // Values for enum types
  enumTypeName?: string;      // Name of the enum type
  comment?: string;
}

interface EnumTypeDefinition {
  name: string;
  schema?: string;
  values: string[];
}
```

### SQL Generation/Parsing
- `src/lib/sql-exporter.ts` - Generates SQL from tables
- `src/lib/sql-parser.ts` - Parses SQL to tables
- `src/lib/schema-sql.ts` - Higher-level schema SQL utilities

### UI Components
- `SchemaSidebarSql.tsx` - SQL editor panel (left sidebar in SQL mode)
- `SchemaSidebarGui.tsx` - GUI table list (left sidebar in GUI mode)
- `ColumnRow.tsx` - Column editor row in sidebar
- `ModernTableNode.tsx` - Table card on React Flow canvas
- `Helper.tsx` - Toolbar with action buttons

---

## Feature 1: Postgres Enum Support

### Data Model Changes

#### Current State
- `Column.enumValues` and `Column.enumTypeName` already exist
- `EnumTypeDefinition` type exists
- Store has `enumTypes: Record<string, EnumTypeDefinition>`

#### Required Changes

**1. Support Array Enum Columns**

Add to `Column` type in `src/lib/types.ts`:
```typescript
interface Column {
  // ... existing fields
  isArray?: boolean;          // NEW: true for array columns (e.g., status[])
}
```

**2. Enum Type Key Format**
Use `schema.enumName` as key (e.g., `public.appointment_status`).

### New Components

#### 1. `EnumValuesPopover.tsx`
Location: `src/components/schema/EnumValuesPopover.tsx`

**Purpose**: Hover popover showing enum values for a column.

```typescript
interface EnumValuesPopoverProps {
  enumTypeName: string;
  enumValues: string[];
  trigger: React.ReactNode;
}
```

**Behavior**:
- Show on hover (using HoverCard or Popover with hover trigger)
- Title: `Enum: <enum_name>`
- Scrollable list of values (max-height with scroll)
- Show first ~8 values + "+N more" badge if > 8
- Optional: search input when values > 10

#### 2. `EnumEditorPopover.tsx`
Location: `src/components/schema/EnumEditorPopover.tsx`

**Purpose**: Edit enum values via popover anchored to edit icon.

```typescript
interface EnumEditorPopoverProps {
  enumTypeName: string;
  currentValues: string[];
  onSave: (newValues: string[]) => void;
  onCancel: () => void;
}
```

**UI Structure**:
```
┌─────────────────────────────────┐
│ Edit Enum: appointment_status   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ pending, confirmed, cancel… │ │  <- Textarea (comma-separated)
│ └─────────────────────────────┘ │
│                                 │
│ Preview:                        │
│ [pending] [confirmed] [cancel…] │  <- Live chip preview
│                                 │
│ ⚠️ 2 duplicates removed         │  <- Validation message
│                                 │
│ [Cancel]            [Save]      │
└─────────────────────────────────┘
```

**Validation Logic**:
- Trim whitespace from each value
- Remove empty strings
- Remove duplicates (case-insensitive comparison)
- Show warning if duplicates were found

### Store Actions

Add to `src/lib/store.ts`:

```typescript
interface AppState {
  // ... existing

  // Enum actions
  updateEnumType: (enumName: string, values: string[]) => void;
  renameEnumType: (oldName: string, newName: string) => void;
  deleteEnumType: (enumName: string) => void;
  createEnumType: (name: string, schema: string, values: string[]) => void;
}
```

**Implementation Notes**:
- `updateEnumType` must also update all columns using that enum
- Changes should trigger re-render of:
  - Hover popovers
  - SQL generation
  - Any column editors showing enum info

### UI Integration Points

#### 1. In `ColumnRow.tsx`
When column type is enum:
- Wrap the type display with `EnumValuesPopover`
- Add small edit (pencil) icon button
- On edit click: open `EnumEditorPopover`

```tsx
{column.enumTypeName && (
  <>
    <EnumValuesPopover
      enumTypeName={column.enumTypeName}
      enumValues={column.enumValues || []}
      trigger={
        <span className="cursor-help">
          {column.enumTypeName}{column.isArray ? '[]' : ''}
        </span>
      }
    />
    <Button variant="ghost" size="icon" onClick={() => setEnumEditorOpen(true)}>
      <Pencil className="h-3 w-3" />
    </Button>
  </>
)}
```

#### 2. In `ModernTableNode.tsx`
Add hover card for enum columns showing values.

#### 3. In Type Selector (`ColumnRow.tsx` popover)
When user selects "enum" type:
- Show existing enum types to choose from
- Option to create new enum type inline

### SQL Generation Updates

Update `src/lib/sql-exporter.ts`:

```typescript
// For array enum columns
if (col.format === 'enum' && col.enumTypeName) {
  const arraySuffix = col.isArray ? '[]' : '';
  sql += ` "${col.enumTypeName}"${arraySuffix}`;
}
```

Ensure `CREATE TYPE` statements come before tables that reference them.

### SQL Parsing Updates

Update `src/lib/sql-parser.ts`:

1. Parse array syntax: `status appointment_status[]`
2. Set `isArray: true` on column when `[]` suffix detected
3. Continue extracting enum type name and values

---

## Feature 2: Global Undo/Redo

### Architecture Decision: **Immutable Snapshots with Diffing**

**Rationale**:
- Simpler to implement than command pattern
- Works naturally with Zustand's immutable updates
- Easy to serialize/restore state
- Command pattern requires mapping every action to undo/redo pairs

### Data Structures

```typescript
// src/lib/history.ts

interface HistoryEntry {
  id: string;
  timestamp: number;
  label: string;                    // e.g., "Rename column", "Applied SQL changes"
  snapshot: HistorySnapshot;
}

interface HistorySnapshot {
  tables: TableState;
  enumTypes: Record<string, EnumTypeDefinition>;
  edgeRelationships: Record<string, EdgeRelationship>;
  // Note: positions included in tables
}

interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;             // Points to current state in entries
  maxEntries: number;               // Default: 100
}
```

### Store Integration

Add to `src/lib/store.ts`:

```typescript
interface AppState {
  // ... existing

  // History state
  history: HistoryState;

  // History actions
  pushHistory: (label: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getUndoLabel: () => string | null;
  getRedoLabel: () => string | null;
  clearHistory: () => void;
}
```

### Implementation

#### `pushHistory(label: string)`
```typescript
pushHistory: (label) => {
  const state = get();
  const snapshot: HistorySnapshot = {
    tables: structuredClone(state.tables),
    enumTypes: structuredClone(state.enumTypes),
    edgeRelationships: structuredClone(state.edgeRelationships),
  };

  const newEntry: HistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    label,
    snapshot,
  };

  set((state) => {
    const { history } = state;
    // Truncate any "future" entries if we're not at the end
    const entries = history.entries.slice(0, history.currentIndex + 1);
    entries.push(newEntry);

    // Enforce max entries limit
    if (entries.length > history.maxEntries) {
      entries.shift();
    }

    return {
      history: {
        ...history,
        entries,
        currentIndex: entries.length - 1,
      },
    };
  });
};
```

#### `undo()`
```typescript
undo: () => {
  const { history } = get();
  if (history.currentIndex <= 0) return;

  const prevEntry = history.entries[history.currentIndex - 1];

  set({
    tables: structuredClone(prevEntry.snapshot.tables),
    enumTypes: structuredClone(prevEntry.snapshot.enumTypes),
    edgeRelationships: structuredClone(prevEntry.snapshot.edgeRelationships),
    history: {
      ...history,
      currentIndex: history.currentIndex - 1,
    },
  });

  // Trigger save
  get().saveToLocalStorage();
};
```

### Actions That Push History

Every mutating action should call `pushHistory` with appropriate label:

| Action | Label |
|--------|-------|
| `addTable` | "Add table: {name}" |
| `deleteTable` | "Delete table: {name}" |
| `updateTableName` | "Rename table: {old} → {new}" |
| `addColumn` | "Add column: {table}.{column}" |
| `deleteColumn` | "Delete column: {table}.{column}" |
| `updateColumn` | "Update column: {table}.{column}" |
| `reorderColumns` | "Reorder columns in {table}" |
| `updateTablePosition` | "Move table: {name}" |
| `updateTableColor` | "Change color: {table}" |
| `setEdgeRelationship` | "Update relationship" |
| `updateEnumType` | "Update enum: {name}" |
| SQL Apply | "Applied SQL changes" |

**Optimization**: Batch rapid position updates:
- Don't push history on every `mousemove` during drag
- Push once on `mouseup` (drag end)

### UI Components

#### 1. `UndoRedoButtons.tsx`
Location: `src/components/schema/UndoRedoButtons.tsx`

```tsx
export function UndoRedoButtons() {
  const { undo, redo, canUndo, canRedo, getUndoLabel, getRedoLabel } = useStore();

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo()}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {canUndo() ? `Undo: ${getUndoLabel()}` : 'Nothing to undo'}
          <Kbd>⌘Z</Kbd>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo()}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {canRedo() ? `Redo: ${getRedoLabel()}` : 'Nothing to redo'}
          <Kbd>⌘⇧Z</Kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
```

#### 2. Keyboard Shortcuts

Use `react-hotkeys-hook` (already installed):

```tsx
// In a top-level component or dedicated hook
import { useHotkeys } from 'react-hotkeys-hook';

export function useUndoRedoShortcuts() {
  const { undo, redo, canUndo, canRedo } = useStore();

  // Mac: ⌘Z for undo
  useHotkeys('meta+z', (e) => {
    e.preventDefault();
    if (canUndo()) undo();
  }, { enableOnFormTags: false });

  // Mac: ⌘⇧Z for redo
  useHotkeys('meta+shift+z', (e) => {
    e.preventDefault();
    if (canRedo()) redo();
  }, { enableOnFormTags: false });

  // Windows/Linux: Ctrl+Z / Ctrl+Y
  useHotkeys('ctrl+z', (e) => {
    e.preventDefault();
    if (canUndo()) undo();
  }, { enableOnFormTags: false });

  useHotkeys('ctrl+y, ctrl+shift+z', (e) => {
    e.preventDefault();
    if (canRedo()) redo();
  }, { enableOnFormTags: false });
}
```

### Toolbar Integration

Add `UndoRedoButtons` to `Helper.tsx`:

```tsx
{isToolbarExpanded && (
  <>
    <UndoRedoButtons />  {/* NEW */}
    <Button ... />
    {/* ... rest of buttons */}
  </>
)}
```

---

## Feature 3: SQL Editor Syntax Highlighting

### Library Choice: **highlight.js** (already installed)

`highlight.js` is already in `package.json` - use it directly.

### Implementation Approach

**Option A: Overlay Approach** (Recommended)
- Keep existing `<Textarea>` for input
- Overlay a `<pre><code>` with highlighted HTML
- User types in textarea, highlight.js renders the visual

**Option B: CodeMirror/Monaco**
- More complex but better experience
- Requires additional dependencies
- Consider for future enhancement

### Component: `SQLEditor.tsx`
Location: `src/components/schema/SQLEditor.tsx`

```tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';
import 'highlight.js/styles/github-dark.css';  // or appropriate theme

hljs.registerLanguage('sql', sql);

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SQLEditor({ value, onChange, placeholder, className }: SQLEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const [highlightedHTML, setHighlightedHTML] = useState('');

  useEffect(() => {
    // Highlight the SQL
    const highlighted = hljs.highlight(value || '', { language: 'sql' }).value;
    setHighlightedHTML(highlighted);
  }, [value]);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div className={cn('relative font-mono text-sm', className)}>
      {/* Highlighted overlay */}
      <pre
        ref={highlightRef}
        className="absolute inset-0 overflow-auto pointer-events-none p-4 m-0"
        aria-hidden="true"
      >
        <code
          className="hljs language-sql"
          dangerouslySetInnerHTML={{ __html: highlightedHTML || placeholder || '' }}
        />
      </pre>

      {/* Actual textarea (transparent text) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className={cn(
          'w-full h-full resize-none p-4 bg-transparent',
          'text-transparent caret-foreground',  // Hide text but show caret
          'focus:outline-none'
        )}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}
```

### Theme Support

Create CSS file: `src/styles/sql-highlight.css`

```css
/* Light theme */
.hljs {
  background: transparent;
}

.hljs-keyword {
  color: #0550ae;
  font-weight: 600;
}

.hljs-string {
  color: #0a3069;
}

.hljs-type {
  color: #8250df;
}

.hljs-comment {
  color: #6e7781;
  font-style: italic;
}

/* Dark theme */
.dark .hljs-keyword {
  color: #ff7b72;
}

.dark .hljs-string {
  color: #a5d6ff;
}

.dark .hljs-type {
  color: #d2a8ff;
}

.dark .hljs-comment {
  color: #8b949e;
}
```

### Integration

Replace `<Textarea>` in `SchemaSidebarSql.tsx` with `<SQLEditor>`:

```tsx
// Before
<Textarea
  value={sql}
  onChange={(e) => setSql(e.target.value)}
  ...
/>

// After
<SQLEditor
  value={sql}
  onChange={setSql}
  placeholder="CREATE TABLE ..."
  className="flex-1"
/>
```

---

## Feature 4: SQL Suggestions/Autocomplete

### Implementation Approach

Use `cmdk` (already installed) for the suggestions dropdown, integrated with the SQL editor.

### Data Sources for Suggestions

```typescript
interface SQLSuggestion {
  label: string;
  type: 'keyword' | 'table' | 'column' | 'enum' | 'function' | 'type';
  detail?: string;          // e.g., "users" for columns shows table name
  insertText: string;
}
```

#### 1. SQL Keywords
```typescript
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE',
  'CREATE', 'TABLE', 'ALTER', 'DROP', 'ADD', 'COLUMN', 'CONSTRAINT',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'INDEX', 'ON',
  'NOT', 'NULL', 'DEFAULT', 'CASCADE', 'SET', 'AND', 'OR', 'IN',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ORDER', 'BY', 'ASC', 'DESC',
  'LIMIT', 'OFFSET', 'GROUP', 'HAVING', 'AS', 'DISTINCT', 'COUNT', 'SUM',
  'AVG', 'MIN', 'MAX', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'CAST',
  'TYPE', 'ENUM', 'SERIAL', 'BIGSERIAL', 'BOOLEAN', 'INTEGER', 'VARCHAR',
  'TEXT', 'TIMESTAMP', 'TIMESTAMPTZ', 'DATE', 'UUID', 'JSONB', 'JSON',
];
```

#### 2. Table Names (from schema)
```typescript
const getTableSuggestions = (tables: TableState): SQLSuggestion[] => {
  return Object.keys(tables).map(tableName => ({
    label: tableName,
    type: 'table',
    detail: `${tables[tableName].columns?.length || 0} columns`,
    insertText: `"${tableName}"`,
  }));
};
```

#### 3. Column Names (from schema)
```typescript
const getColumnSuggestions = (tables: TableState): SQLSuggestion[] => {
  const suggestions: SQLSuggestion[] = [];
  Object.entries(tables).forEach(([tableName, table]) => {
    table.columns?.forEach(col => {
      suggestions.push({
        label: col.title,
        type: 'column',
        detail: `${tableName}.${col.title} (${col.format})`,
        insertText: `"${col.title}"`,
      });
    });
  });
  return suggestions;
};
```

#### 4. Enum Types & Values
```typescript
const getEnumSuggestions = (enumTypes: Record<string, EnumTypeDefinition>): SQLSuggestion[] => {
  const suggestions: SQLSuggestion[] = [];
  Object.entries(enumTypes).forEach(([key, enumDef]) => {
    // Enum type name
    suggestions.push({
      label: enumDef.name,
      type: 'enum',
      detail: `Enum (${enumDef.values.length} values)`,
      insertText: `"${enumDef.name}"`,
    });
    // Enum values
    enumDef.values.forEach(value => {
      suggestions.push({
        label: `'${value}'`,
        type: 'enum',
        detail: `Value of ${enumDef.name}`,
        insertText: `'${value}'`,
      });
    });
  });
  return suggestions;
};
```

### Component: `SQLAutocomplete.tsx`
Location: `src/components/schema/SQLAutocomplete.tsx`

```tsx
interface SQLAutocompleteProps {
  suggestions: SQLSuggestion[];
  position: { top: number; left: number };
  onSelect: (suggestion: SQLSuggestion) => void;
  onClose: () => void;
  selectedIndex: number;
}

export function SQLAutocomplete({
  suggestions,
  position,
  onSelect,
  onClose,
  selectedIndex,
}: SQLAutocompleteProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      className="fixed z-50 bg-popover border border-border rounded-md shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, minWidth: '200px', maxWidth: '400px' }}
    >
      <Command className="bg-transparent">
        <CommandList className="max-h-[200px] overflow-auto">
          <CommandGroup>
            {suggestions.map((suggestion, index) => (
              <CommandItem
                key={`${suggestion.type}-${suggestion.label}`}
                onSelect={() => onSelect(suggestion)}
                className={cn(
                  'flex items-center justify-between px-2 py-1.5',
                  index === selectedIndex && 'bg-accent'
                )}
              >
                <div className="flex items-center gap-2">
                  <SuggestionIcon type={suggestion.type} />
                  <span className="font-mono text-sm">{suggestion.label}</span>
                </div>
                {suggestion.detail && (
                  <span className="text-xs text-muted-foreground truncate ml-2">
                    {suggestion.detail}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

function SuggestionIcon({ type }: { type: SQLSuggestion['type'] }) {
  switch (type) {
    case 'keyword': return <span className="text-blue-500 text-xs font-bold">K</span>;
    case 'table': return <TableIcon className="h-3 w-3 text-green-500" />;
    case 'column': return <ColumnsIcon className="h-3 w-3 text-yellow-500" />;
    case 'enum': return <ListIcon className="h-3 w-3 text-purple-500" />;
    case 'function': return <FunctionIcon className="h-3 w-3 text-orange-500" />;
    case 'type': return <TypeIcon className="h-3 w-3 text-cyan-500" />;
  }
}
```

### Integration with SQLEditor

Enhanced `SQLEditor.tsx`:

```tsx
export function SQLEditor({ value, onChange, ... }: SQLEditorProps) {
  const { tables, enumTypes } = useStore();
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [suggestions, setSuggestions] = useState<SQLSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Get current word being typed
  const getCurrentWord = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return '';

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const match = textBeforeCursor.match(/[\w"']+$/);
    return match ? match[0] : '';
  }, [value]);

  // Filter suggestions based on current word
  const filterSuggestions = useCallback((word: string) => {
    if (!word || word.length < 1) {
      setShowAutocomplete(false);
      return;
    }

    const allSuggestions = [
      ...SQL_KEYWORDS.map(kw => ({ label: kw, type: 'keyword' as const, insertText: kw })),
      ...getTableSuggestions(tables),
      ...getColumnSuggestions(tables),
      ...getEnumSuggestions(enumTypes),
    ];

    const filtered = allSuggestions.filter(s =>
      s.label.toLowerCase().startsWith(word.toLowerCase())
    ).slice(0, 10);  // Limit to 10 suggestions

    setSuggestions(filtered);
    setShowAutocomplete(filtered.length > 0);
    setSelectedIndex(0);
  }, [tables, enumTypes]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete) {
      // Trigger autocomplete on Ctrl+Space / Cmd+Space
      if ((e.metaKey || e.ctrlKey) && e.key === ' ') {
        e.preventDefault();
        filterSuggestions(getCurrentWord());
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          insertSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowAutocomplete(false);
        break;
    }
  };

  const insertSuggestion = (suggestion: SQLSuggestion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const currentWord = getCurrentWord();
    const newValue =
      value.slice(0, cursorPos - currentWord.length) +
      suggestion.insertText +
      value.slice(cursorPos);

    onChange(newValue);
    setShowAutocomplete(false);

    // Move cursor after inserted text
    requestAnimationFrame(() => {
      const newPos = cursorPos - currentWord.length + suggestion.insertText.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  // ...rest of component
}
```

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/components/schema/EnumValuesPopover.tsx` | Hover popover for enum values |
| `src/components/schema/EnumEditorPopover.tsx` | Edit enum values popover |
| `src/components/schema/UndoRedoButtons.tsx` | Undo/redo toolbar buttons |
| `src/components/schema/SQLEditor.tsx` | SQL editor with highlighting |
| `src/components/schema/SQLAutocomplete.tsx` | Autocomplete dropdown |
| `src/lib/history.ts` | History types and utilities |
| `src/hooks/use-undo-redo.ts` | Keyboard shortcut hook |
| `src/styles/sql-highlight.css` | Syntax highlighting styles |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Add `isArray` to Column |
| `src/lib/store.ts` | Add history state, enum actions, undo/redo |
| `src/lib/sql-parser.ts` | Parse array enum syntax |
| `src/lib/sql-exporter.ts` | Generate array enum syntax |
| `src/lib/schema-sql.ts` | Handle array enums in generation |
| `src/components/schema/ColumnRow.tsx` | Add enum popover & editor |
| `src/components/schema/SchemaSidebarSql.tsx` | Use new SQLEditor |
| `src/components/flow/ModernTableNode.tsx` | Add enum hover popover |
| `src/components/Helper.tsx` | Add UndoRedoButtons |
| `src/app/layout.tsx` or root | Add undo/redo keyboard hooks |

---

## Events/Actions for Undo/Redo Tracking

### Table Operations
- `addTable` → "Add table: {name}"
- `deleteTable` → "Delete table: {name}"
- `updateTableName` → "Rename table: {old} → {new}"
- `updateTableColor` → "Change color: {table}"
- `updateTableComment` → "Update comment: {table}"
- `updateTablePosition` → "Move table: {name}" (batched on drag end)
- `reorderTables` → "Reorder tables"

### Column Operations
- `addColumn` → "Add column: {table}.{column}"
- `deleteColumn` → "Delete column: {table}.{column}"
- `updateColumn` → "Update column: {table}.{column}"
- `reorderColumns` → "Reorder columns in {table}"

### Relationship Operations
- `setEdgeRelationship` → "Update relationship: {source} → {target}"

### Enum Operations
- `createEnumType` → "Create enum: {name}"
- `updateEnumType` → "Update enum: {name}"
- `renameEnumType` → "Rename enum: {old} → {new}"
- `deleteEnumType` → "Delete enum: {name}"

### Bulk Operations
- SQL Apply → "Applied SQL changes"
- Import → "Import schema"
- `updateTablesFromAI` → "AI schema update"

---

## Edge Cases & Handling

### Enum Support

| Edge Case | Handling |
|-----------|----------|
| Empty enum values | Prevent save, show validation error |
| Duplicate values | Auto-remove duplicates, show warning |
| Special characters in values | Allow, properly escape in SQL |
| Renaming enum used by columns | Update all referencing columns |
| Deleting enum used by columns | Prompt user or prevent deletion |
| Very long enum lists | Paginate popover, add search |

### Undo/Redo

| Edge Case | Handling |
|-----------|----------|
| Rapid position updates (drag) | Batch into single history entry on drag end |
| History overflow | Remove oldest entries when exceeding limit |
| Undo after localStorage restore | Preserve history in localStorage |
| Concurrent edits | N/A (single user) |
| Large state snapshots | Use `structuredClone` for efficiency |

### SQL Editor

| Edge Case | Handling |
|-----------|----------|
| Very large schemas | Virtualize rendering if needed |
| Invalid SQL syntax | Highlight still works, parse errors on Apply |
| Copy/paste | Works normally in textarea |
| Dark/light theme | CSS variables for both themes |

### Autocomplete

| Edge Case | Handling |
|-----------|----------|
| No matches | Hide dropdown |
| Very long lists | Limit to 10-15 suggestions |
| Case sensitivity | Case-insensitive matching |
| Typing inside quotes | Context-aware (suggest enum values) |
| Cursor at start of file | Show all keywords |

---

## Testing Checklist

### Enum Support ✅ COMPLETED
- [x] Hover on enum column shows values popover
- [x] Popover shows "+N more" for long lists
- [x] Edit icon opens editor popover
- [x] Comma-separated input parses correctly
- [x] Live preview shows chips
- [x] Duplicates are removed with warning
- [x] Empty values are filtered
- [x] Save updates enum definition
- [x] All columns using enum update
- [x] SQL generates correct `CREATE TYPE`
- [x] Array enums generate `type[]` syntax
- [x] SQL parsing handles array enums
- [x] Enum type selector when choosing 'enum' type
- [x] Create new enum type inline

### Undo/Redo ✅ COMPLETED
- [x] ⌘Z triggers undo (Mac)
- [x] ⌘⇧Z triggers redo (Mac)
- [x] Ctrl+Z triggers undo (Win/Linux)
- [x] Ctrl+Y or Ctrl+Shift+Z triggers redo
- [x] Buttons disabled when no history
- [x] Tooltip shows last action label
- [x] All table mutations create history
- [x] All column mutations create history
- [x] SQL Apply creates single history entry
- [ ] Position changes batched on drag end (not needed - positions don't push history)
- [ ] History persists to localStorage (history is session-only by design)
- [x] Max 100 entries enforced

### SQL Highlighting
- [ ] Keywords highlighted (CREATE, TABLE, etc.)
- [ ] Strings highlighted ('value')
- [ ] Types highlighted (VARCHAR, INTEGER)
- [ ] Comments highlighted (--, /* */)
- [ ] Works in light theme
- [ ] Works in dark theme
- [ ] Copy/paste works
- [ ] Scroll syncs between textarea and highlight
- [ ] Large schemas don't lag

### Autocomplete
- [ ] Typing triggers suggestions
- [ ] ⌘Space / Ctrl+Space triggers manually
- [ ] Arrow keys navigate list
- [ ] Enter/Tab selects suggestion
- [ ] Escape closes dropdown
- [ ] Shows SQL keywords
- [ ] Shows table names from schema
- [ ] Shows column names from schema
- [ ] Shows enum types and values
- [ ] Suggestions filter as you type

---

## Implementation Order

### Phase 1: Enum Support ✅ COMPLETED
1. ✅ Add `isArray` to Column type
2. ✅ Create `EnumValuesPopover` - hover popover showing enum values
3. ✅ Create `EnumEditorPopover` - edit enum values with validation
4. ✅ Create `EnumTypeSelectorPopover` - select existing or create new enums
5. ✅ Add enum actions to store (`updateEnumType`, `createEnumType`, `deleteEnumType`, `renameEnumType`, `getEnumType`)
6. ✅ Integrate into `ColumnRow` - type selector with enum support
7. ✅ Update SQL generation/parsing for array enums (`type[]`)
8. ✅ Add enum popover to `ModernTableNode`
9. ✅ Update `TableCollapsible` with enum support

### Phase 2: Foundation for Undo/Redo ✅ COMPLETED
1. ✅ Implement history state in store (`src/lib/history.ts` and store updates)
2. ✅ Add `pushHistory` to existing actions (table, column, enum, relationship operations)
3. ✅ Create `UndoRedoButtons` component (`src/components/UndoRedoButtons.tsx`)
4. ✅ Add keyboard shortcuts (`src/hooks/use-undo-redo.ts` - ⌘Z/Ctrl+Z for undo, ⌘⇧Z/Ctrl+Y for redo)

### Phase 3: SQL Editor (Week 3)
1. Create `SQLEditor` with highlight.js
2. Add theme-aware CSS
3. Replace textarea in `SchemaSidebarSql`
4. Create `SQLAutocomplete` component
5. Integrate autocomplete into editor
6. Add schema-based suggestions

### Phase 4: Polish & Testing (Week 4)
1. Comprehensive testing
2. Performance optimization
3. Edge case handling
4. Documentation updates
5. Type checking (`npm run typecheck`)
6. Build verification (`npm run build`)

---

## Completed Implementation Details

### Feature 1: Postgres Enum Support ✅

**Files Created:**
- `src/components/schema/EnumValuesPopover.tsx` - Hover popover showing enum values with search
- `src/components/schema/EnumEditorPopover.tsx` - Edit enum values with validation
- `src/components/schema/EnumTypeSelectorPopover.tsx` - Select existing or create new enum types

**Files Modified:**
- `src/lib/types.ts` - Added `isArray?: boolean` to Column interface
- `src/lib/store.ts` - Added enum management actions:
  - `updateEnumType(enumKey, values)` - Update enum values, syncs to all columns
  - `createEnumType(name, schema, values)` - Create new enum type
  - `deleteEnumType(enumKey)` - Delete enum, revert columns to varchar
  - `renameEnumType(oldKey, newName)` - Rename enum, update all references
  - `getEnumType(enumKey)` - Get enum definition
- `src/lib/sql-parser.ts` - Parse array enum syntax (`type[]`)
- `src/lib/sql-exporter.ts` - Generate array enum syntax
- `src/lib/schema-sql.ts` - Handle array enums in SQL generation
- `src/components/schema/ColumnRow.tsx` - Integrated enum popovers and type selector
- `src/components/schema/TableCollapsible.tsx` - Added enum support
- `src/components/flow/ModernTableNode.tsx` - Show enum values on hover

**Features Implemented:**
- Hover on enum columns shows popover with values (max 8 shown, search for large lists)
- Edit icon next to enum type opens editor popover
- Editor supports comma-separated input with live preview
- Validation: removes duplicates, trims whitespace, requires at least one value
- When selecting "enum" type, shows selector to choose existing or create new
- Array enum support (`type[]`) in both SQL generation and parsing
- Purple icon indicator for enum columns throughout the UI

### Feature 2: Global Undo/Redo ✅

**Files Created:**
- `src/lib/history.ts` - History types, constants, and helper functions
  - `HistorySnapshot`, `HistoryEntry`, `HistoryState` interfaces
  - `createInitialHistoryState()`, `createHistoryEntry()`, `pushHistoryEntry()`
  - `canUndo()`, `canRedo()`, `getUndoLabel()`, `getRedoLabel()` helpers
  - `HistoryLabels` - Standardized labels for all operations
- `src/components/UndoRedoButtons.tsx` - Toolbar buttons with tooltips
  - Undo/Redo buttons with disabled states
  - Tooltips showing action labels and keyboard shortcuts
  - Platform-aware shortcut display (⌘Z vs Ctrl+Z)
- `src/hooks/use-undo-redo.ts` - Keyboard shortcuts hook
  - `useUndoRedoShortcuts()` - Global undo/redo keyboard handlers
  - `useHasUnsavedChanges()` - Track unsaved changes
  - `useHistoryStats()` - Debug/display history info

**Files Modified:**
- `src/lib/store.ts` - Added history state and actions:
  - `history: HistoryState` - History entries and current index
  - `pushHistory(label)` - Push new history entry before mutations
  - `undo()` / `redo()` - Navigate history with state restoration
  - `canUndo()` / `canRedo()` - Check if navigation is available
  - `getUndoLabel()` / `getRedoLabel()` - Get action labels for tooltips
  - `clearHistory()` - Reset history state
  - Added history tracking to all mutating actions:
    - Table: `addTable`, `deleteTable`, `updateTableName`, `updateTableColor`, `updateTableComment`
    - Column: `addColumn`, `updateColumn`, `deleteColumn`, `reorderColumns`
    - Enum: `createEnumType`, `updateEnumType`, `deleteEnumType`, `renameEnumType`
    - Bulk: `setTables` (SQL import), `updateTablesFromAI`, `addTables`
    - Relationships: `setEdgeRelationship`
  - Initial history entry created on localStorage initialization
- `src/components/Helper.tsx` - Integrated `UndoRedoButtons` in toolbar
- `src/components/RootProvider.tsx` - Added `useUndoRedoShortcuts()` hook

**Features Implemented:**
- Immutable snapshot-based history (simpler than command pattern)
- Maximum 100 history entries (oldest removed when exceeded)
- Keyboard shortcuts: ⌘Z/Ctrl+Z (undo), ⌘⇧Z/Ctrl+Y/Ctrl+⇧Z (redo)
- Shortcuts disabled in form fields to not interfere with text editing
- Tooltips show action labels (e.g., "Undo: Add table: users")
- History truncated on new action after undo (no branching)
- `structuredClone` for deep copying snapshots (with JSON fallback)
- History cleared when cache is cleared
- Initial state captured on app load for baseline undo

---

## Performance Considerations

1. **History Snapshots**: Use `structuredClone` instead of JSON.parse/stringify
2. **Highlighting**: Debounce highlighting on rapid typing (100ms)
3. **Autocomplete**: Memoize suggestion lists, filter client-side
4. **Large Schemas**: Consider virtualization for enum value lists > 100 items
5. **Memory**: Limit history to 100 entries, use WeakMap where possible

---

## Dependencies

**Already Installed**:
- `highlight.js` - SQL syntax highlighting
- `cmdk` - Command palette/autocomplete
- `react-hotkeys-hook` - Keyboard shortcuts
- `zustand` - State management
- All shadcn/ui components

**No Additional Dependencies Required**
```
