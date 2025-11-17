'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Table2, Columns3 } from 'lucide-react';

interface SchemaCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SchemaCommandPalette({ open, onOpenChange }: SchemaCommandPaletteProps) {
  const { tables, triggerFocusTable, expandTable } = useStore();
  const [search, setSearch] = useState('');

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const searchResults = useMemo(() => {
    const query = search.toLowerCase();
    const results: {
      tables: Array<{ id: string; title: string }>;
      columns: Array<{ tableId: string; tableName: string; columnName: string; columnIndex: number }>;
    } = {
      tables: [],
      columns: [],
    };

    Object.entries(tables).forEach(([tableId, table]) => {
      // Search tables
      if (table.title.toLowerCase().includes(query)) {
        results.tables.push({ id: tableId, title: table.title });
      }

      // Search columns
      table.columns?.forEach((column, index) => {
        if (column.title.toLowerCase().includes(query)) {
          results.columns.push({
            tableId,
            tableName: table.title,
            columnName: column.title,
            columnIndex: index,
          });
        }
      });
    });

    return results;
  }, [tables, search]);

  const handleSelectTable = (tableId: string) => {
    triggerFocusTable(tableId);
    expandTable(tableId);
    onOpenChange(false);
  };

  const handleSelectColumn = (tableId: string) => {
    triggerFocusTable(tableId);
    expandTable(tableId);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search tables and columns..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {searchResults.tables.length > 0 && (
          <CommandGroup heading="Tables">
            {searchResults.tables.map((table) => (
              <CommandItem
                key={table.id}
                value={table.id}
                onSelect={() => handleSelectTable(table.id)}
              >
                <Table2 className="mr-2 h-4 w-4" />
                <span>{table.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchResults.columns.length > 0 && searchResults.tables.length > 0 && (
          <CommandSeparator />
        )}

        {searchResults.columns.length > 0 && (
          <CommandGroup heading="Columns">
            {searchResults.columns.map((column, index) => (
              <CommandItem
                key={`${column.tableId}-${column.columnIndex}-${index}`}
                value={`${column.tableId}-${column.columnName}`}
                onSelect={() => handleSelectColumn(column.tableId)}
              >
                <Columns3 className="mr-2 h-4 w-4" />
                <span className="flex-1">{column.columnName}</span>
                <span className="text-xs text-muted-foreground">in {column.tableName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
