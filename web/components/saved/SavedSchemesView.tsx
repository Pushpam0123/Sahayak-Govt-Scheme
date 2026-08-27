'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Dict } from '../../lib/i18n';
import type { EligibilityMap, SchemeInfo } from '../../lib/types';
import { Card, Badge, Button } from '../ui';
import { BookmarkIcon, ArrowRightIcon, AlertIcon, CheckCircleIcon } from '../icons';
import { toggleSaveSchemeId, clearCitizenData } from '../../lib/storage';

interface SavedSchemesViewProps {
  t: Dict;
  schemes?: SchemeInfo[];
  savedSchemeIds?: string[];
  onToggleSave?: (schemeId: string) => void;
  onClearAllData?: () => void;
  onSelectScheme?: (schemeId: string) => void;
  eligibility?: EligibilityMap;
}

export const SavedSchemesView: React.FC<SavedSchemesViewProps> = ({
  t,
  schemes = [],
  savedSchemeIds = [],
  onToggleSave,
  onClearAllData,
  onSelectScheme,
  eligibility = {},
}) => {
  const router = useRouter();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);

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

  const handleExecuteDelete = () => {
    if (onClearAllData) {
      onClearAllData();
    } else {
      clearCitizenData();
    }
    setShowConfirmDelete(false);
    setDeletedSuccess(true);
    setTimeout(() => setDeletedSuccess(false), 5000);
  };

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-8 pb-16">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-content">{t.savedTab}</h1>
        <p className="text-base text-muted mt-1">
          Track your saved schemes, application links, and document checklists offline.
        </p>
      </div>

      {deletedSuccess && (
        <div className="rounded-2xl border border-success/30 bg-success-soft p-4 text-base font-semibold text-success flex items-center gap-3 animate-fade-rise">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          <span>All saved profile data, scheme bookmarks, and document checklists have been permanently erased from this device.</span>
        </div>
      )}

      {savedSchemes.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center gap-3">
          <div className="rounded-full bg-surface-2 p-3 text-faint">
            <BookmarkIcon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-content">No schemes saved yet</h3>
          <p className="text-base text-muted max-w-md">
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
                    className="text-sm min-h-[44px]"
                    onClick={() => handleToggleSave(scheme.id)}
                  >
                    Remove
                  </Button>
                  <Button
                    variant="primary"
                    className="text-sm font-semibold min-h-[44px]"
                    onClick={() => handleSelectScheme(scheme.id)}
                  >
                    {t.viewDetails} <ArrowRightIcon className="h-4 w-4 ml-1 inline" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* DPDP Act 2023: Data Deletion & Privacy Management */}
      <Card className="p-6 sm:p-8 border border-border-subtle bg-surface flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-danger-soft text-danger shrink-0 mt-0.5">
            <AlertIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-content">Data Management & Privacy (DPDP Act 2023)</h2>
            <p className="text-base text-muted mt-1 leading-relaxed">
              Your demographic profile (age, state, gender, caste category, annual income, agricultural land) and saved scheme bookmarks are stored locally on this device in your browser. You have the right to erase all stored data at any time.
            </p>
          </div>
        </div>

        {showConfirmDelete ? (
          <div className="mt-2 rounded-2xl border border-danger/30 bg-danger-soft p-5 flex flex-col gap-3 animate-fade-rise">
            <p className="text-base font-bold text-danger">
              Are you sure you want to permanently erase your profile and all saved schemes?
            </p>
            <p className="text-sm text-content">
              This action cannot be undone. All your answers on age, state, caste, income, and saved bookmarks will be deleted immediately from this browser. (Interface preferences like theme and language will be kept).
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="danger"
                className="min-h-[48px] px-5 text-sm font-bold"
                onClick={handleExecuteDelete}
              >
                Yes, Permanently Erase All Data
              </Button>
              <Button
                variant="secondary"
                className="min-h-[48px] px-5 text-sm font-semibold"
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border-subtle">
            <Button
              variant="danger"
              className="min-h-[48px] px-5 text-sm font-bold"
              onClick={() => setShowConfirmDelete(true)}
            >
              Erase My Stored Profile & Data
            </Button>
            <Link
              href="/privacy"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Read Full Privacy & DPDP Notice →
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};
