'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useClipboard } from '@/lib/hooks';
import { createPortal } from 'react-dom';

interface ModalTypesProps {
  open: boolean;
  onClose: () => void;
}

export function ModalTypes({ open, onClose }: ModalTypesProps) {
  const { tables } = useStore();
  const { copy, copied } = useClipboard();
  const targetRef = useRef<HTMLDivElement>(null);

  const capitalizeFirstLetter = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const exportedCode = useMemo(() => {
    const referenceTable: { [key: string]: string } = {
      uuid: 'string',
      text: 'string',
      char: 'string',
      character: 'string',
      varchar: 'string',
      ARRAY: 'any[]',
      boolean: 'boolean',
      date: 'string',
      time: 'string',
      timestamp: 'string',
      timestamptz: 'string',
      interval: 'string',
      json: 'json',
      smallint: 'number',
      int: 'number',
      integer: 'number',
      bigint: 'number',
      float: 'number',
      float8: 'number',
    };

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
      const table = v;
      const value = tables[v];

      code += `interface ${capitalizeFirstLetter(table)} {\n`;
      value.columns?.forEach((v) => {
        // Set title
        code += `  ${v.title}`;

        // Check required?
        if (!v.required) code += '?';
        code += ': ';

        // Map to Typescript types
        code += referenceTable[v.format]
          ? referenceTable[v.format]
          : 'any // type unknown';

        // Check if Primary key or Foreign Key
        if (v.pk) code += '   /* primary key */';
        if (v.fk) code += `   /* foreign key to ${v.fk} */`;
        code += `;\n`;
      });

      value.columns
        ?.map((z) => z.fk)
        .filter((z) => typeof z === 'string')
        .forEach((z) => {
          let reference = z?.split('.')[0] as string;
          code += `  ${reference}?: ${capitalizeFirstLetter(reference)};\n`;
        });

      code += `};\n\n`;
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
          <h1 className="text-xl">Export Types (for Typescript)</h1>
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
