'use client';

import { useSahayak } from '../../../hooks/useSahayak';
import { useLang } from '../../../lib/theme';
import { TRANSLATIONS } from '../../../lib/i18n';
import { SchemeDetailView } from '../../../components/schemes/SchemeDetailView';
import type { SchemeDetail } from '../../../lib/types';

export function SchemeClient({
  slug,
  initialScheme,
}: {
  slug: string;
  initialScheme?: SchemeDetail | null;
}) {
  const { lang } = useLang();
  const t = TRANSLATIONS[lang];
  const {
    eligibility,
    savedSchemeIds,
    toggleSaveScheme,
    checkedDocs,
    toggleDocChecked,
  } = useSahayak();

  return (
    <SchemeDetailView
      t={t}
      schemeId={slug}
      initialScheme={initialScheme}
      verdict={eligibility[slug]}
      isSaved={savedSchemeIds.includes(slug)}
      onToggleSave={toggleSaveScheme}
      checkedDocs={checkedDocs}
      onToggleDocChecked={toggleDocChecked}
    />
  );
}
