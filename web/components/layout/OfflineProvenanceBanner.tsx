'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertIcon } from '../icons';

declare global {
  interface Window {
    __SW_CACHED_AT__?: { time: string; path: string } | string;
  }
}

export function OfflineProvenanceBanner() {
  const pathname = usePathname();
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkState = () => {
      setIsOffline(!navigator.onLine);

      // Check for Service Worker provenance stamp
      let stampTime: string | null = null;
      let stampPath: string | null = null;

      if (window.__SW_CACHED_AT__) {
        if (typeof window.__SW_CACHED_AT__ === 'object') {
          stampTime = window.__SW_CACHED_AT__.time;
          stampPath = window.__SW_CACHED_AT__.path;
        } else if (typeof window.__SW_CACHED_AT__ === 'string') {
          stampTime = window.__SW_CACHED_AT__;
        }
      }

      if (!stampTime) {
        const metaEl = document.querySelector('meta[name="sahayak-cached-at"]');
        if (metaEl) {
          stampTime = metaEl.getAttribute('content');
          stampPath = metaEl.getAttribute('data-path');
        }
      }

      // Scope stamp to the route it describes — clear if navigated away via client router
      if (stampTime && (!stampPath || stampPath === pathname)) {
        setCachedAt(stampTime);
      } else {
        setCachedAt(null);
      }
    };

    checkState();

    window.addEventListener('online', checkState);
    window.addEventListener('offline', checkState);
    return () => {
      window.removeEventListener('online', checkState);
      window.removeEventListener('offline', checkState);
    };
  }, [pathname]);

  // Case 1: Response has a verified cache stamp for this route
  if (cachedAt) {
    const parsed = new Date(cachedAt);
    const isValidDate = !isNaN(parsed.getTime());
    const formattedDate = isValidDate
      ? parsed.toLocaleDateString('en-IN', {
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
        className="w-full border-b border-warn/30 bg-warn-soft px-4 py-3 text-center text-base font-semibold text-warn"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <AlertIcon className="h-5 w-5 shrink-0" />
          <span>
            {formattedDate
              ? `Showing scheme content saved on ${formattedDate} (offline mode).`
              : 'Showing cached scheme content (storage date unknown — offline mode).'}
          </span>
        </div>
      </div>
    );
  }

  // Case 2: User is offline on a live-served page (no stamp)
  // Honest connectivity notice — makes ZERO false claims about content age or caching
  if (isOffline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full border-b border-border-strong bg-surface-2 px-4 py-3 text-center text-base font-semibold text-muted"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <AlertIcon className="h-5 w-5 shrink-0 text-muted" />
          <span>You are offline. Live search, eligibility calculation, and assistant chat are unavailable.</span>
        </div>
      </div>
    );
  }

  return null;
}
