'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ColorPicker } from './ColorPicker';
import { Badge } from '@/components/ui/badge';

type EditorMode = 'gui' | 'sql';

interface SidebarHeaderProps {
  tableId: string;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

export function SidebarHeader({ tableId, mode, onModeChange }: SidebarHeaderProps) {
  const { tables, updateTableName, updateTableColor } = useStore();
  const table = tables[tableId];
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(table?.title || '');

  if (!table) return null;

  const handleNameBlur = () => {
    if (nameValue && nameValue !== table.title) {
      updateTableName(tableId, nameValue);
    } else {
      setNameValue(table.title);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setNameValue(table.title);
      setIsEditingName(false);
    }
  };

  return (
    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 space-y-3">
      {/* Table Name and Color */}
      <div className="flex items-center gap-2">
        <ColorPicker
          value={table.color}
          onChange={(color) => updateTableColor(tableId, color)}
        />

        {isEditingName ? (
          <Input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="h-8 flex-1 font-semibold"
            autoFocus
          />
        ) : (
          <div
            className="flex-1 text-base font-semibold truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={() => {
              setNameValue(table.title);
              setIsEditingName(true);
            }}
          >
            {table.title}
          </div>
        )}
      </div>

      {/* Schema Badge */}
      {table.schema && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {table.schema}
          </Badge>
          {table.is_view && (
            <Badge variant="outline" className="text-xs">
              View
            </Badge>
          )}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
        <Button
          variant={mode === 'gui' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('gui')}
          className={`flex-1 h-7 text-xs font-medium ${
            mode === 'gui'
              ? 'bg-white dark:bg-slate-950 shadow-sm'
              : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          GUI
        </Button>
        <Button
          variant={mode === 'sql' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('sql')}
          className={`flex-1 h-7 text-xs font-medium ${
            mode === 'sql'
              ? 'bg-white dark:bg-slate-950 shadow-sm'
              : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          SQL
        </Button>
      </div>
    </div>
  );
}
