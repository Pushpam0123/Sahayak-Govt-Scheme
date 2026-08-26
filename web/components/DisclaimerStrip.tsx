'use client';

// Standing, non-dismissible reminder shown on every tab: Sahayak
// summarises official documents, it is not the government, and its
// answer is not a decision. Deliberately quiet — a standing condition,
// not an alarm — so it must not compete visually with the offline
// banner or any other transient alert.
import type { Dict } from '../lib/i18n';
import { useLang } from '../lib/theme';
import { LANGUAGE_METADATA } from '../lib/i18n';

const ENGLISH_UNREVIEWED_NOTICE =
  'Note: This translation is machine-generated and not yet reviewed by a native speaker. Refer to official English or Hindi guideline texts in case of ambiguity.';

export function DisclaimerStrip({ t }: { t: Dict }) {
  const { lang } = useLang();
  const meta = LANGUAGE_METADATA[lang];

  return (
    <div className="rounded-2xl bg-surface-2 px-5 py-3.5 text-center text-base text-muted flex flex-col gap-2 border border-border-subtle">
      <p className="font-medium leading-relaxed">{t.disclaimer}</p>
      {!meta?.reviewed ? (
        <div className="flex flex-col gap-1 text-base text-faint leading-relaxed border-t border-border-subtle/50 pt-2">
          {t.unreviewedTranslationNotice && (
            <p className="font-medium text-muted">{t.unreviewedTranslationNotice}</p>
          )}
          {lang !== 'en' && (
            <p className="text-sm italic">{ENGLISH_UNREVIEWED_NOTICE}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
