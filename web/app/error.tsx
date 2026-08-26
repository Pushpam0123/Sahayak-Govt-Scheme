'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Button } from '../components/ui';
import { AlertIcon } from '../components/icons';

export default function GlobalAppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <Card className="p-8 max-w-lg text-center flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warn-soft text-warn">
          <AlertIcon className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-content">Service Temporarily Unavailable</h1>
          <p className="text-base text-muted mt-2 leading-relaxed">
            We could not connect to the government scheme database. Please try again in a moment.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <Button onClick={() => reset()} variant="primary" className="min-h-[48px] text-base">
            Try Again
          </Button>
          <Link
            href="/"
            className="flex min-h-[48px] items-center justify-center rounded-xl border border-border-strong px-4 py-2 text-base font-semibold text-content hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Return Home
          </Link>
        </div>
      </Card>
    </div>
  );
}
