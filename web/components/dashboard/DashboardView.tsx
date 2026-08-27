'use client';

// Citizen dashboard: summary tiles, profile form, eligibility charts,
// scheme directory, and the advanced document explorer.
import { useMemo } from 'react';
import type { Dict } from '../../lib/i18n';
import type { CitizenProfile, EligibilityMap, SchemeInfo } from '../../lib/types';
import { CheckIcon, DocIcon, AlertIcon, HelpIcon } from '../icons';
import { DashboardCharts, type CategoryDatum } from './Charts';
import { DocumentExplorer } from './DocumentExplorer';
import { EligibilityForm } from './EligibilityForm';
import { SchemeGrid } from './SchemeGrid';
import { StatTiles, type Stat } from './StatTiles';

interface Props {
  t: Dict;
  schemes: SchemeInfo[];
  eligibility: EligibilityMap;
  profile: CitizenProfile;
  setField: <K extends keyof CitizenProfile>(field: K, value: CitizenProfile[K]) => void;
  offline: boolean;
}

export function DashboardView({
  t,
  schemes,
  eligibility,
  profile,
  setField,
  offline,
}: Props) {
  const derived = useMemo(() => {
    let eligible = 0;
    let ineligible = 0;
    let noRules = 0;
    const byCategory = new Map<string, number>();

    for (const s of schemes) {
      const status = eligibility[s.id]?.status ?? 'unknown';
      if (status === 'eligible') eligible += 1;
      else if (status === 'ineligible') ineligible += 1;
      else noRules += 1;
      byCategory.set(s.category, (byCategory.get(s.category) ?? 0) + 1);
    }

    const categoryData: CategoryDatum[] = [...byCategory.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      eligible,
      ineligible,
      noRules,
      categoryData,
    };
  }, [schemes, eligibility]);

  const stats: Stat[] = [
    {
      label: t.statTotal,
      value: schemes.length,
      tone: 'primary',
      icon: <DocIcon className="h-5 w-5" />,
    },
    {
      label: t.statEligible,
      value: derived.eligible,
      tone: 'success',
      icon: <CheckIcon className="h-5 w-5" />,
    },
    {
      label: t.statReview,
      value: derived.ineligible,
      tone: 'muted',
      icon: <AlertIcon className="h-5 w-5" />,
    },
    {
      label: t.statUnassessed,
      value: derived.noRules,
      tone: 'muted',
      icon: <HelpIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-lg font-bold text-content">{t.dashboardTitle}</h2>
        <p className="mt-0.5 text-sm text-muted">{t.dashboardSubtitle}</p>
      </div>

      <StatTiles stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <EligibilityForm t={t} profile={profile} setField={setField} />
        </div>
        <div className="lg:col-span-8">
          <DashboardCharts
            t={t}
            eligible={derived.eligible}
            ineligible={derived.ineligible}
            noRules={derived.noRules}
            categoryData={derived.categoryData}
          />
        </div>
      </div>

      <SchemeGrid t={t} schemes={schemes} eligibility={eligibility} />

      <DocumentExplorer t={t} offline={offline} />
    </div>
  );
}
