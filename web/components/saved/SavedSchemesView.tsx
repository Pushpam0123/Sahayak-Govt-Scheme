'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Dict } from '../../lib/i18n';
import type { EligibilityMap, SchemeInfo } from '../../lib/types';
import { Card, Badge, Button } from '../ui';
import { BookmarkIcon, ArrowRightIcon } from '../icons';
import { toggleSaveSchemeId } from '../../lib/storage';

interface SavedSchemesViewProps {
  t: Dict;
  schemes?: SchemeInfo[];
  savedSchemeIds?: string[];
  onToggleSave?: (schemeId: string) => void;
  onSelectScheme?: (schemeId: string) => void;
  eligibility?: EligibilityMap;
}

export const SavedSchemesView: React.FC<SavedSchemesViewProps> = ({
  t,
  schemes = [],
  savedSchemeIds = [],
  onToggleSave,
  onSelectScheme,
  eligibility = {},
}) => {
  const router = useRouter();
  const savedSchemes = schemes.filter((s) => savedSchemeIds.includes(s.id));

  const handleSelectScheme = (schemeId: string) => {
    if (onSelectScheme) {
      onSelectScheme(schemeId);
    } else {
      router.push(`/schemes/${schemeId}`);
    }
  };

  const handleToggleSave = (schemeId: string) => {
    if (onToggleSave) {
      onToggleSave(schemeId);
    } else {
      toggleSaveSchemeId(schemeId);
    }
  };

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6 pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-content">{t.savedTab}</h1>
        <p className="text-sm text-muted mt-1">
          Track your saved schemes, application links, and document checklists offline.
        </p>
      </div>

      {savedSchemes.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center gap-3">
          <div className="rounded-full bg-surface-2 p-3 text-faint">
            <BookmarkIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-content">No schemes saved yet</h3>
          <p className="text-xs text-muted max-w-sm">
            Save schemes from the directory or eligibility wizard to prepare your application documents.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {savedSchemes.map((scheme) => {
            const verdict = eligibility[scheme.id]?.status;

            return (
              <Card
                key={scheme.id}
                className="p-6 hover:border-primary/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">{scheme.category}</Badge>
                    <Badge variant="neutral">{scheme.state}</Badge>
                    {verdict === 'eligible' && <Badge variant="success">Eligible</Badge>}
                    {verdict === 'ineligible' && <Badge variant="danger">Not eligible</Badge>}
                  </div>

                  <h3 className="text-lg font-bold text-content">{scheme.name}</h3>

                  {scheme.benefit_amount && (
                    <p className="text-base font-extrabold text-primary tabular-nums">
                      {scheme.benefit_amount}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => handleToggleSave(scheme.id)}
                  >
                    Remove
                  </Button>
                  <Button
                    variant="primary"
                    className="text-xs font-semibold"
                    onClick={() => handleSelectScheme(scheme.id)}
                  >
                    {t.viewDetails} <ArrowRightIcon className="h-3.5 w-3.5 ml-1 inline" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
