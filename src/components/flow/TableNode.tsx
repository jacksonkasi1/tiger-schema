'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Bookmark,
  FileText,
  HelpCircle,
  Key,
  Link2,
  Newspaper,
  Sparkles,
} from 'lucide-react';
import { cn, getTableHeaderColor } from '@/lib/utils';
import { TableNodeData } from '@/types/flow';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function TableNodeComponent({ data, selected, id }: NodeProps) {
  const tableData = data as unknown as TableNodeData;
  const tableName = id; // Node ID is the table name
  const headerColor =
    (tableData as any).color || getTableHeaderColor(tableName);

  // Track hover state for showing handles
  const [isHovered, setIsHovered] = useState(false);

  // Show handles when selected or hovered
  const showHandles = selected || isHovered;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          'rounded-md overflow-visible',
          'bg-white dark:bg-dark-700',
          'border transition-colors',
          'shadow-sm',
          selected
            ? 'border-blue-400 dark:border-blue-500'
            : 'border-gray-200 dark:border-dark-border',
        )}
        style={{
          minWidth: '200px',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Table Header */}
        <div
          className="py-2 pb-3 px-2 text-dark-200 dark:text-light-500 bg-gray-50 dark:bg-dark-800 font-medium text-lg text-center border-b-2 dark:border-dark-border rounded-t-md"
          style={{
            borderTopWidth: '4px',
            borderTopColor: headerColor,
            borderTopStyle: 'solid',
          }}
        >
          {tableData.is_view && (
            <Newspaper className="inline mb-1px mr-2" size={20} />
          )}
          {tableData.title}
        </div>

        {/* Columns */}
        <div className="pb-2">
          {tableData.columns?.map((col, index) => {
            const handleId = `${tableName}_${col.title}_${index}`;
            const hasDefault =
              col.default !== undefined &&
              col.default !== null &&
              `${col.default}` !== '';
            const defaultLabel = hasDefault
              ? typeof col.default === 'string'
                ? col.default
                : JSON.stringify(col.default)
              : '';

            return (
              <div key={handleId} className="relative group">
                {/* Left Handle - Target (for incoming connections) */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={handleId}
                  className={cn(
                    '!w-3 !h-3 !border-2 !border-white dark:!border-dark-700',
                    '!transition-opacity !duration-150',
                    col.pk ? '!bg-blue-500' : '!bg-gray-400',
                    showHandles ? '!opacity-100' : '!opacity-0',
                  )}
                />

                {/* Right Handle - Source (for outgoing connections) */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={handleId}
                  className={cn(
                    '!w-3 !h-3 !border-2 !border-white dark:!border-dark-700',
                    '!transition-opacity !duration-150',
                    col.fk ? '!bg-emerald-500' : '!bg-blue-500',
                    showHandles ? '!opacity-100' : '!opacity-0',
                  )}
                />

                <div
                  className={cn(
                    'py-1 px-4 flex items-center text-dark-100 dark:text-white-800',
                    'border-l-3 border-transparent',
                    'hover:bg-gray-50 dark:hover:bg-dark-600 dark:hover:text-white',
                    col.pk && 'border-green-500',
                  )}
                >
                  <div className="flex items-center gap-1.5 flex-grow min-w-0">
                    {col.pk && (
                      <Key
                        size={14}
                        className="text-amber-500"
                        strokeWidth={2}
                      />
                    )}
                    {col.fk && (
                      <Link2
                        size={14}
                        className="text-emerald-500"
                        strokeWidth={2}
                      />
                    )}
                    <p className="truncate">{col.title}</p>
                  </div>

                  <div className="ml-4 flex items-center gap-1.5 flex-shrink-0">
                    {/* Show bookmark icon for enum types */}
                    {col.format === 'enum' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help text-purple-500 dark:text-purple-300">
                            <Bookmark size={14} strokeWidth={2} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="max-w-xs z-[9999]"
                        >
                          <div className="space-y-1">
                            {col.enumTypeName && (
                              <p className="font-semibold text-sm">
                                {col.enumTypeName}
                              </p>
                            )}
                            {col.enumValues && col.enumValues.length > 0 ? (
                              <>
                                <p className="text-xs text-muted-foreground">
                                  Values:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {col.enumValues.map((value, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono"
                                    >
                                      &apos;{value}&apos;
                                    </span>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Enum values not available
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <p className="text-sm text-white-900">{col.format}</p>

                    {!col.required && (
                      <HelpCircle
                        size={14}
                        className="text-slate-400 dark:text-slate-500"
                        strokeWidth={2}
                      />
                    )}

                    {col.comment && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help text-sky-500 dark:text-sky-400">
                            <FileText size={14} strokeWidth={2} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">{col.comment}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {hasDefault && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help text-emerald-500 dark:text-emerald-400">
                            <Sparkles size={14} strokeWidth={2} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <code className="text-sm">{defaultLabel}</code>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

export const TableNode = memo(TableNodeComponent);
