import type { Metadata } from 'next';
import { Card } from '../../../components/ui';
import { ShieldCheckIcon } from '../../../components/icons';

export const metadata: Metadata = {
  title: 'Privacy Notice — DPDP Act 2023 Compliance | Sahayak',
  description: 'Sahayak privacy notice and data protection commitment under the Digital Personal Data Protection Act, 2023.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6 py-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheckIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-content">Privacy Notice</h1>
        </div>
        <p className="text-sm text-muted">
          Digital Personal Data Protection (DPDP) Act, 2023 Compliance & Citizen Rights
        </p>
      </div>

      <Card className="p-6 md:p-8 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold text-content">1. Purpose Limitation</h2>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            Personal data you enter (such as age, state of residence, gender, caste category, annual income, and landholding size) is collected and processed solely for the purpose of matching your criteria against official eligibility rules of central and state government welfare schemes.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content">2. Local-Only Storage</h2>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            Your personal profile and document checklist answers are stored strictly within your own device browser local storage (<code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded">localStorage</code>). Sahayak does not transmit your personal identifying profile to remote database storage.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content">3. Zero Profiling & Tracking</h2>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            We do not sell, license, or share your profile data with commercial third-party advertisers or data brokers. All eligibility matching queries are evaluated statelessly.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content">4. Right to Erasure</h2>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            Under the DPDP Act 2023, you have the right to erase all personal data at any time. You can click "Purge My Data" or "Reset Profile" across the portal to instantly clear all local cookies and storage entries.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content">5. Official Sources & Grounded Truth</h2>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            Sahayak acts as an informational navigation aid based on publicly verified government gazettes and guidelines. The portal does not replace official ministry adjudication or formal application filing through respective government portals.
          </p>
        </div>
      </Card>
    </div>
  );
}
