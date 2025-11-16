'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { SidebarHeader } from './SidebarHeader';
import { TableGuiPanel } from './TableGuiPanel';
import { TableSqlPanel } from './TableSqlPanel';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type EditorMode = 'gui' | 'sql';

export function TableEditorSidebar() {
  const { selectedTableId, sidebarOpen, setSidebarOpen } = useStore();
  const [mode, setMode] = useState<EditorMode>('gui');

  if (!sidebarOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-20 z-40 h-8 w-8 p-0 shadow-lg"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen w-80 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-lg z-40 flex flex-col',
        'transition-transform duration-200 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Schema Editor
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(false)}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      {selectedTableId ? (
        <>
          <SidebarHeader
            tableId={selectedTableId}
            mode={mode}
            onModeChange={setMode}
          />

          <div className="flex-1 overflow-hidden">
            {mode === 'gui' ? (
              <TableGuiPanel tableId={selectedTableId} />
            ) : (
              <TableSqlPanel tableId={selectedTableId} />
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No table selected
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click on a table in the canvas to edit its schema
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
