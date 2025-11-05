'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Trash2, ZoomIn, Eye, Layout } from 'lucide-react';

export interface ContextMenuProps {
  x: number;
  y: number;
  items: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    className?: string;
    divider?: boolean;
  }[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] bg-white dark:bg-dark-800 border border-warm-gray-300 dark:border-dark-border rounded-md shadow-lg py-1"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.divider && (
            <div className="h-px bg-warm-gray-200 dark:bg-dark-border my-1" />
          )}
          <button
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={cn(
              'w-full px-4 py-2 text-left text-sm flex items-center gap-2',
              'hover:bg-warm-gray-100 dark:hover:bg-dark-700',
              'text-dark-100 dark:text-white-800',
              'transition-colors',
              item.className
            )}
          >
            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

// Predefined menu items
export const createNodeContextMenu = (
  _nodeId: string,
  _isView: boolean,
  onDelete: () => void,
  onCopyId: () => void,
  onFocusNode: () => void,
  onHideNode: () => void
) => [
  {
    label: 'Focus on this node',
    icon: <ZoomIn size={16} />,
    onClick: onFocusNode,
  },
  {
    label: 'Copy ID',
    icon: <Copy size={16} />,
    onClick: onCopyId,
  },
  {
    label: 'Hide node',
    icon: <Eye size={16} />,
    onClick: onHideNode,
  },
  {
    label: 'Delete',
    icon: <Trash2 size={16} />,
    onClick: onDelete,
    className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    divider: true,
  },
];

export const createEdgeContextMenu = (
  _edgeId: string,
  onDelete: () => void,
  onChangeType: () => void
) => [
  {
    label: 'Change relationship type',
    icon: <Layout size={16} />,
    onClick: onChangeType,
  },
  {
    label: 'Delete relationship',
    icon: <Trash2 size={16} />,
    onClick: onDelete,
    className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    divider: true,
  },
];
