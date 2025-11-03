'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useClipboard } from '@/lib/hooks';
import { createPortal } from 'react-dom';

interface ModalSQLProps {
  open: boolean;
  onClose: () => void;
}

export function ModalSQL({ open, onClose }: ModalSQLProps) {
  const { tables } = useStore();
  const { copy, copied } = useClipboard();
  const targetRef = useRef<HTMLDivElement>(null);

  const reservedKeyword = [
    'user',
    'database',
    'default',
    'dictionary',
    'files',
    'group',
    'index',
    'level',
    'max',
    'min',
    'password',
    'procedure',
    'table',
    'user',
    'view',
  ];

  const exportedCode = useMemo(() => {
    let code = '';
    const dependencies: any = {};

    Object.entries(tables).forEach(([table, value]) => {
      dependencies[table] = value.columns
        ?.map((v) => v.fk?.split('.')[0])
        .filter((v) => typeof v === 'string')
        .filter((v) => table != v);
    });

    let keys = Object.keys(dependencies);
    const output: string[] = [];

    while (keys.length) {
      for (let i in keys) {
        let key = keys[i];
        let d = dependencies[key];

        if (d.every((dependency: any) => output.includes(dependency))) {
          output.push(key);
          keys.splice(+i, 1);
        }
      }
    }

    output.forEach((v) => {
      if (tables[v].is_view) return;
      const table = v;
      const value = tables[v];

      code += `create table ${table} (\n`;
      value.columns?.forEach((v, i, arr) => {
        // Set title
        if (reservedKeyword.includes(v.title)) {
          code += `  "${v.title}"`;
        } else {
          code += `  ${v.title}`;
        }

        // Set data format
        if (v.format == 'integer' && v.pk) {
          code += ` serial`;
        } else {
          code += ` ${v.format}`;
        }

        // Set references
        if (v.fk)
          code += ` references ${v.fk.split('.')[0]} (${v.fk.split('.')[1]})`;

        // Set default
        if (v.format == 'date' || v.format.includes('timestamp'))
          code += ` default now()`;
        if (v.required && v.format == 'uuid' && !v.fk)
          code += ` default uuid_generate_v4()`;
        // Set not null/primary key
        else if (v.required && !v.fk) code += ` not null`;
        if (v.pk) code += ` primary key`;

        if (i == arr.length - 1) {
          code += `\n`;
        } else {
          code += `,\n`;
        }
      });
      code += `);\n\n`;
    });
    return code;
  }, [tables]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (targetRef.current && !targetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="w-screen h-screen fixed top-0 left-0 flex items-center justify-center bg-light-400 dark:bg-dark-900 !bg-opacity-50 z-50">
      <div
        ref={targetRef}
        className="bg-warm-gray-100 dark:bg-dark-800 w-full max-w-screen-md h-screen-sm rounded-md border-2 dark:border-dark-600 flex flex-col"
      >
        <div className="text-dark-100 dark:text-white p-4 border-b-2 dark:border-dark-600 flex items-center justify-between">
          <h1 className="text-xl">Export SQL</h1>
          <button className="btn-green" onClick={() => copy(exportedCode)}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="p-4 text-dark-100 dark:text-white h-full overflow-hidden overflow-y-auto">
          <p className="mb-4">
            There might be some issues with the exported code. You may submit{' '}
            <a
              href="https://github.com/zernonia/supabase-schema/issues"
              target="_blank"
              className="underline"
              rel="noreferrer"
            >
              issues here
            </a>
            .
          </p>
          <pre className="bg-warm-gray-200 dark:bg-dark-900 text-warm-gray-500 dark:text-white-800 text-sm rounded-md p-4 h-auto">
            {exportedCode}
          </pre>
        </div>
      </div>
    </div>,
    document.body
  );
}
