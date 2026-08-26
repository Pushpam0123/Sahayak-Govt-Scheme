'use client';

import { useSahayak } from '../../../hooks/useSahayak';
import { useLang } from '../../../lib/theme';
import { TRANSLATIONS } from '../../../lib/i18n';
import { SavedSchemesView } from '../../../components/saved/SavedSchemesView';

export default function SavedPage() {
  const { lang } = useLang();
  const t = TRANSLATIONS[lang];
  const {
    schemes,
    savedSchemeIds,
    toggleSaveScheme,
    eligibility,
  } = useSahayak();

  return (
    <SavedSchemesView
      t={t}
      schemes={schemes}
      savedSchemeIds={savedSchemeIds}
      onToggleSave={toggleSaveScheme}
      eligibility={eligibility}
    />
  );
}
