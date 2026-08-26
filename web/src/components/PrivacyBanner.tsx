import React, { useState } from 'react';
import type { Dict } from '../lib/i18n';
import { ShieldCheckIcon } from './icons';

interface PrivacyBannerProps {
  t: Dict;
  onPurgeData: () => void;
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ onPurgeData }) => {
  const [dismissed, setDismissed] = useState<boolean>(
    Boolean(sessionStorage.getItem('sahayak_privacy_dismissed'))
  );

  if (dismissed) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary-soft/50 px-4 py-2.5 text-xs text-content">
      <div className="flex items-center gap-2">
        <ShieldCheckIcon className="h-4 w-4 text-primary shrink-0" />
        <span>
          <strong>DPDP Act 2023 Compliant:</strong> Your personal eligibility answers (age, income, caste) are stored exclusively in your browser and are never saved on our servers.
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to clear your saved profile and document checklists?')) {
              onPurgeData();
            }
          }}
          className="font-medium text-danger hover:underline cursor-pointer"
        >
          Purge My Data
        </button>
        <button
          onClick={() => {
            sessionStorage.setItem('sahayak_privacy_dismissed', 'true');
            setDismissed(true);
          }}
          className="font-semibold text-muted hover:text-content cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
