'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Column } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  GripVertical,
  Plus,
  Trash2,
  Focus,
  Palette,
  Pencil,
  Maximize2,
  Copy,
  Check,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ColumnEditor } from './ColumnEditor';
import { cn, getTableHeaderColor } from '@/lib/utils';

const TABLE_COLORS = [
  '#EC4899',
  '#A855F7',
  '#8B5CF6',
  '#6366F1',
  '#3B82F6',
  '#0EA5E9',
  '#06B6D4',
  '#14B8A6',
  '#10B981',
  '#22C55E',
  '#84CC16',
  '#EAB308',
  '#F59E0B',
  '#F97316',
  '#EF4444',
];

interface TableItemProps {
  tableId: string;
}

export function TableItem({ tableId }: TableItemProps) {
  const {
    tables,
    expandedTables,
    toggleTableExpanded,
    addColumn,
    deleteTable,
    triggerFocusTable,
    updateTableName,
    updateTableColor,
  } = useStore();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const table = tables[tableId];
  const isExpanded = expandedTables.has(tableId);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(table?.title || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn('group transition-all duration-150 ease-out', isDragging && 'opacity-50')}
      >
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleTableExpanded(tableId)}
        >
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/30 transition-all duration-150 ease-out border-l-[3px] border-transparent hover:border-primary/30"
            style={{
              backgroundColor: isExpanded
                ? `${table.color || getTableHeaderColor(table.title)}08`
                : undefined,
            }}
          >
            {/* 1) Drag Handle - Far Left */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors duration-150"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Color Indicator */}
            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
              <PopoverTrigger asChild>
                <button
                  className="shrink-0 hover:scale-110 transition-all duration-150 rounded-sm"
                  title="Change color"
                >
                  <div
                    className="w-3 h-3 rounded-sm border border-border/40 shadow-sm"
                    style={{
                      backgroundColor:
                        table.color || getTableHeaderColor(table.title),
                    }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 border-border/60" align="start">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Table Color</p>
                  <div className="grid grid-cols-5 gap-2.5">
                    {TABLE_COLORS.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          'h-8 w-8 rounded-lg transition-all duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 relative shadow-sm',
                          table.color === color &&
                            'ring-2 ring-offset-2 ring-offset-background ring-primary/50',
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          updateTableColor(tableId, color);
                          setShowColorPicker(false);
                        }}
                      >
                        {table.color === color && (
                          <Check className="h-4 w-4 absolute inset-0 m-auto text-white drop-shadow-lg" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* 2) Table Name - Left Aligned, Truncated */}
            {isRenaming ? (
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => {
                  if (renameValue.trim() && renameValue !== table.title) {
                    updateTableName(tableId, renameValue.trim());
                  }
                  setIsRenaming(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (renameValue.trim() && renameValue !== table.title) {
                      updateTableName(tableId, renameValue.trim());
                    }
                    setIsRenaming(false);
                  }
                  if (e.key === 'Escape') {
                    setRenameValue(table.title);
                    setIsRenaming(false);
                  }
                }}
                className="flex-1 h-8 text-sm px-2.5 border-border/60"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 text-sm font-medium text-foreground truncate cursor-pointer hover:text-foreground/80 transition-colors duration-150"
                onClick={() => toggleTableExpanded(tableId)}
              >
                {table.title}
              </span>
            )}

            {/* 3) Column Count Badge - Always Visible */}
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5 h-5 shrink-0 font-normal bg-muted/60 text-muted-foreground border-0"
            >
              {table.columns?.length || 0}
            </Badge>

            {/* Right Icon Group: 4) Rename, 5) Focus, 6) More Actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* 4) Rename Icon (Pencil) */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-40 hover:opacity-100 transition-all duration-150 hover:bg-muted/60"
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameValue(table.title);
                  setIsRenaming(true);
                }}
                title="Rename table"
              >
                <Pencil className="h-3 w-3" />
              </Button>

              {/* 5) Focus/Zoom Icon */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-40 hover:opacity-100 transition-all duration-150 hover:bg-muted/60"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFocusTable();
                }}
                title="Focus table"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>

              {/* 6) 3-Dots Menu - Last Element */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-40 hover:opacity-100 transition-all duration-150 hover:bg-muted/60"
                    onClick={(e) => e.stopPropagation()}
                    title="More actions"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-1.5">
                  <DropdownMenuItem
                    onClick={() => {
                      setRenameValue(table.title);
                      setIsRenaming(true);
                    }}
                    className="py-2 px-2 rounded-md"
                  >
                    <Pencil className="mr-2.5 h-4 w-4" />
                    Rename table
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFocusTable} className="py-2 px-2 rounded-md">
                    <Focus className="mr-2.5 h-4 w-4" />
                    Focus in canvas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowColorPicker(true)} className="py-2 px-2 rounded-md">
                    <Palette className="mr-2.5 h-4 w-4" />
                    Change color
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem className="py-2 px-2 rounded-md">
                    <Copy className="mr-2.5 h-4 w-4" />
                    Duplicate table
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive py-2 px-2 rounded-md focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="mr-2.5 h-4 w-4" />
                    Delete table
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <CollapsibleContent>
            <div
              className="border-t border-border/30"
              style={{
                backgroundColor: `${table.color || getTableHeaderColor(table.title)}03`,
              }}
            >
              {/* Columns List */}
              <div className="py-1.5">
                {table.columns && table.columns.length > 0 ? (
                  <ColumnEditor tableId={tableId} columns={table.columns} />
                ) : (
                  <div className="text-center py-8 text-xs text-muted-foreground/60">
                    No columns yet
                  </div>
                )}
              </div>

              {/* Add Column Button */}
              <div className="px-3 pb-3 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs border-dashed border-border/50 hover:border-border/80 hover:bg-muted/30 transition-all duration-150"
                  onClick={handleAddColumn}
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Add Column
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{table.title}&quot;? This
              action cannot be undone.
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
