'use client';

import { useSahayak } from '../../hooks/useSahayak';
import { useLang } from '../../lib/theme';
import { TRANSLATIONS } from '../../lib/i18n';
import { EligibilityWizard } from '../../components/wizard/EligibilityWizard';

export default function CheckPage() {
  const { lang } = useLang();
  const t = TRANSLATIONS[lang];
  const {
    profile,
    setProfileField,
    eligibility,
    schemes,
    savedSchemeIds,
    toggleSaveScheme,
    resetProfile,
  } = useSahayak();

  return (
    <EligibilityWizard
      t={t}
      profile={profile}
      setField={setProfileField}
      eligibility={eligibility}
      schemes={schemes}
      savedSchemeIds={savedSchemeIds}
      onToggleSave={toggleSaveScheme}
      onResetProfile={resetProfile}
    />
  );
}
