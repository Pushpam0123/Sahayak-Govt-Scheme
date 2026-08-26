// Scheme directory with an eligibility filter, sorted eligible-first.
import { useMemo, useState } from 'react';
import type { Dict } from '../../lib/i18n';
import type { EligibilityMap, SchemeInfo } from '../../lib/types';
import { Card, CardHeader, Segmented } from '../ui';
import { DocIcon } from '../icons';
import { SchemeCard } from './SchemeCard';

type FilterKey = 'all' | 'eligible' | 'ineligible';

export function SchemeGrid({
  t,
  schemes,
  eligibility,
}: {
  t: Dict;
  schemes: SchemeInfo[];
  eligibility: EligibilityMap;
}) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const ordered = useMemo(() => {
    const statusOf = (s: SchemeInfo) => eligibility[s.id]?.status ?? 'unknown';
    const rank = (s: SchemeInfo) => {
      const status = statusOf(s);
      if (status === 'eligible') return 0;
      if (status === 'ineligible') return 1;
      return 2;
    };
    return [...schemes]
      .filter((s) => {
        const status = statusOf(s);
        if (filter === 'eligible') return status === 'eligible';
        if (filter === 'ineligible') return status === 'ineligible';
        return true;
      })
      .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }, [schemes, eligibility, filter]);

  return (
    <Card>
      <CardHeader
        icon={<DocIcon className="h-4.5 w-4.5" />}
        title={`${t.verifiedSchemes} (${schemes.length})`}
        right={
          <Segmented<FilterKey>
            size="sm"
            value={filter}
            onChange={setFilter}
            ariaLabel="Filter schemes"
            options={[
              { value: 'all', label: t.allSchemes },
              { value: 'eligible', label: t.eligible },
              { value: 'ineligible', label: t.ineligible },
            ]}
          />
        }
      />

      {schemes.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-semibold text-content">
            {t.emptySchemes}
          </p>
          <p className="mt-1 text-xs text-muted">{t.emptySchemesDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {ordered.map((s) => (
            <SchemeCard
              key={s.id}
              t={t}
              scheme={s}
              eligibility={eligibility[s.id]}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
