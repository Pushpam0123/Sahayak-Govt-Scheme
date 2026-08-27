'use client';

import React, { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Section } from '../../../components/layout/Section';
import { SchemeCard } from '../../../components/schemes/SchemeCard';
import { INDIAN_STATES, SCHEME_CATEGORIES } from '../../../lib/i18n';
import type { SchemeInfo } from '../../../lib/types';
import { AlertIcon, SearchIcon } from '../../../components/icons';

interface SchemeBrowseViewProps {
  initialSchemes: SchemeInfo[] | null;
}

export function SchemeBrowseView({ initialSchemes }: SchemeBrowseViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeState = searchParams.get('state') || '';
  const activeCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('q') || '';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim() !== '') {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    const queryStr = params.toString();
    router.push(queryStr ? `${pathname}?${queryStr}` : pathname);
  };

  const hasActiveFilters = Boolean(activeState || activeCategory || searchQuery);

  const clearFilters = () => {
    router.push(pathname);
  };

  // Filter schemes if initialSchemes exists
  const filteredSchemes = useMemo(() => {
    if (!initialSchemes) return [];
    return initialSchemes.filter((s) => {
      if (activeState && activeState !== 'All' && s.state !== activeState) {
        return false;
      }
      if (activeCategory && activeCategory !== 'All' && s.category !== activeCategory) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesSummary = s.summary?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesSummary) {
          return false;
        }
      }
      return true;
    });
  }, [initialSchemes, activeState, activeCategory, searchQuery]);

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-140px)]">
      {/* Header section */}
      <Section bg="bg-page" className="py-10 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-display-section text-content">
              Browse Government Schemes
            </h1>
            <p className="mt-2 text-lg text-muted">
              Explore verified central and state welfare programs, direct benefit disbursements, and official qualification criteria.
            </p>
          </div>

          {/* Filter Bar — URL search-param driven */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-12 gap-4 rounded-2xl border border-border-strong bg-surface p-4 sm:p-5 shadow-sm">
            {/* Text Search */}
            <div className="sm:col-span-6 relative">
              <label htmlFor="search-q" className="block text-sm font-bold text-muted mb-1">
                Search Scheme
              </label>
              <div className="relative">
                <input
                  id="search-q"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => updateParam('q', e.target.value)}
                  placeholder="e.g. PM-KISAN, Fasal Bima, pension…"
                  className="w-full min-h-[48px] rounded-xl border border-border-strong bg-page pl-10 pr-4 text-base font-semibold text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted pointer-events-none" />
              </div>
            </div>

            {/* State Filter */}
            <div className="sm:col-span-3">
              <label htmlFor="filter-state" className="block text-sm font-bold text-muted mb-1">
                State
              </label>
              <select
                id="filter-state"
                value={activeState}
                onChange={(e) => updateParam('state', e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-border-strong bg-page px-3.5 py-2 text-base font-semibold text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">All States & Central</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-3">
              <label htmlFor="filter-category" className="block text-sm font-bold text-muted mb-1">
                Category
              </label>
              <select
                id="filter-category"
                value={activeCategory}
                onChange={(e) => updateParam('category', e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-border-strong bg-page px-3.5 py-2 text-base font-semibold text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">All Categories</option>
                {SCHEME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Section>

      {/* Main Results Section */}
      <Section bg="bg-page" className="py-10 flex-1">
        <div className="max-w-7xl mx-auto">
          {/* 1. Server Unavailable State (API down) */}
          {initialSchemes === null ? (
            <div className="rounded-3xl border border-border-strong bg-surface p-8 sm:p-12 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warn-soft text-warn">
                <AlertIcon className="h-7 w-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-content">
                Unable to load schemes from the server
              </h2>
              <p className="text-base text-muted leading-relaxed">
                We could not establish a connection with the scheme database. Please check your connection and try again.
              </p>
              <button
                onClick={() => router.refresh()}
                className="mt-2 min-h-[48px] rounded-xl bg-primary px-6 py-2.5 text-base font-bold text-on-primary shadow-sm hover:bg-primary-hover transition-colors"
              >
                Retry Connection
              </button>
            </div>
          ) : filteredSchemes.length === 0 ? (
            /* 2. Empty Filter Matches State */
            <div className="rounded-3xl border border-border-subtle bg-surface p-8 sm:p-12 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-content">
                No schemes match these filters
              </h2>
              <p className="text-base text-muted leading-relaxed">
                We couldn&apos;t find any verified schemes matching your selected state, category, or search keywords.
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="mt-2 min-h-[48px] rounded-xl border border-border-strong px-6 py-2.5 text-base font-bold text-content hover:bg-surface-2 transition-colors"
                >
                  Reset all filters
                </button>
              ) : null}
            </div>
          ) : (
            /* 3. Grid of Schemes with Count */
            <div>
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="text-base font-bold text-muted">
                  Showing <span className="text-content font-extrabold">{filteredSchemes.length}</span>{' '}
                  {filteredSchemes.length === 1 ? 'scheme' : 'schemes'}
                  {hasActiveFilters ? ' matching your filters' : ''}
                </div>

                {hasActiveFilters ? (
                  <button
                    onClick={clearFilters}
                    className="text-base font-bold text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchemes.map((scheme) => (
                  <SchemeCard key={scheme.id} scheme={scheme} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
