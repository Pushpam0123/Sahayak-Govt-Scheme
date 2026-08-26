import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Citizen Services — Sahayak',
  description: 'Explore citizen services and welfare scheme assistance across central and state ministries.',
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6 py-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-content">Citizen Services</h1>
        <p className="text-sm text-muted mt-1">
          Direct access to official welfare schemes, applications, and support across ministries.
        </p>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface p-8 text-center flex flex-col items-center gap-4">
        <p className="text-sm text-muted max-w-md">
          Browse our complete catalog of verified central and state government welfare schemes or check your personalized eligibility.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/schemes"
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm hover:bg-primary-hover transition-colors"
          >
            Browse All Schemes
          </Link>
          <Link
            href="/check"
            className="rounded-xl border border-border-strong bg-surface px-5 py-2.5 text-xs font-semibold text-content hover:bg-surface-2 transition-colors"
          >
            Eligibility Screener
          </Link>
        </div>
      </div>
    </div>
  );
}
