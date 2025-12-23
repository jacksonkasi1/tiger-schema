'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableItem } from './TableItem';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export function TableList() {
  const { tables, addTable } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const tableIds = useMemo(() => Object.keys(tables), [tables]);

  const filteredTableIds = useMemo(() => {
    if (!searchQuery.trim()) return tableIds;
    const query = searchQuery.toLowerCase();
    return tableIds.filter((id) =>
      tables[id]?.title?.toLowerCase().includes(query)
    );
  }, [tableIds, tables, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredTableIds.indexOf(active.id as string);
      const newIndex = filteredTableIds.indexOf(over.id as string);

      // TODO: Update table order in store
      console.log('Reorder:', arrayMove(filteredTableIds, oldIndex, newIndex));
    }
  };

  const handleAddTable = () => {
    addTable();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-3 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="h-8 pl-8 text-xs bg-muted/20 border-border/30 hover:border-border/50 focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-ring/15"
            autoFocus
          />
        </div>
      </div>

      {/* Tables List */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {filteredTableIds.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredTableIds}
                strategy={verticalListSortingStrategy}
              >
                {filteredTableIds.map((tableId) => (
                  <TableItem key={tableId} tableId={tableId} />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-12 px-4 text-xs text-muted-foreground/50">
              {searchQuery ? 'No tables found' : 'No tables in schema'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Table Button */}
      <div className="px-3 py-3 border-t border-border/30">
        <Button className="w-full h-8 text-xs" size="sm" onClick={handleAddTable}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Table
        </Button>
      </div>
    </div>
  );
}
