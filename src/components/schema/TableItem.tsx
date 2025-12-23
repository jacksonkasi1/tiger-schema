'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Column } from '@/lib/types';
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
  Menu,
  Plus,
  Trash2,
  Focus,
  Palette,
  Pencil,
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
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 hover:bg-muted/40 transition-all duration-150 ease-out cursor-pointer',
              isExpanded && 'bg-muted/30'
            )}
            onClick={() => toggleTableExpanded(tableId)}
          >
            {/* Drag Handle - Minimal, only visible on hover like DrawSQL */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <Menu className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {/* Color Indicator - Small dot */}
            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
              <PopoverTrigger asChild>
                <button
                  className="shrink-0 hover:scale-125 transition-all duration-150"
                  title="Change color"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="w-3 h-3 rounded-full ring-1 ring-black/10"
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
                          'h-7 w-7 rounded-full transition-all duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 relative',
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
                          <Check className="h-3 w-3 absolute inset-0 m-auto text-white drop-shadow-lg" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Table Name - Primary focus like DrawSQL */}
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
                className="flex-1 h-7 text-sm font-medium px-2 border-border/60"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-sm font-medium text-foreground truncate">
                {table.title}
              </span>
            )}

            {/* Quick Actions - Visible on hover */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Rename - Quick access */}
              <button
                className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:bg-muted/50 transition-all duration-150 text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameValue(table.title);
                  setIsRenaming(true);
                }}
                title="Rename table"
              >
                <Pencil className="h-3 w-3" />
              </button>

              {/* Focus - Quick access */}
              <button
                className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:bg-muted/50 transition-all duration-150 text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFocusTable();
                }}
                title="Focus in canvas"
              >
                <Focus className="h-3 w-3" />
              </button>

              {/* Three-dots Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-6 w-6 flex items-center justify-center rounded shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:bg-muted/50 transition-all duration-150 text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                    title="More actions"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 p-1">
                  <DropdownMenuItem
                    onClick={() => {
                      setRenameValue(table.title);
                      setIsRenaming(true);
                    }}
                    className="text-xs py-1.5 px-2 rounded"
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFocusTable} className="text-xs py-1.5 px-2 rounded">
                    <Focus className="mr-2 h-3.5 w-3.5" />
                    Focus in canvas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowColorPicker(true)} className="text-xs py-1.5 px-2 rounded">
                    <Palette className="mr-2 h-3.5 w-3.5" />
                    Change color
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem className="text-xs py-1.5 px-2 rounded">
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive text-xs py-1.5 px-2 rounded focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <CollapsibleContent>
            <div className="border-t border-border/30 bg-muted/10">
              {/* Columns List */}
              <div className="py-2">
                {table.columns && table.columns.length > 0 ? (
                  <ColumnEditor tableId={tableId} columns={table.columns} />
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground/50">
                    No columns yet
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-2 px-3 pb-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs font-medium border-dashed border-border/50 hover:border-border/80 hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-all duration-150"
                  onClick={handleAddColumn}
                >
                  <Plus className="h-3 w-3 mr-1" />
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
