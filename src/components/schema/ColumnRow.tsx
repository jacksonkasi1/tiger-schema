'use client';

import { useState } from 'react';
import { Column } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Key, Link2, Lock, Database, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DATA_TYPES = [
  'uuid',
  'bigint',
  'integer',
  'smallint',
  'varchar',
  'text',
  'boolean',
  'timestamp',
  'timestamptz',
  'date',
  'time',
  'numeric',
  'decimal',
  'real',
  'double precision',
  'json',
  'jsonb',
  'array',
  'bytea',
];

interface ColumnRowProps {
  column: Column;
  onUpdate: (updates: Partial<Column>) => void;
  onEditDetails: () => void;
  onDelete: () => void;
}

export function ColumnRow({ column, onUpdate, onEditDetails, onDelete }: ColumnRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="group flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      {/* Column Name */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={column.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditing(false);
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <div
            className="text-sm font-medium truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => setIsEditing(true)}
          >
            {column.title}
          </div>
        )}
      </div>

      {/* Data Type */}
      <Select value={column.format || column.type} onValueChange={(value) => onUpdate({ format: value })}>
        <SelectTrigger className="h-7 w-28 text-xs">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {DATA_TYPES.map((type) => (
            <SelectItem key={type} value={type} className="text-xs">
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Badges */}
      <div className="flex items-center gap-1">
        {column.pk && (
          <Badge variant="outline" className="h-6 px-1.5 text-xs gap-1">
            <Key className="h-3 w-3" />
            PK
          </Badge>
        )}
        {column.fk && (
          <Badge variant="outline" className="h-6 px-1.5 text-xs gap-1">
            <Link2 className="h-3 w-3" />
            FK
          </Badge>
        )}
        {!column.required && (
          <Badge variant="outline" className="h-6 px-1.5 text-xs">
            NULL
          </Badge>
        )}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEditDetails}>
            <Database className="mr-2 h-4 w-4" />
            Edit details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onUpdate({ pk: !column.pk })}
          >
            <Key className="mr-2 h-4 w-4" />
            {column.pk ? 'Remove' : 'Set as'} primary key
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onUpdate({ required: !column.required })}
          >
            <Lock className="mr-2 h-4 w-4" />
            {column.required ? 'Make nullable' : 'Make required'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
