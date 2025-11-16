'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Column } from '@/lib/types';
import { ColumnRow } from './ColumnRow';
import { ColumnDetailDialog } from './ColumnDetailDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
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

interface TableGuiPanelProps {
  tableId: string;
}

export function TableGuiPanel({ tableId }: TableGuiPanelProps) {
  const { tables, updateColumn, deleteColumn, addColumn, updateTableComment, deleteTable } =
    useStore();
  const table = tables[tableId];

  const [editingColumn, setEditingColumn] = useState<{ column: Column; index: number } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCommentSection, setShowCommentSection] = useState(!!table?.comment);

  if (!table) return null;

  const handleAddColumn = () => {
    const newColumn: Column = {
      title: 'new_column',
      format: 'uuid',
      type: 'string',
      required: false,
      pk: false,
    };
    addColumn(tableId, newColumn);
  };

  const handleDeleteTable = () => {
    deleteTable(tableId);
    setShowDeleteDialog(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Columns Section */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Columns ({table.columns?.length || 0})
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddColumn}
            className="h-7 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Column
          </Button>
        </div>

        <div className="space-y-2">
          {table.columns?.map((column, index) => (
            <ColumnRow
              key={`${column.title}-${index}`}
              column={column}
              onUpdate={(updates) => updateColumn(tableId, index, updates)}
              onEditDetails={() => setEditingColumn({ column, index })}
              onDelete={() => deleteColumn(tableId, index)}
            />
          ))}

          {(!table.columns || table.columns.length === 0) && (
            <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
              No columns yet. Click &quot;Add Column&quot; to get started.
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Table Actions Section */}
      <div className="px-4 py-3 space-y-3 bg-slate-50 dark:bg-slate-900/50">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Table Actions
        </h3>

        {/* Comment Section */}
        {showCommentSection ? (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Table Comment
            </label>
            <Textarea
              value={table.comment || ''}
              onChange={(e) => updateTableComment(tableId, e.target.value)}
              placeholder="Add a comment or description for this table..."
              rows={3}
              className="text-sm"
            />
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCommentSection(true)}
            className="w-full justify-start text-xs"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-2" />
            Add Comment
          </Button>
        )}

        {/* Delete Table */}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          className="w-full justify-start text-xs"
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Delete Table
        </Button>
      </div>

      {/* Column Detail Dialog */}
      {editingColumn && (
        <ColumnDetailDialog
          column={editingColumn.column}
          open={!!editingColumn}
          onOpenChange={(open) => !open && setEditingColumn(null)}
          onSave={(updates) => {
            if (editingColumn) {
              updateColumn(tableId, editingColumn.index, updates);
              setEditingColumn(null);
            }
          }}
        />
      )}

      {/* Delete Table Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the table &quot;{table.title}&quot;? This action cannot be
              undone and will also remove all relationships.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
