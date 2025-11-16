'use client';

import { useState, useEffect } from 'react';
import { Column } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

interface ColumnDetailDialogProps {
  column: Column | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<Column>) => void;
}

export function ColumnDetailDialog({
  column,
  open,
  onOpenChange,
  onSave,
}: ColumnDetailDialogProps) {
  const [formData, setFormData] = useState<Partial<Column>>({});

  useEffect(() => {
    if (column) {
      setFormData(column);
    }
  }, [column]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  if (!column) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Column Details</DialogTitle>
          <DialogDescription>
            Configure column properties and constraints
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Column Name */}
          <div className="space-y-2">
            <Label htmlFor="column-name">Column Name</Label>
            <Input
              id="column-name"
              value={formData.title || ''}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="column_name"
            />
          </div>

          {/* Data Type */}
          <div className="space-y-2">
            <Label htmlFor="column-type">Data Type</Label>
            <Select
              value={formData.format || formData.type || ''}
              onValueChange={(value) =>
                setFormData({ ...formData, format: value })
              }
            >
              <SelectTrigger id="column-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Default Value */}
          <div className="space-y-2">
            <Label htmlFor="column-default">Default Value</Label>
            <Input
              id="column-default"
              value={formData.default || ''}
              onChange={(e) =>
                setFormData({ ...formData, default: e.target.value })
              }
              placeholder="NULL, '', NOW(), etc."
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="column-comment">Comment</Label>
            <Textarea
              id="column-comment"
              value={formData.comment || ''}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
              placeholder="Add a description for this column..."
              rows={3}
            />
          </div>

          {/* Constraints */}
          <div className="space-y-3 pt-2 border-t">
            <Label>Constraints</Label>

            <div className="flex items-center justify-between">
              <Label htmlFor="pk" className="font-normal cursor-pointer">
                Primary Key
              </Label>
              <Switch
                id="pk"
                checked={formData.pk || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, pk: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="required" className="font-normal cursor-pointer">
                Required (NOT NULL)
              </Label>
              <Switch
                id="required"
                checked={formData.required || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, required: checked })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
