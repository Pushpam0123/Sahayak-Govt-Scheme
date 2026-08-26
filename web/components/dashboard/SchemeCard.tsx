// A single scheme in the directory, with the citizen's eligibility verdict.
import type { Dict } from '../../lib/i18n';
import { categoryGlyph } from '../../lib/format';
import type { EligibilityStatus, SchemeInfo } from '../../lib/types';
import { Badge } from '../ui';
import { AlertIcon, CheckIcon } from '../icons';

export function SchemeCard({
  t,
  scheme,
  eligibility,
}: {
  t: Dict;
  scheme: SchemeInfo;
  eligibility?: EligibilityStatus;
}) {
  // "unknown" covers both a scheme the eligibility map has no entry for yet
  // (no profile match run) and one the backend explicitly marked unknown
  // (no verified rules for it). Both read the same way to the citizen: we
  // don't have a verdict, not a soft "no".
  const status = eligibility?.status ?? 'unknown';

  return (
    <div className="flex flex-col rounded-xl border border-border-subtle bg-surface p-4 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-lg"
          >
            {categoryGlyph(scheme.category)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-content">
              {scheme.name}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {scheme.state} · {scheme.category}
            </p>
          </div>
        </div>

        {status === 'eligible' ? (
          <Badge tone="success">
            <CheckIcon className="h-3 w-3" /> {t.eligible}
          </Badge>
        ) : status === 'ineligible' ? (
          <Badge tone="danger">
            <AlertIcon className="h-3 w-3" /> {t.ineligible}
          </Badge>
        ) : (
          <Badge tone="neutral">{t.noRules}</Badge>
        )}
      </div>

      {status === 'ineligible' && eligibility && eligibility.failed_rules.length > 0 ? (
        <div className="mt-3 rounded-lg bg-danger-soft px-3 py-2">
          <p className="mb-1 text-[11px] font-semibold text-danger">
            {t.failedCriteria}
          </p>
          <ul className="list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-content">
            {eligibility.failed_rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {status === 'eligible' ? (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-success">
          <CheckIcon className="h-3.5 w-3.5" /> {t.matchesProfile}
        </p>
      ) : null}
    </div>
  );
}
