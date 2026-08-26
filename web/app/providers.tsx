'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, LangProvider } from '../lib/theme';
import { ServiceWorkerRegister } from '../components/pwa/ServiceWorkerRegister';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LangProvider>
          {children}
          <ServiceWorkerRegister />
        </LangProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
