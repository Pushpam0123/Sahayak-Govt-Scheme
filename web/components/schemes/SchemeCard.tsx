import React from 'react';
import Link from 'next/link';
import type { SchemeInfo } from '../../lib/types';

interface SchemeCardProps {
  scheme: SchemeInfo;
  className?: string;
}

export function SchemeCard({ scheme, className = '' }: SchemeCardProps) {
  return (
    <Link
      href={`/schemes/${scheme.id}`}
      className={`group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7 transition-all duration-150 hover:border-border-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="rounded-md bg-surface-2 px-2.5 py-1 text-sm font-bold text-muted">
            {scheme.state}
          </span>
          <span className="rounded-md bg-surface-2 px-2.5 py-1 text-sm font-bold text-muted">
            {scheme.category}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-content group-hover:text-primary transition-colors leading-snug">
          {scheme.name}
        </h3>

        {scheme.summary ? (
          <p className="mt-2.5 text-base text-muted line-clamp-2 leading-relaxed">
            {scheme.summary}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        {scheme.benefit_amount ? (
          <div className="border-t border-border-subtle pt-4">
            <div className="text-sm font-bold uppercase tracking-wider text-muted">
              Benefit Amount
            </div>
            <div className="benefit-figure text-2xl sm:text-3xl text-primary mt-0.5">
              {scheme.benefit_amount}
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-1 text-base font-bold text-primary group-hover:underline">
          <span>View official eligibility criteria</span>
          <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
