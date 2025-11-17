'use client';

import { useStore } from '@/lib/store';
import { ColumnRow } from './ColumnRow';
import { Column } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Focus, MoreVertical, Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useState } from 'react';

interface TableCardProps {
  tableId: string;
}

export function TableCard({ tableId }: TableCardProps) {
  const {
    tables,
    expandedTables,
    toggleTableExpanded,
    updateColumn,
    deleteColumn,
    addColumn,
    deleteTable,
    triggerFocusTable,
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

  return (
    <div className="border-b border-border/30">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted/30 transition-colors group"
        onClick={() => toggleTableExpanded(tableId)}
      >
        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}

        {/* Color Indicator */}
        <div
          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
          style={{ backgroundColor: table.color || 'hsl(var(--primary))' }}
        />

        {/* Table Name */}
        <span className="flex-1 text-xs font-medium text-foreground truncate">
          {table.title}
        </span>

        {/* Column Count Badge */}
        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded">
          {table.columns?.length || 0}
        </span>

        {/* Actions - visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={handleFocusTable}
            title="Focus on canvas"
          >
            <Focus className="h-3 w-3" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleFocusTable}>
                <Focus className="mr-2 h-3 w-3" />
                Focus in canvas
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border/20">
          {/* Columns Header */}
          <div className="flex items-center justify-between px-2 py-1 bg-muted/20">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Columns
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] px-1.5"
              onClick={handleAddColumn}
            >
              <Plus className="h-2.5 w-2.5 mr-0.5" />
              Add
            </Button>
          </div>

          {/* Columns List */}
          {table.columns && table.columns.length > 0 ? (
            table.columns.map((column, index) => (
              <ColumnRow
                key={`${column.title}-${index}`}
                column={column}
                onUpdate={(updates) => updateColumn(tableId, index, updates)}
                onDelete={() => deleteColumn(tableId, index)}
              />
            ))
          ) : (
            <div className="text-center py-3 text-[10px] text-muted-foreground">
              No columns. Click &quot;Add&quot; to create one.
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{table.title}&quot;? This action cannot be undone.
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
    </div>
  );
}
