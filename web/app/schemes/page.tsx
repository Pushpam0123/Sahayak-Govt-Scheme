'use client';

import { useSahayak } from '../../hooks/useSahayak';
import { useLang } from '../../lib/theme';
import { TRANSLATIONS } from '../../lib/i18n';
import { DashboardView } from '../../components/dashboard/DashboardView';

export default function SchemesPage() {
  const { lang } = useLang();
  const t = TRANSLATIONS[lang];
  const {
    schemes,
    eligibility,
    profile,
    setProfileField,
    offline,
  } = useSahayak();

  return (
    <DashboardView
      t={t}
      schemes={schemes}
      eligibility={eligibility}
      profile={profile}
      setField={setProfileField}
      offline={offline}
    />
  );
}
