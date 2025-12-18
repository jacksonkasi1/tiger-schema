'use client';

import { useState } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableList } from './TableList';
import { SchemaSidebarSql } from './SchemaSidebarSql';

export function SchemaSidebar() {
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
    <div className="pointer-events-auto absolute left-0 top-0 z-40 h-full w-[380px] bg-background/95 backdrop-blur border-r border-border/50 flex flex-col shadow-xl">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Schema Editor</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gui" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-border/30">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="gui" className="text-xs font-medium">
              GUI
            </TabsTrigger>
            <TabsTrigger value="sql" className="text-xs font-medium">
              SQL
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="gui" className="flex-1 overflow-hidden mt-0">
          <TableList />
        </TabsContent>

        <TabsContent value="sql" className="flex-1 overflow-hidden mt-0">
          <SchemaSidebarSql />
        </TabsContent>
      </Tabs>
    </div>
  );
}
