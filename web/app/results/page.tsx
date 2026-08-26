'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSahayak } from '../../hooks/useSahayak';
import { useLang } from '../../lib/theme';
import { TRANSLATIONS } from '../../lib/i18n';
import { EligibilityWizard } from '../../components/wizard/EligibilityWizard';
import { loadSavedProfile } from '../../lib/storage';

export default function ResultsPage() {
  const router = useRouter();
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

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = loadSavedProfile();
    const hasProfile =
      saved.age !== null ||
      saved.state !== null ||
      saved.gender !== null ||
      saved.annual_income !== null;

    if (!hasProfile) {
      router.replace('/check');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
        <p className="text-sm">Calculating eligibility matches…</p>
      </div>
    );
  }

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
      initialStep={7}
      onEditAnswers={() => router.push('/check')}
    />
  );
}
