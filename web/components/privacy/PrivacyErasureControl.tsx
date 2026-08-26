'use client';

import React, { useState } from 'react';
import { clearCitizenData } from '../../lib/storage';
import { Button } from '../ui';
import { CheckCircleIcon } from '../icons';

export function PrivacyErasureControl() {
  const [confirmed, setConfirmed] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    clearCitizenData();
    setConfirmed(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 5000);
  };

  return (
    <div className="mt-4 p-5 rounded-2xl border border-border-strong bg-surface-2 flex flex-col gap-3">
      <h3 className="text-base font-bold text-content">Exercise Your Right to Erasure (DPDP Act 2023)</h3>
      <p className="text-base text-muted leading-relaxed">
        Click below to immediately delete your demographic profile (age, state, gender, caste, income, landholding), saved schemes, and document checklists from this browser. Interface preferences (theme, language) will remain intact.
      </p>

      {cleared && (
        <div className="p-3.5 rounded-xl border border-success/30 bg-success-soft text-success text-base font-bold flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          <span>All stored profile data and saved schemes have been erased from your browser.</span>
        </div>
      )}

      {confirmed ? (
        <div className="p-4 rounded-xl border border-danger/30 bg-danger-soft flex flex-col gap-3">
          <p className="text-base font-bold text-danger">Are you sure you want to permanently erase your profile?</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="danger"
              onClick={handleClear}
              className="min-h-[48px] px-5 text-base font-bold"
            >
              Confirm & Erase All Stored Data
            </Button>
            <Button
              variant="secondary"
              onClick={() => setConfirmed(false)}
              className="min-h-[48px] px-4 text-base font-semibold"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="pt-1">
          <Button
            variant="danger"
            onClick={() => setConfirmed(true)}
            className="min-h-[48px] px-5 text-base font-bold"
          >
            Erase All My Stored Data
          </Button>
        </div>
      )}
    </div>
  );
}
