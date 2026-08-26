import React from 'react';
import Link from 'next/link';
import { Card } from '../../../../components/ui';
import { HelpIcon } from '../../../../components/icons';

export default function SchemeNotFound() {
  return (
    <div className="mx-auto max-w-xl py-12 px-4">
      <Card className="p-8 text-center flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
          <HelpIcon className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-content">Scheme not found</h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            The requested scheme could not be found in our verified government scheme index.
          </p>
        </div>

        <div className="mt-2">
          <Link
            href="/schemes"
            className="inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:bg-primary-hover transition-colors"
          >
            Browse Verified Schemes
          </Link>
        </div>
      </Card>
    </div>
  );
}
