'use client';

import React, { useEffect, useState } from 'react';
import { AlertIcon } from '../icons';

declare global {
  interface Window {
    __SW_CACHED_AT__?: string;
  }
}

export function OfflineProvenanceBanner() {
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkState = () => {
      const stamp =
        window.__SW_CACHED_AT__ ||
        document.querySelector('meta[name="sahayak-cached-at"]')?.getAttribute('content');

      if (stamp) {
        setCachedAt(stamp);
      }
      setIsOffline(!navigator.onLine || Boolean(stamp));
    };

    checkState();

    window.addEventListener('online', checkState);
    window.addEventListener('offline', checkState);
    return () => {
      window.removeEventListener('online', checkState);
      window.removeEventListener('offline', checkState);
    };
  }, []);

  if (!isOffline && !cachedAt) return null;

  const formattedDate = cachedAt
    ? new Date(cachedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full border-b border-warn/30 bg-warn-soft px-4 py-2.5 text-center text-sm font-semibold text-warn"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <AlertIcon className="h-4 w-4 shrink-0" />
        <span>
          {formattedDate
            ? `Showing scheme content saved on ${formattedDate} (offline mode).`
            : 'Showing cached scheme content (storage date unknown — offline mode).'}
        </span>
      </div>
    </div>
  );
}
