'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Column } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  CommandList,
} from '@/components/ui/command';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  GripVertical,
  Key,
  Sparkles,
  Search as SearchIcon,
  Circle,
  MoreVertical,
  Trash2,
  Check,
  ChevronsUpDown,
  Link2,
  X,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

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

type IndexType = 'primary_key' | 'unique_key' | 'index' | 'none';

interface ColumnRowProps {
  tableId: string;
  column: Column;
  columnIndex: number;
  isDragOverlay?: boolean;
}

export function ColumnRow({
  tableId,
  column,
  columnIndex,
  isDragOverlay = false,
}: ColumnRowProps) {
  const { tables, updateColumn, deleteColumn } = useStore();
  const [typeOpen, setTypeOpen] = useState(false);
  const [fkOpen, setFkOpen] = useState(false);

  const table = tables[tableId];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: columnIndex.toString(), disabled: isDragOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getIndexType = (): IndexType => {
    if (column.pk) return 'primary_key';
    if (column.unique) return 'unique_key';
    const indexes = table?.indexes || [];
    const isInIndex = indexes.some((idx) => idx.columns.includes(column.title));
    if (isInIndex) return 'index';
    return 'none';
  };

  const handleIndexTypeChange = (indexType: IndexType) => {
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

  const indexType = getIndexType();

  // Get all tables and columns for FK selector
  const getFkOptions = () => {
    const options: { label: string; value: string }[] = [];
    Object.values(tables).forEach((t) => {
      if (t.title === tableId) return; // Skip self
      t.columns?.forEach((col) => {
        options.push({
          label: `${t.title}.${col.title}`,
          value: `${t.title}.${col.title}`,
        });
      });
    });
    return options;
  };

  const fkOptions = getFkOptions();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-1.5 px-2 py-1 hover:bg-muted/40 transition-all duration-150 ease-out rounded-sm mx-1',
        isDragging && 'opacity-0',
        isDragOverlay && 'shadow-lg bg-background border border-border/60',
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing shrink-0 opacity-40 hover:opacity-100 transition-opacity duration-150"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {/* Index Type Icon */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 transition-all duration-150 hover:bg-muted/60">
            {indexType === 'primary_key' ? (
              <Key className="h-3 w-3 text-amber-500" />
            ) : indexType === 'unique_key' ? (
              <Sparkles className="h-3 w-3 text-indigo-500" />
            ) : indexType === 'index' ? (
              <SearchIcon className="h-3 w-3 text-violet-500" />
            ) : column.fk ? (
              <Link2 className="h-3 w-3 text-emerald-500" />
            ) : (
              <Circle className="h-2 w-2 text-muted-foreground/40" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 p-1.5">
          <DropdownMenuRadioGroup
            value={indexType}
            onValueChange={(value) => handleIndexTypeChange(value as IndexType)}
          >
            <DropdownMenuRadioItem value="primary_key" className="text-sm py-2 px-2 rounded-md">
              <Key className="mr-2.5 h-4 w-4 text-amber-500" />
              Primary key
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="unique_key" className="text-sm py-2 px-2 rounded-md">
              <Sparkles className="mr-2.5 h-4 w-4 text-indigo-500" />
              Unique key
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="index" className="text-sm py-2 px-2 rounded-md">
              <SearchIcon className="mr-2.5 h-4 w-4 text-violet-500" />
              Index
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="none" className="text-sm py-2 px-2 rounded-md">
              <Circle className="mr-2.5 h-4 w-4 text-muted-foreground/60" />
              None
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Column Name */}
      <Input
        value={column.title}
        onChange={(e) =>
          updateColumn(tableId, columnIndex, { title: e.target.value })
        }
        className="h-6 w-[90px] min-w-[70px] text-[12px] font-mono border-transparent hover:border-border/60 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-ring/20 bg-transparent px-1.5"
        placeholder="column"
      />

      {/* Data Type Combobox */}
      <Popover open={typeOpen} onOpenChange={setTypeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={typeOpen}
            className="h-6 w-[85px] justify-between text-[11px] font-mono px-1.5 bg-muted/20 border-border/40 hover:border-border/60 hover:bg-muted/40 transition-all duration-150"
          >
            <span className="truncate text-muted-foreground">
              {column.format || column.type || 'varchar'}
            </span>
            <ChevronsUpDown className="ml-0.5 h-3 w-3 shrink-0 opacity-40" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[220px] p-0 border-border/60 shadow-xl"
          align="end"
        >
          <Command className="bg-popover">
            <CommandInput
              placeholder="Search type..."
              className="h-9 text-xs font-mono border-0 outline-none ring-0 focus:outline-none focus:ring-0"
            />
            <CommandEmpty className="py-4 text-xs text-muted-foreground/60 text-center">
              No type found.
            </CommandEmpty>
            <CommandList className="max-h-[240px] overflow-auto p-1">
              <CommandGroup>
                {POSTGRES_TYPES.map((type) => (
                  <CommandItem
                    key={type}
                    value={type}
                    onSelect={() => {
                      updateColumn(tableId, columnIndex, { format: type });
                      setTypeOpen(false);
                    }}
                    className="text-xs font-mono data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary rounded-md py-2 px-2"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3 w-3 text-primary transition-opacity duration-150',
                        (column.format || column.type) === type
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    {type}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* NULL/NOT NULL Chip - Like DrawSQL */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                updateColumn(tableId, columnIndex, {
                  required: !column.required,
                })
              }
              className={cn(
                'h-6 min-w-[24px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-md border transition-all duration-150 shrink-0',
                column.required
                  ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15'
                  : 'bg-muted/30 text-muted-foreground/50 border-border/40 hover:bg-muted/50 hover:text-muted-foreground/70',
              )}
            >
              {column.required ? 'NN' : 'N'}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>
              {column.required
                ? 'NOT NULL — click to allow NULL'
                : 'Nullable — click to require'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* FK Selector */}
      <Popover open={fkOpen} onOpenChange={setFkOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={column.fk ? 'default' : 'ghost'}
            size="icon"
            className={cn(
              'h-6 w-6 shrink-0 transition-all duration-150',
              column.fk
                ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border border-emerald-500/30 dark:text-emerald-400'
                : 'opacity-40 hover:opacity-100 hover:bg-muted/60',
            )}
          >
            <Link2 className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 border-border/60 shadow-xl" align="end">
          <Command>
            <CommandInput
              placeholder="Search table.column..."
              className="h-9 text-sm"
            />
            <CommandList className="max-h-[240px]">
              <CommandEmpty className="py-4 text-sm text-muted-foreground/60">No columns found.</CommandEmpty>
              <CommandGroup className="p-1">
                {column.fk && (
                  <CommandItem
                    onSelect={() => {
                      updateColumn(tableId, columnIndex, { fk: undefined });
                      setFkOpen(false);
                    }}
                    className="text-destructive py-2 px-2 rounded-md"
                  >
                    <X className="mr-2.5 h-4 w-4" />
                    Remove FK reference
                  </CommandItem>
                )}
                {fkOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      updateColumn(tableId, columnIndex, { fk: option.value });
                      setFkOpen(false);
                    }}
                    className="text-xs font-mono py-2 px-2 rounded-md data-[selected=true]:bg-emerald-500/10 data-[selected=true]:text-emerald-600"
                  >
                    <Check
                      className={cn(
                        'mr-2.5 h-3.5 w-3.5 text-emerald-500 transition-opacity duration-150',
                        column.fk === option.value
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* More Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-40 hover:opacity-100 transition-all duration-150 shrink-0 hover:bg-muted/60"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 p-1.5">
          <DropdownMenuItem
            onClick={() =>
              updateColumn(tableId, columnIndex, {
                required: !column.required,
              })
            }
            className="text-sm py-2 px-2 rounded-md"
          >
            Set {column.required ? 'NULL' : 'NOT NULL'}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1.5" />
          <DropdownMenuItem
            onClick={() => deleteColumn(tableId, columnIndex)}
            className="text-destructive py-2 px-2 rounded-md focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2.5 h-4 w-4" />
            Delete column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
