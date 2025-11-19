'use client';

import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
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
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="h-7 pl-8 pr-12 text-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Kbd>⌘K</Kbd>
          </div>
        </div>
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
