'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Section } from '../layout/Section';
import { SchemeCard } from '../schemes/SchemeCard';
import { INDIAN_STATES } from '../../lib/i18n';
import { loadSavedProfile, saveProfile } from '../../lib/storage';
import type { SchemeInfo } from '../../lib/types';
import { ShieldCheckIcon, DocIcon, CheckIcon } from '../icons';

interface LandingViewProps {
  schemes: SchemeInfo[] | null;
}

export function LandingView({ schemes }: LandingViewProps) {
  const router = useRouter();
  const [selectedState, setSelectedState] = useState<string>('');
  const [age, setAge] = useState<string>('');

  const isFormValid = Boolean(selectedState && age && !isNaN(parseInt(age, 10)) && parseInt(age, 10) >= 18);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    const parsedAge = parseInt(age, 10);
    const current = loadSavedProfile();
    saveProfile({
      ...current,
      state: selectedState,
      age: parsedAge,
    });
    router.push('/check');
  };

  const featuredList = schemes ? schemes.slice(0, 6) : [];

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section */}
      <Section bg="bg-page" className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-1.5 text-base font-bold text-muted mb-6">
            <span className="h-2 w-2 rounded-full bg-success" />
            Deterministic rule matching against official scheme guidelines
          </div>

          <h1 className="text-display-hero text-content text-balance">
            Find out which government schemes will actually pay you.
          </h1>

          <p className="mt-5 max-w-2xl text-lg sm:text-xl text-muted leading-relaxed">
            Instant eligibility check across central and state welfare schemes with the exact line of the official guideline quoted behind every answer.
          </p>

          {/* Inline First Step of Eligibility Screener */}
          <form
            onSubmit={handleHeroSubmit}
            className="mt-10 w-full max-w-2xl rounded-2xl border border-border-strong bg-surface p-5 sm:p-7 shadow-md flex flex-col gap-4 text-left"
          >
            <div className="text-base font-bold text-content">
              Start your eligibility check:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hero-state" className="block text-base font-bold text-muted mb-1.5">
                  Your State
                </label>
                <select
                  id="hero-state"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full min-h-[48px] rounded-xl border border-border-strong bg-page px-3.5 py-2.5 text-base font-semibold text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Select your state</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st === 'Central' ? 'All India (Central Schemes)' : st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="hero-age" className="block text-base font-bold text-muted mb-1.5">
                  Your Age (Years)
                </label>
                <input
                  id="hero-age"
                  type="number"
                  min="18"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full min-h-[48px] rounded-xl border border-border-strong bg-page px-3.5 py-2.5 text-base font-semibold text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              aria-disabled={!isFormValid}
              className="mt-2 w-full min-h-[48px] rounded-xl bg-primary px-6 py-3 text-base font-bold text-on-primary shadow-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 flex items-center justify-center gap-2"
            >
              <span>Check what I qualify for</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </Section>

      {/* 2. The Differentiator, Stated Plainly */}
      <Section bg="bg-surface" className="py-14 sm:py-18 border-y border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-display-section text-content">
              Why Sahayak is different
            </h2>
            <p className="mt-3 text-base text-muted">
              We never guess, summarize without proof, or cite unverified third-party blogs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/schemes"
              className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-page p-6 sm:p-7 hover:border-border-strong transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold mb-4">
                  <DocIcon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-content group-hover:text-primary transition-colors">
                  Every answer quotes the exact line of the official guideline
                </h3>
                <p className="mt-3 text-base text-muted leading-relaxed">
                  You see the exact matched text excerpt and document reference that determines eligibility. No fabricated summaries.
                </p>
              </div>
              <div className="mt-6 text-base font-bold text-primary group-hover:underline">
                Explore guidelines →
              </div>
            </Link>

            <Link
              href="/schemes"
              className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-page p-6 sm:p-7 hover:border-border-strong transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold mb-4">
                  <CheckIcon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-content group-hover:text-primary transition-colors">
                  You see the source document and when it was last verified
                </h3>
                <p className="mt-3 text-base text-muted leading-relaxed">
                  Every scheme document is indexed directly from official government scheme portals. Certificate verification status is recorded and shown per document.
                </p>
              </div>
              <div className="mt-6 text-base font-bold text-primary group-hover:underline">
                View schemes →
              </div>
            </Link>

            <Link
              href="/privacy"
              className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-page p-6 sm:p-7 hover:border-border-strong transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold mb-4">
                  <ShieldCheckIcon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-content group-hover:text-primary transition-colors">
                  Your profile stays on your device
                </h3>
                <p className="mt-3 text-base text-muted leading-relaxed">
                  DPDP Act 2023 compliant. Your age, income, and personal details remain strictly in local browser storage and are never uploaded to remote user databases.
                </p>
              </div>
              <div className="mt-6 text-base font-bold text-primary group-hover:underline">
                Read privacy policy →
              </div>
            </Link>
          </div>
        </div>
      </Section>

      {/* 3. Featured Schemes (Rendered ONLY when API is reachable and has schemes) */}
      {featuredList.length > 0 ? (
        <Section bg="bg-page" className="py-14 sm:py-18">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="text-base font-bold uppercase tracking-wider text-muted mb-1">
                  Corpus Directory
                </div>
                <h2 className="text-display-section text-content">
                  Featured government schemes
                </h2>
              </div>

              <Link
                href="/schemes"
                className="inline-flex items-center gap-1.5 text-base font-bold text-primary hover:underline"
              >
                <span>View all {schemes ? `${schemes.length} schemes` : 'schemes'}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredList.map((scheme) => (
                <SchemeCard key={scheme.id} scheme={scheme} />
              ))}
            </div>
          </div>
        </Section>
      ) : null}

      {/* 4. How It Works */}
      <Section bg="bg-surface" className="py-14 sm:py-18 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-base font-bold uppercase tracking-wider text-muted mb-1">
              Process
            </div>
            <h2 className="text-display-section text-content">
              How eligibility evaluation works
            </h2>
            <p className="mt-3 text-base text-muted">
              Deterministic matching derived from official scheme guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col rounded-2xl border border-border-subtle bg-page p-6 sm:p-7">
              <div className="text-3xl font-extrabold text-muted mb-3 font-mono">
                01
              </div>
              <h3 className="text-xl font-bold text-content mb-2">
                Answer a few questions
              </h3>
              <p className="text-base text-muted leading-relaxed">
                Provide your basic profile details such as age, state of residence, landholding size, and annual household income.
              </p>
            </div>

            <div className="flex flex-col rounded-2xl border border-border-subtle bg-page p-6 sm:p-7">
              <div className="text-3xl font-extrabold text-muted mb-3 font-mono">
                02
              </div>
              <h3 className="text-xl font-bold text-content mb-2">
                See what you qualify for
              </h3>
              <p className="text-base text-muted leading-relaxed">
                Instant evaluation against central and state criteria with clear passes and exact failing criteria when disqualified.
              </p>
            </div>

            {/* Differentiator step: Most visual weight */}
            <div className="flex flex-col rounded-2xl border-2 border-primary bg-primary-soft p-6 sm:p-7 shadow-sm">
              <div className="text-3xl font-extrabold text-primary mb-3 font-mono">
                03
              </div>
              <h3 className="text-xl font-bold text-content mb-2">
                Read the exact guideline line
              </h3>
              <p className="text-base text-muted leading-relaxed">
                Inspect the original government document text that decided your verdict. Verify benefits with confidence before applying.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* 5. Closing Call to Action */}
      <Section bg="bg-page" className="py-16 sm:py-20 border-t border-border-subtle">
        <div className="max-w-4xl mx-auto rounded-3xl border border-border-strong bg-surface p-8 sm:p-12 text-center flex flex-col items-center gap-6 shadow-md">
          <h2 className="text-display-section text-content">
            Ready to find schemes you qualify for?
          </h2>
          <p className="max-w-xl text-base sm:text-lg text-muted leading-relaxed">
            Take 2 minutes to check your eligibility against verified central and state welfare programs.
          </p>

          <Link
            href="/check"
            className="min-h-[48px] rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-on-primary shadow-sm hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 flex items-center gap-2"
          >
            <span>Start Eligibility Check</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Section>
    </div>
  );
}
