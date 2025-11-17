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
    <div className="group flex items-center gap-1.5 py-1 px-2 hover:bg-muted/30 transition-colors border-b border-border/10 last:border-0">
      {/* Column Name */}
      <Input
        value={column.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="h-6 flex-1 text-[11px] bg-transparent border-transparent hover:border-border focus:border-border px-1"
        placeholder="column_name"
      />

      {/* Data Type */}
      <Select
        value={column.format || column.type || 'varchar'}
        onValueChange={(value) => onUpdate({ format: value })}
      >
        <SelectTrigger className="h-6 w-20 text-[10px] bg-transparent border-border/50 px-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATA_TYPES.map((type) => (
            <SelectItem key={type} value={type} className="text-[10px]">
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Constraint Pills */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onUpdate({ pk: !column.pk })}
          className={`px-1 py-0.5 text-[9px] font-medium rounded transition-colors ${
            column.pk
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-muted text-muted-foreground border border-border/50 hover:border-border'
          }`}
        >
          PK
        </button>
        <button
          onClick={() => onUpdate({ required: !column.required })}
          className={`px-1 py-0.5 text-[9px] font-medium rounded transition-colors ${
            !column.required
              ? 'bg-muted text-muted-foreground border border-border/50'
              : 'bg-muted/50 text-foreground border border-border'
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
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={onDelete} className="text-destructive text-xs">
            <Trash2 className="mr-2 h-3 w-3" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
