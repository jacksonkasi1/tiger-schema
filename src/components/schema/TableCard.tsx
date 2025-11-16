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
    <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-800/40 transition-colors group"
        onClick={() => toggleTableExpanded(tableId)}
      >
        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        )}

        {/* Color Indicator */}
        <div
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: table.color || '#3B82F6' }}
        />

        {/* Table Name */}
        <span className="flex-1 text-sm font-medium text-slate-200">
          {table.title}
        </span>

        {/* Column Count Badge */}
        <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-800 rounded">
          {table.columns?.length || 0}
        </span>

        {/* Actions - visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleFocusTable}
            title="Focus on canvas"
          >
            <Focus className="h-3.5 w-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleFocusTable}>
                <Focus className="mr-2 h-3.5 w-3.5" />
                Focus in canvas
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-400"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-700/50">
          {/* Columns Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800/20">
            <span className="text-xs font-medium text-slate-400">
              Columns ({table.columns?.length || 0})
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-blue-400 hover:text-blue-300"
              onClick={handleAddColumn}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>

          {/* Columns List */}
          <div className="px-1">
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
              <div className="text-center py-4 text-xs text-slate-500">
                No columns. Click &quot;Add&quot; to create one.
              </div>
            )}
          </div>
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
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
