'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnumEditorPopoverProps {
  enumTypeName: string;
  currentValues: string[];
  onSave: (newValues: string[]) => void;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ValidationResult {
  values: string[];
  warnings: string[];
  isValid: boolean;
}

function parseAndValidateValues(input: string): ValidationResult {
  const warnings: string[] = [];

  // Split by comma and process each value
  const rawValues = input
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

  // Track duplicates (case-insensitive comparison)
  const seenLower = new Set<string>();
  const uniqueValues: string[] = [];
  let duplicateCount = 0;

  for (const value of rawValues) {
    const lowerValue = value.toLowerCase();
    if (seenLower.has(lowerValue)) {
      duplicateCount++;
    } else {
      seenLower.add(lowerValue);
      uniqueValues.push(value);
    }
  }

  if (duplicateCount > 0) {
    warnings.push(
      `${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} removed`,
    );
  }

  // Check for empty result
  const isValid = uniqueValues.length > 0;

  return {
    values: uniqueValues,
    warnings,
    isValid,
  };
}

export function EnumEditorPopover({
  enumTypeName,
  currentValues,
  onSave,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EnumEditorPopoverProps) {
  const { renameEnumType, updateEnumType } = useStore();
  const [internalOpen, setInternalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [nameValue, setNameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (controlledOnOpenChange ?? (() => {}))
    : setInternalOpen;

  // Initialize input when popover opens
  useEffect(() => {
    if (open) {
      setInputValue(currentValues.join(', '));
      const name = enumTypeName.includes('.')
        ? enumTypeName.split('.').pop()!
        : enumTypeName;
      setNameValue(name);
      setIsRenaming(false);
    }
  }, [open, currentValues, enumTypeName]);

  // Parse and validate input
  const validation = useMemo(
    () => parseAndValidateValues(inputValue),
    [inputValue],
  );

  // Extract display name from enum type (handle schema.name format)
  const displayName = enumTypeName.includes('.')
    ? enumTypeName.split('.').pop()
    : enumTypeName;

  const handleSave = () => {
    if (validation.isValid) {
      const isNamedEnum = enumTypeName !== 'enum';
      const newName = nameValue.trim();
      const hasRenamed =
        isNamedEnum && newName !== displayName && newName.length > 0;

      if (hasRenamed) {
        renameEnumType(enumTypeName, newName);

        // Calculate new key to update values
        const schema = enumTypeName.includes('.')
          ? enumTypeName.split('.')[0]
          : undefined;
        const newKey = schema ? `${schema}.${newName}` : newName;

        updateEnumType(newKey, validation.values);
      } else {
        onSave(validation.values);
      }
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setInputValue(currentValues.join(', '));
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        side="right"
        align="start"
        sideOffset={8}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              Edit Enum:
            </span>
            {isRenaming ? (
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="h-6 text-sm font-semibold px-1 py-0 w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // Prevent default enter behavior (saving) when editing name
                    // User should click save button or press enter in textarea
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsRenaming(false);
                    setNameValue(displayName || '');
                  }
                }}
              />
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-sm font-semibold text-foreground truncate max-w-[140px]"
                  title={displayName}
                >
                  {displayName}
                </span>
                {enumTypeName !== 'enum' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={() => setIsRenaming(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 ml-2"
            onClick={handleCancel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Input */}
        <div className="p-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Values (comma-separated)
            </label>
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="pending, confirmed, cancelled"
              className="min-h-[80px] text-sm font-mono resize-none"
              autoFocus
            />
          </div>

          {/* Preview */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Preview ({validation.values.length} value
              {validation.values.length !== 1 ? 's' : ''})
            </label>
            <ScrollArea className="max-h-24">
              <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-md min-h-[36px]">
                {validation.values.length > 0 ? (
                  validation.values.map((value, index) => (
                    <Badge
                      key={`${value}-${index}`}
                      variant="secondary"
                      className="text-xs font-mono px-2 py-0.5"
                    >
                      {value}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    No values
                  </span>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {validation.warnings.map((warning, index) => (
                  <p
                    key={index}
                    className="text-xs text-amber-600 dark:text-amber-400"
                  >
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Validation error */}
          {!validation.isValid && inputValue.trim().length > 0 && (
            <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">
                At least one value is required
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-border/50 bg-muted/20">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!validation.isValid}
            className={cn(
              !validation.isValid && 'opacity-50 cursor-not-allowed',
            )}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
