'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useLocalStorage } from '@/lib/hooks';
import { useDark } from '@/lib/hooks';
import { InputText } from './InputText';
import { Github, Network, Bot, Settings as SettingsIcon, Moon } from 'lucide-react';
import Image from 'next/image';

interface SettingsProps {
  isFetching: boolean;
  setIsFetching: (isFetching: boolean) => void;
}

export function Settings({ setIsFetching }: SettingsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { supabaseApiKey, setSupabaseApiKey, setTables, autoArrange } = useStore();
  const [url, setUrl] = useState(supabaseApiKey.url);
  const [anon, setAnon] = useState(supabaseApiKey.anon);
  const [error, setError] = useState('');
  const [togglePanel, setTogglePanel] = useLocalStorage('togglePanel', true);
  const [isAINew, setIsAINew] = useLocalStorage('is-ai-new', true);
  const [, setDefinitions] = useLocalStorage<any>('definitions', {});
  const { toggleDark } = useDark();

  // Update local state when store changes
  useEffect(() => {
    setUrl(supabaseApiKey.url);
    setAnon(supabaseApiKey.anon);
  }, [supabaseApiKey]);

  const fetchData = async () => {
    if (!url || !anon) return;

    setIsFetching(true);
    setError('');

    try {
      const res = await fetch(`${url}/rest/v1/?apikey=${anon}`);

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.indexOf('application/openapi+json') !== -1) {
          const data = await res.json();
          if (data.definitions) {
            setDefinitions(data.definitions);

            // Update the store with new API key
            const newApiKey = { url, anon, last_url: supabaseApiKey.last_url };

            if (supabaseApiKey.last_url !== url) {
              // Clear tables if URL changed
              setSupabaseApiKey({ ...newApiKey, last_url: url });
              setTables(data.definitions, data.paths);
              setTimeout(() => {
                autoArrange();
              }, 0);
            } else {
              setSupabaseApiKey(newApiKey);
              setTables(data.definitions, data.paths);
            }
          }
        } else {
          setError('Invalid link');
        }
      } else {
        setError('Error with fetching data');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    setTogglePanel(false);
    if (pathname === '/ai') setIsAINew(false);
  }, [pathname]);

  const positionPanel = togglePanel ? '1.25rem' : '-22.5rem';

  return (
    <menu
      className="absolute z-1000 top-5 m-0 p-0 w-90 rounded-md border-2 dark:border-dark-border transition-right duration-500 ease-in-out"
      style={{ right: positionPanel }}
    >
      <div className="relative bg-light-300 dark:bg-dark-800 p-6 rounded-md">
        <div className="w-full flex justify-center">
          <Image src="/logo.svg" width={128} height={128} className="h-32" alt="Supabase Schema Logo" />
        </div>

        <h1
          style={{ WebkitTextFillColor: 'transparent' }}
          className="mt-4 flex items-baseline text-3xl font-bold bg-gradient-to-r from-green-500 to-green-400 bg-clip-text fill-transparent"
        >
          Supabase Schema
          <a href="https://github.com/zernonia/supabase-schema" target="_blank" rel="noreferrer">
            <Github className="text-lg ml-2 text-dark-500 dark:hover:text-white" size={20} />
          </a>
        </h1>

        <h6 className="text-dark-500 font-medium text-sm">
          Open Source • LocalStorage
        </h6>

        <div className="mt-4">
          <details open>
            <summary className="font-medium uppercase">Steps</summary>

            <ol className="mt-2 dark:text-white-700 ml-8 list-decimal leading-tight">
              <li className="py-2">
                Obtain OpenAPI URL following instruction{' '}
                <a
                  className="underline hover:text-green-500"
                  target="_blank"
                  href="https://github.com/zernonia/supabase-schema#-instructions"
                  rel="noreferrer"
                >
                  here
                </a>
              </li>

              <li className="py-2">Paste the URL below</li>

              <li className="py-2">Enjoy the Supabase Schema</li>
            </ol>
          </details>
        </div>

        <form className="flex flex-col mt-4">
          <label htmlFor="website" className="mr-2 text-sm font-medium uppercase">
            Url
          </label>

          <InputText
            type="text"
            name="url"
            placeholder="https://your-project.supabase.co"
            value={url}
            onChange={setUrl}
          />

          <label htmlFor="anon" className="mr-2 mt-2 text-sm font-medium uppercase">
            API Keys
          </label>

          <InputText
            type="text"
            name="anon"
            placeholder="your-anon-key"
            value={anon}
            onChange={setAnon}
          />

          <div className="flex justify-end mt-4">
            <button
              className="bg-green-500 rounded-md px-4 py-0 h-8 text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-600 text-white"
              onClick={(e) => {
                e.preventDefault();
                fetchData();
              }}
            >
              Fetch
            </button>
          </div>

          {error && <span className="text-sm text-white-900">{error}</span>}
        </form>

        {/* arrow buttons */}
        <div className="absolute right-[105%] flex flex-col space-y-2 top-0">
          <button
            className="btn"
            title="Schema"
            onClick={() => router.push('/')}
          >
            <Network size={20} />
          </button>

          <button
            className="btn relative"
            title="AI"
            onClick={() => router.push('/ai')}
          >
            <Bot size={20} />
            {isAINew && (
              <>
                <div className="w-4 h-4 rounded-full bg-blue-500 absolute top-3.5 -left-3 animate-ping" />
                <div className="w-4 h-4 rounded-full bg-blue-500 absolute top-3.5 -left-3" />
              </>
            )}
          </button>

          <button
            className="btn !mt-12"
            title="Settings"
            onClick={() => setTogglePanel(!togglePanel)}
          >
            <SettingsIcon size={20} />
          </button>

          <button
            className="btn"
            title="Toggle Dark mode"
            onClick={toggleDark}
          >
            <Moon size={20} />
          </button>
        </div>
      </div>
    </menu>
  );
}
