'use client';

import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Network } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <menu className="absolute z-[1000] top-5 right-5 m-0 p-0 rounded-md border-2 border-dark-border opacity-50 hover:opacity-100">
      <div className="relative bg-dark-800 rounded-bl-md">
        <div className="flex flex-row">
          <div
            className={`p-3 cursor-pointer hover:bg-dark-600 text-white-800 ${
              pathname === '/ai' ? '!text-white' : ''
            }`}
            onClick={() => router.push('/ai')}
          >
            <BarChart3 size={20} />
          </div>
          <div
            className={`p-3 cursor-pointer hover:bg-dark-600 text-white-800 ${
              pathname === '/' ? '!text-white' : ''
            }`}
            onClick={() => router.push('/')}
          >
            <Network size={20} />
          </div>
        </div>
      </div>
    </menu>
  );
}
