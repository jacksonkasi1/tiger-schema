'use client';

import { useStore } from '@/lib/store';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABLE_COLORS = [
  '#EC4899', // pink
  '#A855F7', // purple
  '#8B5CF6', // violet
  '#6366F1', // indigo
  '#3B82F6', // blue
  '#0EA5E9', // sky
  '#06B6D4', // cyan
  '#14B8A6', // teal
  '#10B981', // emerald
  '#22C55E', // green
  '#84CC16', // lime
  '#EAB308', // yellow
  '#F59E0B', // amber
  '#F97316', // orange
  '#EF4444', // red
];

interface ColorPickerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  currentColor?: string;
  trigger?: React.ReactNode;
}

export function ColorPickerDialog({
  open,
  onOpenChange,
  tableId,
  currentColor,
  trigger,
}: ColorPickerPopoverProps) {
  const { updateTableColor } = useStore();

  const handleColorSelect = (color: string) => {
    updateTableColor(tableId, color);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-2">
          <p className="text-sm font-medium">Choose Table Color</p>
          <div className="grid grid-cols-5 gap-2">
            {TABLE_COLORS.map((color) => (
              <button
                key={color}
                className={cn(
                  'h-10 w-10 rounded-md transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative',
                  currentColor === color && 'ring-2 ring-offset-2 ring-offset-background'
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
              >
                {currentColor === color && (
                  <Check className="h-4 w-4 absolute inset-0 m-auto text-white drop-shadow-lg" />
                )}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
