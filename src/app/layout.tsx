import type { Metadata } from 'next';
import './globals.css';
import { RootProvider } from '@/components/RootProvider';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://supabase-schema.vercel.app'),
  title: 'Supabase Schema',
  description: 'Visualize your Supabase database schema',
  openGraph: {
    title: 'Supabase Schema',
    description: 'Visualize your Supabase database schema',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RootProvider>
          <main className="w-screen h-screen relative bg-white dark:bg-dark-900 text-gray-900 dark:text-white overflow-hidden">
            {children}
          </main>
        </RootProvider>
      </body>
    </html>
  );
}
