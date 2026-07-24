// Dashboard data-viz: an eligibility donut (status colours) and a
// single-hue schemes-by-category bar chart. Colours come from design tokens
// so both themes are covered; identity is never colour-alone (labels + counts).
import type { Dict } from '../../lib/i18n';
import { Card, CardHeader } from '../ui';
import { ChartIcon } from '../icons';

export interface CategoryDatum {
  category: string;
  count: number;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function Donut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  centerValue: number;
  centerLabel: string;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const r = 62;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-40 w-40 shrink-0">
        <svg
          viewBox="0 0 160 160"
          className="h-40 w-40 -rotate-90"
          role="img"
          aria-label="Eligibility breakdown"
        >
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="18"
          />
          {segments.map((seg) => {
            if (seg.value === 0) return null;
            const frac = seg.value / total;
            const dash = frac * c;
            const el = (
              <circle
                key={seg.label}
                cx="80"
                cy="80"
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="18"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              >
                <title>{`${seg.label}: ${seg.value}`}</title>
              </circle>
            );
            offset += dash;
            return el;
          })}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold tabular-nums text-content">
          {centerValue}
        </span>
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{centerLabel}</p>
        <ul className="mt-2 space-y-1.5">
          {segments.map((seg) => (
            <li key={seg.label} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-content">{seg.label}</span>
              <span className="ml-auto font-semibold tabular-nums text-muted">
                {seg.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CategoryBars({ data }: { data: CategoryDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.category} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs text-muted" title={d.category}>
            {d.category}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded-md bg-surface-2">
            <div
              className="flex h-full items-center rounded-md bg-primary"
              style={{ width: `${(d.count / max) * 100}%` }}
              title={`${d.category}: ${d.count}`}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-content">
            {d.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardCharts({
  t,
  eligible,
  ineligible,
  noRules,
  categoryData,
}: {
  t: Dict;
  eligible: number;
  ineligible: number;
  noRules: number;
  categoryData: CategoryDatum[];
}) {
  const hasData = eligible + ineligible + noRules > 0;

  const segments: DonutSegment[] = [
    { label: t.eligible, value: eligible, color: 'var(--success)' },
    { label: t.ineligible, value: ineligible, color: 'var(--danger)' },
    { label: t.noRules, value: noRules, color: 'var(--border-strong)' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader
          icon={<ChartIcon className="h-4.5 w-4.5" />}
          title={t.eligibilityBreakdown}
        />
        <div className="p-5">
          {hasData ? (
            <Donut
              segments={segments}
              centerValue={eligible}
              centerLabel={t.statEligible}
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted">{t.noData}</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          icon={<ChartIcon className="h-4.5 w-4.5" />}
          title={t.schemesByCategory}
        />
        <div className="p-5">
          {categoryData.length > 0 ? (
            <CategoryBars data={categoryData} />
          ) : (
            <p className="py-10 text-center text-sm text-muted">{t.noData}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
