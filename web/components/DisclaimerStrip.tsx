'use client';

// Standing, non-dismissible reminder shown on every tab: Sahayak
// summarises official documents, it is not the government, and its
// answer is not a decision. Deliberately quiet — a standing condition,
// not an alarm — so it must not compete visually with the offline
// banner or any other transient alert.
import type { Dict } from '../lib/i18n';

export function DisclaimerStrip({ t }: { t: Dict }) {
  return (
    <p className="rounded-lg bg-surface-2 px-4 py-2 text-center text-xs text-muted">
      {t.disclaimer}
    </p>
  );
}
