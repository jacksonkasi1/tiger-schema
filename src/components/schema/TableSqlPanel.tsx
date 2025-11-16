'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { generateCreateTableSQL } from '@/lib/table-sql-generator';
import { parseCreateTableSQL } from '@/lib/table-sql-parser';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface TableSqlPanelProps {
  tableId: string;
}

export function TableSqlPanel({ tableId }: TableSqlPanelProps) {
  const { tables, deleteColumn, addColumn, updateTableComment } = useStore();
  const table = tables[tableId];

  const [sql, setSql] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Generate SQL from table on mount and when table changes (unless user has unsaved changes)
  useEffect(() => {
    if (table && !hasChanges) {
      const generatedSQL = generateCreateTableSQL(table);
      setSql(generatedSQL);
      setError(null);
    }
  }, [table, hasChanges]);

  if (!table) return null;

  const handleSqlChange = (value: string) => {
    setSql(value);
    setHasChanges(true);
    setError(null);
  };

  const handleApplySQL = () => {
    const result = parseCreateTableSQL(sql);

    if ('error' in result) {
      setError(result.error);
      toast.error('SQL Parse Error', {
        description: result.error,
      });
      return;
    }

    // Clear existing columns
    const existingColumns = table.columns || [];
    for (let i = existingColumns.length - 1; i >= 0; i--) {
      deleteColumn(tableId, i);
    }

    // Add new columns from parsed SQL
    result.columns.forEach(column => {
      addColumn(tableId, column);
    });

    // Update table comment if exists
    if (result.comment !== undefined) {
      updateTableComment(tableId, result.comment);
    }

    setError(null);
    setHasChanges(false);

    toast.success('Table Updated', {
      description: 'Table schema has been updated from SQL successfully.',
    });
  };

  const handleResetFromSchema = () => {
    const generatedSQL = generateCreateTableSQL(table);
    setSql(generatedSQL);
    setError(null);
    setHasChanges(false);

    toast.success('SQL Reset', {
      description: 'SQL has been regenerated from the current schema.',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          CREATE TABLE SQL for `{table.title}`
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Edit the SQL and click &quot;Apply SQL&quot; to update the table schema
        </p>
      </div>

      {/* SQL Editor */}
      <div className="flex-1 overflow-hidden p-4">
        <Textarea
          value={sql}
          onChange={(e) => handleSqlChange(e.target.value)}
          className="w-full h-full font-mono text-sm resize-none"
          placeholder="CREATE TABLE ..."
          spellCheck={false}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-red-900 dark:text-red-100">
                Parse Error
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success indicator */}
      {!error && !hasChanges && sql && (
        <div className="mx-4 mb-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700 dark:text-green-300">
              SQL is in sync with the current schema
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex gap-2">
          <Button
            onClick={handleApplySQL}
            disabled={!hasChanges || !sql.trim()}
            className="flex-1"
            size="sm"
          >
            Apply SQL
          </Button>
          <Button
            onClick={handleResetFromSchema}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
