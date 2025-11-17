'use client';

import { useStore } from '@/lib/store';
import { Column } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Key,
  Sparkles,
  Search as SearchIcon,
  Circle,
  MoreVertical,
  Plus,
  Trash2,
  Focus,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TableCollapsibleProps {
  tableId: string;
}

const POSTGRES_TYPES = [
  'serial',
  'bigserial',
  'bigint',
  'integer',
  'int',
  'smallint',
  'varchar',
  'text',
  'char',
  'boolean',
  'timestamp',
  'timestamptz',
  'date',
  'time',
  'json',
  'jsonb',
  'uuid',
  'numeric',
  'decimal',
  'real',
  'double precision',
  'bytea',
  'enum',
];

const COLORS = [
  '#EC4899', '#A855F7', '#1E40AF', '#3B82F6',
  '#14B8A6', '#06B6D4', '#84CC16', '#22C55E',
  '#EAB308', '#F97316', '#EF4444', '#6B7280',
];

type IndexType = 'primary_key' | 'unique_key' | 'index' | 'none';

export function TableCollapsible({ tableId }: TableCollapsibleProps) {
  const {
    tables,
    expandedTables,
    toggleTableExpanded,
    updateColumn,
    deleteColumn,
    addColumn,
    deleteTable,
    triggerFocusTable,
    updateTableColor,
  } = useStore();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const table = tables[tableId];
  const isExpanded = expandedTables.has(tableId);

  if (!table) return null;

  const handleAddColumn = () => {
    const newColumn: Column = {
      title: 'new_column',
      format: 'varchar',
      type: 'string',
      required: false,
    };
    addColumn(tableId, newColumn);
  };

  const handleFocusTable = () => {
    triggerFocusTable(tableId);
  };

  const getIndexType = (column: Column): IndexType => {
    if (column.pk) return 'primary_key';
    if (column.unique) return 'unique_key';
    const indexes = table.indexes || [];
    const isInIndex = indexes.some((idx) => idx.columns.includes(column.title));
    if (isInIndex) return 'index';
    return 'none';
  };

  const handleIndexTypeChange = (columnIndex: number, indexType: IndexType) => {
    const column = table.columns?.[columnIndex];
    if (!column) return;

    const updates: Partial<Column> = {};
    if (indexType === 'primary_key') {
      updates.pk = true;
      updates.unique = false;
      updates.required = true;
    } else if (indexType === 'unique_key') {
      updates.unique = true;
      updates.pk = false;
    } else {
      updates.pk = false;
      updates.unique = false;
    }
    updateColumn(tableId, columnIndex, updates);
  };

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={() => toggleTableExpanded(tableId)}>
        <div className="group border-b border-border/30 hover:bg-muted/30 transition-colors">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center gap-2 px-3 py-1.5">
              {/* Expand Icon */}
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}

              {/* Color Indicator */}
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: table.color || 'hsl(var(--primary))' }}
              />

              {/* Table Name */}
              <span className="flex-1 text-sm font-medium text-foreground truncate text-left">
                {table.title}
              </span>

              {/* Column Count Badge */}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {table.columns?.length || 0}
              </Badge>

              {/* Actions */}
              <div
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleFocusTable}
                  title="Focus on canvas"
                >
                  <Focus className="h-3.5 w-3.5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleFocusTable}>
                      <Focus className="mr-2 h-3.5 w-3.5" />
                      Focus in canvas
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete table
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t border-border/20 bg-muted/10">
              {/* Columns List */}
              <div className="py-1">
                {table.columns && table.columns.length > 0 ? (
                  table.columns.map((column, index) => (
                    <ColumnRow
                      key={`${column.title}-${index}`}
                      tableId={tableId}
                      column={column}
                      columnIndex={index}
                      indexType={getIndexType(column)}
                      onIndexTypeChange={handleIndexTypeChange}
                      onUpdate={(updates) => updateColumn(tableId, index, updates)}
                      onDelete={() => deleteColumn(tableId, index)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    No columns
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="px-3 pb-2 pt-1 flex items-center gap-2 border-t border-border/20">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      title="Change color"
                    >
                      <div
                        className="h-3.5 w-3.5 rounded-sm border"
                        style={{ backgroundColor: table.color || 'hsl(var(--primary))' }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
                    <div className="grid grid-cols-6 gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          className="h-7 w-7 rounded transition-all hover:scale-110 relative ring-offset-background focus-visible:outline-none focus-visible:ring-2"
                          style={{ backgroundColor: color }}
                          onClick={() => updateTableColor(tableId, color)}
                        >
                          {table.color === color && (
                            <Check className="h-4 w-4 absolute inset-0 m-auto text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={handleAddColumn}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Column
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{table.title}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteTable(tableId);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ColumnRowProps {
  tableId: string;
  column: Column;
  columnIndex: number;
  indexType: IndexType;
  onIndexTypeChange: (columnIndex: number, indexType: IndexType) => void;
  onUpdate: (updates: Partial<Column>) => void;
  onDelete: () => void;
}

function ColumnRow({
  column,
  columnIndex,
  indexType,
  onIndexTypeChange,
  onUpdate,
  onDelete,
}: ColumnRowProps) {
  const [typeOpen, setTypeOpen] = useState(false);

  return (
    <div className="group flex items-center gap-2 px-3 py-1 hover:bg-muted/40 transition-colors border-l-2 border-transparent hover:border-primary/40">
      {/* Drag Handle */}
      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 cursor-grab">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>

      {/* Column Name */}
      <Input
        value={column.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="h-6 flex-1 text-sm border-transparent hover:border-input focus-visible:border-primary bg-transparent px-2"
        placeholder="column_name"
      />

      {/* Data Type Combobox */}
      <Popover open={typeOpen} onOpenChange={setTypeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={typeOpen}
            className="h-6 w-[110px] justify-between text-xs font-mono px-2"
          >
            {column.format || column.type || 'varchar'}
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search type..." className="h-8 text-xs" />
            <CommandEmpty>No type found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-auto">
              {POSTGRES_TYPES.map((type) => (
                <CommandItem
                  key={type}
                  value={type}
                  onSelect={() => {
                    onUpdate({ format: type });
                    setTypeOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      'mr-2 h-3 w-3',
                      (column.format || column.type) === type ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {type}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* NULL Toggle */}
      <Toggle
        size="sm"
        pressed={!column.required}
        onPressedChange={(pressed) => onUpdate({ required: !pressed })}
        className="h-6 w-6 text-[10px] font-bold p-0"
        title={column.required ? 'NOT NULL' : 'NULL'}
      >
        N
      </Toggle>

      {/* Index Type Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            {indexType === 'primary_key' ? (
              <Key className="h-3.5 w-3.5 text-yellow-500" />
            ) : indexType === 'unique_key' ? (
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            ) : indexType === 'index' ? (
              <SearchIcon className="h-3.5 w-3.5 text-purple-500" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={indexType}
            onValueChange={(value) => onIndexTypeChange(columnIndex, value as IndexType)}
          >
            <DropdownMenuRadioItem value="primary_key" className="text-sm">
              <Key className="mr-2 h-3.5 w-3.5 text-yellow-500" />
              Primary key
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="unique_key" className="text-sm">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-blue-500" />
              Unique key
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="index" className="text-sm">
              <SearchIcon className="mr-2 h-3.5 w-3.5 text-purple-500" />
              Index
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="none" className="text-sm">
              <Circle className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              None
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Column */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onDelete} className="text-destructive text-sm">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
