import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '../../../components/layout/Section';
import { CheckIcon, DocIcon, ChatIcon, BookmarkIcon } from '../../../components/icons';

export const metadata: Metadata = {
  title: 'Citizen Services — Sahayak',
  description:
    'Explore citizen tools and welfare scheme services across central and state ministries with verified official guidelines.',
};

export default function ServicesPage() {
  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-140px)]">
      {/* Header section */}
      <Section bg="bg-page" className="py-12 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-display-section text-content">
              Citizen Services
            </h1>
            <p className="mt-3 text-lg text-muted leading-relaxed">
              Explore the four core services available in Sahayak to help you identify, verify, and prepare for government welfare schemes.
            </p>
          </div>
        </div>
      </Section>

      {/* Services Grid */}
      <Section bg="bg-page" className="py-12 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Eligibility Screener */}
            <div className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface p-7 sm:p-8 hover:border-border-strong hover:shadow-md transition-all">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold mb-5">
                  <CheckIcon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-content mb-3 group-hover:text-primary transition-colors">
                  Deterministic Eligibility Screener
                </h2>
                <p className="text-base text-muted leading-relaxed">
                  Evaluate your qualifications against every official scheme rule in our corpus. You receive instant verdicts showing passed criteria and specific disqualifying rules.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-border-subtle">
                <Link
                  href="/check"
                  className="min-h-[48px] inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-base font-bold text-on-primary shadow-sm hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span>Start Eligibility Check</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* 2. Grounded Scheme Assistant */}
            <div className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface p-7 sm:p-8 hover:border-border-strong hover:shadow-md transition-all">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold mb-5">
                  <ChatIcon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-content mb-3 group-hover:text-primary transition-colors">
                  Grounded AI Assistant
                </h2>
                <p className="text-base text-muted leading-relaxed">
                  Ask conversational questions in English or Hindi. Every response is strictly grounded in official ministry documents and includes exact source citations.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-border-subtle">
                <Link
                  href="/ask"
                  className="min-h-[48px] inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-base font-bold text-on-primary shadow-sm hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span>Open Chat Assistant</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* 3. Scheme Directory & Guidelines */}
            <div className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface p-7 sm:p-8 hover:border-border-strong hover:shadow-md transition-all">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold mb-5">
                  <DocIcon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-content mb-3 group-hover:text-primary transition-colors">
                  Scheme Directory & Guidelines
                </h2>
                <p className="text-base text-muted leading-relaxed">
                  Search and filter central and state welfare programs by state and category. Inspect benefit amounts, application requirements, and source documents.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-border-subtle">
                <Link
                  href="/schemes"
                  className="min-h-[48px] inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-base font-bold text-on-primary shadow-sm hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span>Browse Scheme Catalog</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* 4. Saved Schemes & Bookmarks */}
            <div className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface p-7 sm:p-8 hover:border-border-strong hover:shadow-md transition-all">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold mb-5">
                  <BookmarkIcon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-content mb-3 group-hover:text-primary transition-colors">
                  Saved Applications & Bookmarks
                </h2>
                <p className="text-base text-muted leading-relaxed">
                  Save schemes to your private local profile for offline review. Your saved schemes and criteria checks stay entirely on your device under DPDP standards.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-border-subtle">
                <Link
                  href="/saved"
                  className="min-h-[48px] inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-base font-bold text-on-primary shadow-sm hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span>View Saved Schemes</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
