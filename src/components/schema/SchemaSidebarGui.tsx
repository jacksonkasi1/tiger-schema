'use client';

import { useStore } from '@/lib/store';
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Kbd } from '@/components/ui/kbd';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { TableCollapsible } from './TableCollapsible';

export function SchemaSidebarGui() {
  const { tables } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const tableIds = useMemo(() => Object.keys(tables), [tables]);

  const filteredTableIds = useMemo(() => {
    if (!searchQuery.trim()) return tableIds;
    const query = searchQuery.toLowerCase();
    return tableIds.filter((id) =>
      tables[id]?.title?.toLowerCase().includes(query)
    );
  }, [tableIds, tables, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-1.5 border-b border-border/50">
        <InputGroup className="h-8 rounded-lg border-border/50 bg-transparent p-0 focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/30">
          <InputGroupAddon className="pl-2.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="h-full text-sm px-1.5 py-0"
          />
          <InputGroupAddon className="pr-2.5">
            <Kbd>⌘K</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Tables List */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {filteredTableIds.length > 0 ? (
            filteredTableIds.map((tableId) => (
              <TableCollapsible key={tableId} tableId={tableId} />
            ))
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchQuery ? 'No tables found' : 'No tables in schema'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
