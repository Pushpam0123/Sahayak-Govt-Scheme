'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Dict } from '../../lib/i18n';
import type { EligibilityMap, SchemeInfo } from '../../lib/types';
import { Card, Badge, Button } from '../ui';
import { SparklesIcon, ShieldCheckIcon, DocumentTextIcon, ArrowRightIcon, BookmarkIcon } from '../icons';
import { toggleSaveSchemeId } from '../../lib/storage';

interface LandingViewProps {
  t: Dict;
  schemes?: SchemeInfo[];
  eligibility?: EligibilityMap;
  onStartWizard?: () => void;
  onSelectScheme?: (schemeId: string) => void;
  onAskChat?: (initialQuery?: string) => void;
  savedSchemeIds?: string[];
  onToggleSave?: (schemeId: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  t,
  schemes = [],
  eligibility = {},
  onStartWizard,
  onSelectScheme,
  onAskChat,
  savedSchemeIds = [],
  onToggleSave,
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleStartWizard = () => {
    if (onStartWizard) {
      onStartWizard();
    } else {
      router.push('/check');
    }
  };

  const handleSelectScheme = (schemeId: string) => {
    if (onSelectScheme) {
      onSelectScheme(schemeId);
    } else {
      router.push(`/schemes/${schemeId}`);
    }
  };

  const handleAskChat = (query?: string) => {
    if (onAskChat) {
      onAskChat(query);
    } else {
      router.push(query ? `/ask?q=${encodeURIComponent(query)}` : '/ask');
    }
  };

  const handleToggleSave = (schemeId: string) => {
    if (onToggleSave) {
      onToggleSave(schemeId);
    } else {
      toggleSaveSchemeId(schemeId);
    }
  };

  const filteredSchemes = schemes.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.summary && s.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.benefit_amount && s.benefit_amount.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(schemes.map((s) => s.category))).filter(Boolean);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-soft via-surface to-surface-2 p-6 md:p-10 border border-border-subtle shadow-sm">
        <div className="max-w-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <SparklesIcon className="h-3.5 w-3.5" />
              100% Verified Official Guidelines
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-content leading-tight">
            Find the government benefits you are entitled to.
          </h1>

          <p className="text-base md:text-lg text-muted">
            Answer a few simple questions. Sahayak matches your profile against authentic government rules and shows your benefits with exact citations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              className="tap-target px-6 text-base font-semibold shadow-md flex items-center gap-2"
              onClick={handleStartWizard}
            >
              Check My Eligibility
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              className="tap-target px-5 text-sm"
              onClick={() => handleAskChat()}
            >
              {t.chatTab}
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex flex-col gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-content">100% Verified Ground Truth</h3>
          <p className="text-xs text-muted leading-relaxed">
            Every rule and eligibility criteria is extracted directly from authentic Ministry gazettes and operational guidelines.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-success-soft text-success flex items-center justify-center">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-content">Exact Sentence Citations</h3>
          <p className="text-xs text-muted leading-relaxed">
            Ask any question in English or Hindi. Get answers with exact paragraph-level citations back to the source PDF.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-surface-2 text-content flex items-center justify-center">
            <DocumentTextIcon className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-content">Private & Offline-Ready</h3>
          <p className="text-xs text-muted leading-relaxed">
            Compliant with DPDP Act 2023. Your personal income and landholding answers stay strictly in your browser.
          </p>
        </Card>
      </div>

      {/* Explore Directory Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-content">Official Schemes Directory</h2>
            <p className="text-xs text-muted mt-0.5">Explore active welfare programs across India</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search schemes or benefits…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-border-strong bg-surface px-3 py-1.5 text-xs text-content focus:border-primary focus:outline-none w-full sm:w-64"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              selectedCategory === null
                ? 'bg-primary text-on-primary'
                : 'bg-surface-2 text-muted hover:bg-surface-3'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-2 text-muted hover:bg-surface-3'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scheme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchemes.map((scheme) => {
            const isEligible = eligibility[scheme.id]?.status === 'eligible';
            const isIneligible = eligibility[scheme.id]?.status === 'ineligible';

            return (
              <Card
                key={scheme.id}
                className="p-5 flex flex-col justify-between gap-4 hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => handleSelectScheme(scheme.id)}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="neutral">{scheme.category}</Badge>
                    {isEligible ? (
                      <Badge variant="success">Eligible</Badge>
                    ) : isIneligible ? (
                      <Badge variant="danger">Review</Badge>
                    ) : (
                      <Badge variant="neutral">{scheme.state}</Badge>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-content leading-snug">{scheme.name}</h3>

                  <p className="text-xs text-muted line-clamp-2">
                    {scheme.summary || 'Official central/state government scheme.'}
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t border-border-subtle">
                  {scheme.benefit_amount ? (
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-semibold uppercase text-faint">Benefit</span>
                      <span className="text-sm font-extrabold text-primary tabular-nums">
                        {scheme.benefit_amount}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSave(scheme.id);
                      }}
                      className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <BookmarkIcon className={`h-3.5 w-3.5 ${savedSchemeIds.includes(scheme.id) ? 'text-primary' : ''}`} />
                      {savedSchemeIds.includes(scheme.id) ? 'Saved' : 'Save'}
                    </button>

                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      {t.viewDetails} →
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
