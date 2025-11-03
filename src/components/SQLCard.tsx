'use client';

import { SQLCardItem } from '@/lib/types';
import { useClipboard } from '@/lib/hooks';
import { useStore } from '@/lib/store';
import { Clipboard, Link, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import hljs from 'highlight.js/lib/core';
// @ts-ignore - No type definitions available
import sql from 'highlight.js/lib/languages/sql';
import 'highlight.js/styles/dark.css';

hljs.registerLanguage('sql', sql);

interface SQLCardProps {
  item: SQLCardItem;
  onDelete: () => void;
}

export function SQLCard({ item, onDelete }: SQLCardProps) {
  const { copy, copied } = useClipboard();
  const { supabaseApiKey } = useStore();

  const copyAndOpenSQLTab = async () => {
    if (!item.result) return;
    await copy(item.result);
    try {
      const projectRef = new URL(supabaseApiKey.url).hostname.split('.')[0];
      window.open(`https://app.supabase.com/project/${projectRef}/sql`, '_blank');
    } catch (error) {
      console.error('Failed to open SQL tab:', error);
    }
  };

  const highlightedCode = useMemo(() => {
    if (!item.result) return '';
    return hljs.highlight(item.result, { language: 'sql' }).value;
  }, [item.result]);

  return (
    <div className="text-left p-6 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-dark-800 dark:hover:bg-dark-700 transition md:max-w-[36rem]">
      <p className="text-gray-900 dark:text-gray-300">{item.query}</p>
      <pre
        className="mt-2 text-sm p-4 whitespace-pre-wrap border-gray-300 bg-gray-300 dark:bg-dark-900 rounded-lg border-2 dark:border-dark-border"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />

      <div className="mt-4 flex items-center space-x-2 justify-between">
        <div className="flex items-center space-x-4">
          <button
            title={copied ? 'Copied' : 'Copy'}
            disabled={!item.result}
            onClick={() => copy(item.result ?? '')}
            className="text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition disabled:opacity-50"
          >
            <Clipboard size={20} />
          </button>
          <button
            title="Open SQL Editor"
            disabled={!item.result}
            onClick={copyAndOpenSQLTab}
            className="text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition disabled:opacity-50"
          >
            <Link size={20} />
          </button>
        </div>

        <button
          title="Remove"
          className="text-red-800 hover:text-gray-100 transition"
          onClick={onDelete}
        >
          <Trash2 size={20} />
        </button>
      </div>

      <style jsx global>{`
        .hljs-keyword,
        .hljs-link,
        .hljs-literal,
        .hljs-section,
        .hljs-selector-tag {
          @apply text-gray-900 dark:text-gray-300;
        }
      `}</style>
    </div>
  );
}
