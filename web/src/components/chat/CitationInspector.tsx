// Right-hand panel that shows the official source behind a selected citation.
import type { Dict } from '../../lib/i18n';
import type { CitationInfo } from '../../lib/types';
import { Card, CardHeader } from '../ui';
import { DocIcon, ExternalIcon } from '../icons';

export function CitationInspector({
  t,
  citation,
}: {
  t: Dict;
  citation: CitationInfo | null;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        icon={<DocIcon className="h-4.5 w-4.5" />}
        title={t.citationInspector}
      />

      {citation ? (
        <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
          <div>
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-faint">
              {t.citationIndex}
            </span>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-primary-soft px-1.5 text-xs font-bold text-primary">
              {citation.n}
            </span>
          </div>

          <div>
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-faint">
              {t.headingHierarchy}
            </span>
            <p className="text-sm font-semibold leading-relaxed text-content">
              {citation.heading_path}
            </p>
          </div>

          <div>
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-faint">
              {t.sourceDoc}
            </span>
            <a
              href={citation.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t.viewSource}
              <ExternalIcon className="h-3.5 w-3.5" />
            </a>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-faint">
              {t.sourceQuote}
            </span>
            <blockquote className="rounded-lg border-l-2 border-primary bg-surface-2 p-3 text-sm leading-relaxed text-content">
              {citation.quote}
            </blockquote>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <DocIcon className="mb-3 h-10 w-10 text-faint opacity-50" />
          <p className="text-sm font-semibold text-content">{t.noCitation}</p>
          <p className="mt-1 max-w-[220px] text-xs text-muted">
            {t.noCitationDesc}
          </p>
        </div>
      )}
    </Card>
  );
}
