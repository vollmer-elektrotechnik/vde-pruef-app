'use client';

import "./globals.css";
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { protocolService } from '../services/protocolService';
import { Sidebar } from './components/Sidebar'; // Sidebar importieren
import { Loader2 } from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initializeAuth() {
      try {
        const profile = await protocolService.getUserProfile();
        if (!profile) {
          router.push('/login');
        }
      } catch (error) {
        console.error("Auth-Initialisierung fehlgeschlagen:", error);
      } finally {
        setIsInitialized(true);
      }
    }

    initializeAuth();
  }, [pathname, router]);

  if (!isInitialized) {
    return (
      <html lang="de">
        <body className="bg-slate-900 flex items-center justify-center h-screen text-white antialiased">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">AJV System wird initialisiert</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="de">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen">
          
          {/* SIDEBAR COMPONENT */}
          <Sidebar />

          {/* HAUPTINHALT (RECHTS) */}
          <main className="flex-1 md:ml-64 w-full">
            <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
              {children}
            </div>
          </main>

        </div>
      </body>
    </html>
  );
}