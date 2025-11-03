'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useLocalStorage } from '@/lib/hooks';
import { SQLCardItem, Table } from '@/lib/types';
import { SQLCard } from '@/components/SQLCard';

export default function AIPage() {
  const { tables } = useStore();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultList, setResultList] = useLocalStorage<SQLCardItem[]>('ai-result-list', []);

  const authUserTable: Table = {
    title: 'auth.users',
    columns: [
      { title: 'id', format: 'uuid', type: 'string' },
      { title: 'email', format: 'varchar', type: 'string' },
    ],
  };

  const listOfTables = useMemo(() => {
    const tablesList = Object.entries(tables)
      .map(([, value]) => (value.is_view ? undefined : value))
      .filter(Boolean) as Table[];
    tablesList.push(authUserTable);
    return tablesList;
  }, [tables]);

  const tableSchema = useMemo(() => {
    return listOfTables
      .map(
        (table) =>
          `${table?.title}(${table?.columns
            ?.map((i) => `${i.title} ${i.format}`)
            .join(',')})`
      )
      .join('\n#');
  }, [listOfTables]);

  const generateSQL = async () => {
    if (!query) return;

    try {
      const resultListIndex = resultList.length;
      const newResultList = [...resultList];
      newResultList[resultListIndex] = {
        query: query,
        result: '',
      };
      setResultList(newResultList);
      setIsLoading(true);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema: tableSchema,
          query: query,
        }),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const data = response.body;
      if (!data) {
        return;
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        setResultList((prevList) => {
          const updatedList = [...prevList];
          updatedList[resultListIndex] = {
            ...updatedList[resultListIndex],
            result: (updatedList[resultListIndex].result || '') + chunkValue,
          };
          return updatedList;
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCard = (index: number) => {
    const newResultList = [...resultList];
    newResultList.splice(index, 1);
    setResultList(newResultList);
  };

  return (
    <div className="dark:text-white p-8 pr-14 h-screen overflow-y-auto">
      <h1 className="text-4xl">Supabase SQL AI</h1>
      <p className="mt-2 text-lg">
        Translate human language to SQL based on your Supabase project
      </p>

      <div className="flex flex-col md:flex-row mt-12">
        <div className="md:w-120 flex-shrink-0">
          <div className="sticky top-4 flex flex-col">
            <p>Found table:</p>
            <div className="flex flex-wrap mt-4">
              {listOfTables.map((table) => (
                <code
                  key={table?.title}
                  className="mr-2 mb-2 rounded-full border text-xs px-2 py-1"
                  title={table?.columns?.map((i) => i.title).join(', ')}
                >
                  {table?.title}
                </code>
              ))}
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={6}
              placeholder="Can you write efficient SQL? Can you?"
              className="p-4 bg-light-500 dark:bg-dark-700 dark:placeholder-dark-50 border-none rounded-xl mt-4 focus:outline-none focus:ring-green-500 focus:ring-2"
            />
            <button
              onClick={generateSQL}
              disabled={isLoading || query.length === 0}
              data-umami-event="Generate SQL"
              className="mt-4 bg-green-500 rounded-md px-4 py-2 text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate
            </button>
          </div>
        </div>

        <div className="mt-8 md:mt-0 md:ml-8 flex flex-col space-y-4">
          {resultList.map((item, index) => (
            <SQLCard
              key={index}
              item={item}
              onDelete={() => deleteCard(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
