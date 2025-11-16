'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const COLORS = [
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#EF4444', // red-500
  '#F97316', // orange-500
  '#F59E0B', // amber-500
  '#84CC16', // lime-500
  '#10B981', // emerald-500
  '#14B8A6', // teal-500
  '#06B6D4', // cyan-500
  '#6366F1', // indigo-500
  '#A855F7', // purple-500
  '#64748B', // slate-500
  '#6B7280', // gray-500
  '#78716C', // stone-500
  '#DC2626', // red-600
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value = '#3B82F6', onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 border border-slate-300 dark:border-slate-700"
        >
          <div
            className="h-full w-full rounded-sm"
            style={{ backgroundColor: value }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-4 gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="h-8 w-8 rounded border-2 transition-all hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: value === color ? '#000' : 'transparent',
              }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
