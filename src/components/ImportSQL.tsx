'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { parseSQLSchema } from '@/lib/sql-parser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImportSQLProps {
  open: boolean;
  onClose: () => void;
}

export function ImportSQL({ open, onClose }: ImportSQLProps) {
  const { setTables, triggerLayout } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    message: string;
    tableCount?: number;
  } | null>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setParseResult(null);
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const sqlFile = files.find(
      (f) => f.name.endsWith('.sql') || f.type === 'application/sql' || f.type === 'text/plain'
    );

    if (sqlFile) {
      setFile(sqlFile);
      setParseResult(null);
    } else {
      toast.error('Please upload a valid SQL file (.sql)');
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setParseResult(null);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setParseResult(null);

    try {
      const text = await file.text();

      // Parse the SQL schema
      const tables = parseSQLSchema(text);
      const tableCount = Object.keys(tables).length;

      if (tableCount === 0) {
        setParseResult({
          success: false,
          message: 'No tables found in the SQL file. Please check the file format.',
        });
        toast.error('No tables found in SQL file');
        setIsProcessing(false);
        return;
      }

      // Apply to store
      // Convert to the format expected by setTables
      const definition: any = {};
      const paths: any = {};

      Object.entries(tables).forEach(([name, table]) => {
        // Build definition object
        const properties: any = {};
        const required: string[] = [];

        table.columns?.forEach((col) => {
          properties[col.title] = {
            type: col.type,
            format: col.format,
            default: col.default,
            description: col.pk ? '<pk/>' : col.fk ? `\`${col.fk}\`` : undefined,
          };

          if (col.required) {
            required.push(col.title);
          }
        });

        definition[name] = {
          type: 'object',
          properties,
          required: required.length > 0 ? required : undefined,
        };

        // Set up paths for views
        if (table.is_view) {
          paths[`/${name}`] = { get: {} };
        }
      });

      setTables(definition, paths);

      // Auto-arrange after import
      setTimeout(() => {
        triggerLayout();
      }, 100);

      setParseResult({
        success: true,
        message: `Successfully imported ${tableCount} table${tableCount > 1 ? 's' : ''}!`,
        tableCount,
      });

      toast.success(`Imported ${tableCount} table${tableCount > 1 ? 's' : ''} successfully`);

      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
        resetState();
      }, 1500);
    } catch (error) {
      console.error('Error parsing SQL file:', error);
      setParseResult({
        success: false,
        message: `Error parsing SQL file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      toast.error('Failed to parse SQL file');
    } finally {
      setIsProcessing(false);
    }
  }, [file, setTables, triggerLayout, onClose, resetState]);

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      resetState();
      onClose();
    }
  }, [isProcessing, resetState, onClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import SQL Schema</DialogTitle>
          <DialogDescription>
            Upload a PostgreSQL schema file (.sql) to visualize your database structure.
            Supports CREATE TABLE and CREATE VIEW statements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8
              transition-colors duration-200 ease-in-out
              ${isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }
              ${file ? 'bg-muted/50' : ''}
            `}
          >
            <input
              type="file"
              id="sql-file-input"
              accept=".sql,text/plain,application/sql"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />

            <div className="flex flex-col items-center justify-center text-center space-y-3">
              {file ? (
                <>
                  <FileText className="w-12 h-12 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetState();
                    }}
                    disabled={isProcessing}
                  >
                    Change File
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Drag & drop your SQL file here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports .sql files (PostgreSQL schema)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Parse Result */}
          {parseResult && (
            <div
              className={`
                flex items-start space-x-2 p-4 rounded-lg
                ${parseResult.success
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'bg-red-500/10 text-red-700 dark:text-red-400'
                }
              `}
            >
              {parseResult.success ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm">{parseResult.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Schema
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
