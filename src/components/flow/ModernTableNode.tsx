'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Key, Link2, Sparkles, Circle } from 'lucide-react';
import { cn, getTableHeaderColor } from '@/lib/utils';
import { TableNodeData } from '@/types/flow';

function ModernTableNodeComponent({ data, selected, id }: NodeProps) {
  const tableData = data as unknown as TableNodeData;
  const tableName = id;
  const headerColor =
    (tableData as any).color || getTableHeaderColor(tableName);

  return (
    <div
      className={cn(
        'rounded-md overflow-visible bg-background shadow-sm transition-all',
        'border',
        selected
          ? 'border-blue-400 dark:border-blue-500'
          : 'border-border',
      )}
      style={{
        minWidth: '240px',
        maxWidth: '320px',
      }}
    >
      {/* Table Header */}
      <div
        className="py-2.5 px-3 text-foreground font-semibold text-base border-t-[4px] rounded-t-md"
        style={{
          borderTopColor: headerColor,
          backgroundColor: `${headerColor}10`,
        }}
      >
        {tableData.title}
      </div>

      {/* Columns */}
      <div className="bg-background">
        {tableData.columns?.map((col, index) => {
          const handleId = `${tableName}_${col.title}_${index}`;
          const isPK = col.pk;
          const isFK = col.fk;
          const isUnique = col.unique;
          const isNullable = !col.required;

          return (
            <div
              key={handleId}
              className={cn(
                'relative group py-2 px-3 flex items-center gap-2 border-b border-border/50 last:border-b-0',
                'hover:bg-muted/40 transition-colors',
                'border-l-[3px] border-transparent',
                isPK && 'border-l-yellow-500/50',
              )}
            >
              {/* Connection Handles - DrawSQL inspired: common blue dots, 50% outside */}
              {/* Left Handle - Target (for incoming connections) */}
              <Handle
                type="target"
                position={Position.Left}
                id={handleId}
                className={cn(
                  '!w-3 !h-3 !bg-blue-500 !border-2 !border-background !-left-[9px] !transition-opacity',
                  selected ? '!opacity-100' : '!opacity-0'
                )}
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />

              {/* Right Handle - Source (for outgoing connections) */}
              <Handle
                type="source"
                position={Position.Right}
                id={handleId}
                className={cn(
                  '!w-3 !h-3 !border-2 !border-background !-right-[7px] !transition-opacity',
                  isFK ? '!bg-emerald-500' : '!bg-blue-500',
                  selected ? '!opacity-100' : '!opacity-0'
                )}
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />

              {/* Index Type Icon */}
              <div className="shrink-0">
                {isPK ? (
                  <Key className="h-3.5 w-3.5 text-yellow-500" />
                ) : isUnique ? (
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                ) : isFK ? (
                  <Link2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Circle className="h-2 w-2 text-muted-foreground/30" />
                )}
              </div>

              {/* Column Name */}
              <span className="flex-1 text-sm font-medium truncate font-mono">
                {col.title}
              </span>

              {/* Data Type */}
              <span className="text-xs text-muted-foreground font-mono shrink-0">
                {col.format || col.type}
              </span>

              {/* NULL Indicator */}
              {isNullable && (
                <span className="text-[10px] text-muted-foreground/50 shrink-0 font-bold">
                  N
                </span>
              )}
            </div>
          );
        })}

        {(!tableData.columns || tableData.columns.length === 0) && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No columns
          </div>
        )}
      </div>
    </div>
  );
}

export const ModernTableNode = memo(ModernTableNodeComponent);
