// Prominent, honest banner shown when the backend is unreachable and the
// UI is populated with sample data.
import type { Dict } from '../lib/i18n';
import { AlertIcon } from './icons';

export function OfflineBanner({ t }: { t: Dict }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3"
    >
      <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
      <div className="text-sm">
        <span className="font-semibold text-warn">Sample data</span>
        <span className="text-content"> — {t.offlineBanner}</span>
      </div>
    </div>
  );
}
