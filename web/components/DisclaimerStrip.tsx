'use client';

// Standing, non-dismissible reminder shown on every tab: Sahayak
// summarises official documents, it is not the government, and its
// answer is not a decision. Deliberately quiet — a standing condition,
// not an alarm — so it must not compete visually with the offline
// banner or any other transient alert.
import type { Dict } from '../lib/i18n';
import { useLang } from '../lib/theme';
import { LANGUAGE_METADATA } from '../lib/i18n';

export function DisclaimerStrip({ t }: { t: Dict }) {
  const { lang } = useLang();
  const meta = LANGUAGE_METADATA[lang];

  return (
    <div className="rounded-xl bg-surface-2 px-4 py-2.5 text-center text-sm text-muted flex flex-col gap-1 border border-border-subtle">
      <p>{t.disclaimer}</p>
      {!meta?.reviewed ? (
        <p className="text-xs text-faint">
          Note: This {meta?.label ?? lang} translation is machine-generated and not yet reviewed by a native speaker. Refer to official English or Hindi guideline texts in case of ambiguity.
        </p>
      ) : null}
    </div>
  );
}
