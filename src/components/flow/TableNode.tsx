'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableNodeData } from '@/types/flow';

function TableNodeComponent({ data, selected, id }: NodeProps) {
  const tableData = data as unknown as TableNodeData;
  const tableName = id; // Node ID is the table name

  // Common handle styling - larger and centered on border
  const handleClassName = (side: 'left' | 'right') => cn(
    // Size: 20px for better visibility and clickability
    '!w-5 !h-5',
    // Positioning: centered on border (50% inside, 50% outside)
    side === 'left' ? '!-left-2.5' : '!-right-2.5',
    // Colors and borders
    '!border-2 !border-white dark:!border-dark-700',
    // Visibility: always show on hover/select, subtle otherwise
    'transition-all duration-200',
    selected
      ? '!opacity-100 !scale-110'
      : '!opacity-60 hover:!opacity-100 hover:!scale-105',
    // Rounded
    '!rounded-full',
    // Cursor
    '!cursor-crosshair'
  );

  return (
    <div
      className={cn(
        'rounded-md overflow-hidden',
        'bg-warm-gray-100 dark:bg-dark-700',
        'backdrop-blur-sm',
        'border-2 dark:border-dark-border transition-colors',
        'shadow-md',
        selected && 'border-green-500 ring-2 ring-green-500/20'
      )}
      style={{
        minWidth: '200px',
        backgroundColor: 'var(--tw-bg-opacity, 1)',
      }}
    >
      {/* Table Header */}
      <div className="py-2 pb-3 px-2 text-dark-200 dark:text-light-500 bg-warm-gray-200 dark:bg-dark-800 font-medium text-lg text-center border-b-2 dark:border-dark-border">
        {tableData.is_view && (
          <Newspaper className="inline mb-1px mr-2" size={20} />
        )}
        {tableData.title}
      </div>

      {/* Columns */}
      <div className="pb-2">
        {tableData.columns?.map((col) => {
          // Create unique handle IDs for left and right sides
          const leftHandleId = `${tableName}_${col.title}_left`;
          const rightHandleId = `${tableName}_${col.title}_right`;

          // Determine handle colors based on column properties
          const handleColor = col.pk
            ? '!bg-blue-500'
            : col.fk
            ? '!bg-green-500'
            : '!bg-purple-500';

          return (
            <div key={col.title} className="relative">
              {/* LEFT SIDE HANDLES - Both source and target */}
              <Handle
                type="source"
                position={Position.Left}
                id={leftHandleId}
                className={cn(handleClassName('left'), handleColor)}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <Handle
                type="target"
                position={Position.Left}
                id={leftHandleId}
                className={cn(handleClassName('left'), handleColor)}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />

              {/* RIGHT SIDE HANDLES - Both source and target */}
              <Handle
                type="source"
                position={Position.Right}
                id={rightHandleId}
                className={cn(handleClassName('right'), handleColor)}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <Handle
                type="target"
                position={Position.Right}
                id={rightHandleId}
                className={cn(handleClassName('right'), handleColor)}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />

              <div
                className={cn(
                  'py-1 px-4 flex items-center text-dark-100 dark:text-white-800',
                  'border-l-3 border-transparent',
                  'hover:bg-warm-gray-200 dark:hover:bg-dark-600 dark:hover:text-white',
                  col.pk && 'border-green-500'
                )}
              >
                <p className="flex-grow truncate">{col.title}</p>
                <p className="ml-4 flex-shrink-0 text-sm text-white-900">
                  {col.format}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const TableNode = memo(TableNodeComponent);
