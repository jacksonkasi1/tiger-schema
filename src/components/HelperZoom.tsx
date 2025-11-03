'use client';

import { useStore } from '@/lib/store';
import { Minus, Plus } from 'lucide-react';

export function HelperZoom() {
  const { schemaView, updateSchemaViewScale } = useStore();

  const updateView = (type: 'plus' | 'minus') => {
    if (type === 'plus') {
      if (schemaView.scale >= 3) return;
      updateSchemaViewScale(schemaView.scale + 0.1);
    } else {
      if (schemaView.scale <= 0.47) return;
      updateSchemaViewScale(schemaView.scale - 0.1);
    }
  };

  return (
    <div className="flex items-center border-2 bg-gray-100 overflow-hidden dark:bg-dark-800 dark:border-dark-border rounded-md opacity-50 hover:opacity-100">
      <button
        title="Zoom out"
        onClick={() => updateView('minus')}
        className="p-3 flex hover:bg-gray-200 dark:hover:bg-dark-600 focus:outline-none"
      >
        <Minus size={20} />
      </button>
      <p className="px-3 w-24 border-x-2 border-dark-border text-center">
        {(schemaView.scale * 100).toFixed(0)}%
      </p>
      <button
        title="Zoom in"
        onClick={() => updateView('plus')}
        className="p-3 flex hover:bg-gray-200 dark:hover:bg-dark-600 focus:outline-none"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
