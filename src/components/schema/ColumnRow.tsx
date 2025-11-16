'use client';

import { Column } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2 } from 'lucide-react';

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
  'json',
  'jsonb',
  'numeric',
  'decimal',
];

interface ColumnRowProps {
  column: Column;
  onUpdate: (updates: Partial<Column>) => void;
  onDelete: () => void;
}

export function ColumnRow({ column, onUpdate, onDelete }: ColumnRowProps) {
  return (
    <div className="group flex items-center gap-2 py-1.5 px-2 hover:bg-slate-800/40 rounded transition-colors">
      {/* Column Name */}
      <Input
        value={column.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="h-7 flex-1 text-sm bg-transparent border-transparent hover:border-slate-700 focus:border-slate-600"
        placeholder="column_name"
      />

      {/* Data Type */}
      <Select
        value={column.format || column.type || 'varchar'}
        onValueChange={(value) => onUpdate({ format: value })}
      >
        <SelectTrigger className="h-7 w-28 text-xs bg-transparent border-slate-700">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATA_TYPES.map((type) => (
            <SelectItem key={type} value={type} className="text-xs">
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Constraint Pills */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdate({ pk: !column.pk })}
          className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
            column.pk
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600'
          }`}
        >
          PK
        </button>
        <button
          onClick={() => onUpdate({ required: !column.required })}
          className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
            !column.required
              ? 'bg-slate-800 text-slate-400 border border-slate-700'
              : 'bg-slate-700 text-slate-300 border border-slate-600'
          }`}
        >
          NULL
        </button>
      </div>

      {/* More Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onDelete} className="text-red-400">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
