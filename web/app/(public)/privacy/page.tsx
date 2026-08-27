import type { Metadata } from 'next';
import { Card } from '../../../components/ui';
import { ShieldCheckIcon } from '../../../components/icons';
import { PrivacyErasureControl } from '../../../components/privacy/PrivacyErasureControl';

export const metadata: Metadata = {
  title: 'Privacy Notice — DPDP Act 2023 Compliance | Sahayak',
  description: 'Sahayak privacy notice and data protection commitment under the Digital Personal Data Protection Act, 2023.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-8 py-10 px-4 sm:px-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheckIcon className="h-7 w-7 text-primary" />
          <h1 className="text-display-section text-content">Privacy Notice</h1>
        </div>
        <p className="text-base text-muted">
          Digital Personal Data Protection (DPDP) Act, 2023 Compliance & Citizen Rights
        </p>
      </div>

      <Card className="p-6 md:p-8 flex flex-col gap-8 border border-border-subtle bg-surface">
        <div>
          <h2 className="text-lg font-bold text-content">1. Purpose Limitation</h2>
          <p className="text-base text-muted mt-2 leading-relaxed">
            Demographic information you enter (age, state of residence, gender, caste category, annual household income, and agricultural landholding size) is collected solely for evaluating eligibility against verified rules of central and state government welfare schemes.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content">2. Local Storage & Transmission Transparency</h2>
          <p className="text-base text-muted mt-2 leading-relaxed">
            Your demographic profile, saved scheme bookmarks, and document checklist answers are stored locally on your own device in your browser (<code className="bg-surface-2 px-2 py-0.5 rounded text-sm font-bold">localStorage</code>). When you request eligibility matching, these demographic values (including household income and caste) are transmitted over encrypted HTTPS to our rule engine (<code className="bg-surface-2 px-2 py-0.5 rounded text-sm font-bold">POST /api/v1/eligibility/match-all</code>) statelessly to compute matching criteria. They are not saved in any remote server database, nor associated with a user account.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content">3. Zero Profiling & Tracking</h2>
          <p className="text-base text-muted mt-2 leading-relaxed">
            We do not sell, license, or share your data with advertisers, third-party trackers, or commercial brokers.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content">4. Right to Erasure (DPDP Act 2023)</h2>
          <p className="text-base text-muted mt-2 leading-relaxed">
            Under the Digital Personal Data Protection Act, 2023, you have the absolute right to erase all your stored personal data at any time.
          </p>
          <PrivacyErasureControl />
        </div>

        <div>
          <h2 className="text-lg font-bold text-content">5. Official Sources & Grounded Truth</h2>
          <p className="text-base text-muted mt-2 leading-relaxed">
            Sahayak acts as an informational navigation aid based on verified official government guidelines and rules. The portal does not replace formal application filing through respective government portals.
          </p>
        </div>
      </Card>
    </div>
  );
}
