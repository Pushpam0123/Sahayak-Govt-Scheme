'use client';

import { useSahayak } from '../../hooks/useSahayak';
import { useLang } from '../../lib/theme';
import { TRANSLATIONS } from '../../lib/i18n';
import { LandingView } from '../../components/home/LandingView';

export default function HomePage() {
  const { lang } = useLang();
  const t = TRANSLATIONS[lang];
  const {
    schemes,
    eligibility,
    savedSchemeIds,
    toggleSaveScheme,
  } = useSahayak();

  return (
    <LandingView
      t={t}
      schemes={schemes}
      eligibility={eligibility}
      savedSchemeIds={savedSchemeIds}
      onToggleSave={toggleSaveScheme}
    />
  );
}
