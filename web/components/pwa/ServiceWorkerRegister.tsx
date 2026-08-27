'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui';
import { RefreshIcon } from '../icons';

export function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowUpdatePrompt(true);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(newWorker);
              setShowUpdatePrompt(true);
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!showUpdatePrompt) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-primary/40 bg-surface p-4 shadow-xl text-content animate-fade-rise"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <RefreshIcon className="h-5 w-5" />
      </div>
      <div className="flex-1 text-xs">
        <p className="font-bold text-content">New version available</p>
        <p className="text-muted">Reload to apply recent scheme updates.</p>
      </div>
      <Button
        variant="primary"
        onClick={handleUpdate}
        className="px-3 py-1.5 text-xs font-bold shrink-0"
      >
        Reload
      </Button>
    </div>
  );
}
