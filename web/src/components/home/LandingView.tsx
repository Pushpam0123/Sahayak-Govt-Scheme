import React, { useState } from 'react';
import type { Dict } from '../../lib/i18n';
import type { EligibilityMap, SchemeInfo } from '../../lib/types';
import { Card, Badge, Button } from '../ui';
import { SparklesIcon, ShieldCheckIcon, DocumentTextIcon, ArrowRightIcon, BookmarkIcon } from '../icons';

interface LandingViewProps {
  t: Dict;
  schemes: SchemeInfo[];
  eligibility: EligibilityMap;
  onStartWizard: () => void;
  onSelectScheme: (schemeId: string) => void;
  onAskChat: (initialQuery?: string) => void;
  savedSchemeIds: string[];
  onToggleSave: (schemeId: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  t,
  schemes,
  eligibility,
  onStartWizard,
  onSelectScheme,
  onAskChat,
  savedSchemeIds,
  onToggleSave,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
              onClick={onStartWizard}
            >
              Check My Eligibility
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              className="tap-target px-5 text-sm"
              onClick={() => onAskChat()}
            >
              {t.chatTab}
            </Button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 mt-8 border-t border-border-subtle/80">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-success-soft p-2 text-success">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-content">Zero Fabrication</p>
              <p className="text-xs text-muted">Answers backed by verified PDFs</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary-soft p-2 text-primary">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-content">Document Checklist</p>
              <p className="text-xs text-muted">Know what to take to the seva kendra</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-warn-soft p-2 text-warn">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-content">Free & Privacy-First</p>
              <p className="text-xs text-muted">Your profile is stored on your device</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search & Category Filter */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-content">{t.verifiedSchemes}</h2>
            <p className="text-xs text-muted">Browse active schemes with verified financial assistance</p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search schemes or benefits…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder-faint focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-on-primary'
                : 'bg-surface-2 text-muted hover:bg-surface-3'
            }`}
          >
            {t.allCategories} ({schemes.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-2 text-muted hover:bg-surface-3'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scheme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchemes.map((scheme) => {
          const isSaved = savedSchemeIds.includes(scheme.id);
          const verdict = eligibility[scheme.id]?.status;

          return (
            <Card
              key={scheme.id}
              className="flex flex-col justify-between p-5 hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => onSelectScheme(scheme.id)}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="neutral">{scheme.category}</Badge>
                    <Badge variant="neutral">{scheme.state}</Badge>
                    {verdict === 'eligible' && <Badge variant="success">Eligible</Badge>}
                    {verdict === 'ineligible' && <Badge variant="danger">Not eligible</Badge>}
                  </div>
                  <button
                    type="button"
                    title={isSaved ? 'Remove from saved' : 'Save scheme'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isSaved ? 'text-primary bg-primary-soft' : 'text-faint hover:text-content'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(scheme.id);
                    }}
                  >
                    <BookmarkIcon className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-content group-hover:text-primary transition-colors">
                    {scheme.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    {scheme.summary || 'Official government welfare scheme.'}
                  </p>
                </div>

                {scheme.benefit_amount && (
                  <div className="rounded-lg bg-surface-2 p-3 border border-border-subtle">
                    <p className="text-[10px] font-medium text-muted uppercase tracking-wider">Benefit</p>
                    <p className="text-base font-extrabold text-content tabular-nums text-primary">
                      {scheme.benefit_amount}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-muted">
                <span>{scheme.application_mode ? `Apply: ${scheme.application_mode}` : 'Official portal'}</span>
                <span className="font-medium text-primary flex items-center gap-1">
                  View guide <ArrowRightIcon className="h-3 w-3" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
