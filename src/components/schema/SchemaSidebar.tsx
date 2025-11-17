'use client';

import { useState } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SchemaSidebarGui } from './SchemaSidebarGui';
import { SchemaSidebarSql } from './SchemaSidebarSql';

type SidebarMode = 'gui' | 'sql';

export function SchemaSidebar() {
  const [mode, setMode] = useState<SidebarMode>('gui');
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="h-9 w-9 rounded-lg shadow-lg"
          title="Expand sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute left-0 top-0 z-40 h-full w-80 bg-background/95 backdrop-blur border-r border-border flex flex-col shadow-2xl">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Schema Editor</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-7 w-7"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Mode Toggle */}
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-0.5 p-0.5 bg-muted/40 rounded">
          <button
            onClick={() => setMode('gui')}
            className={`flex-1 px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
              mode === 'gui'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            GUI
          </button>
          <button
            onClick={() => setMode('sql')}
            className={`flex-1 px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
              mode === 'sql'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            SQL
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'gui' ? <SchemaSidebarGui /> : <SchemaSidebarSql />}
      </div>
    </div>
  );
}
