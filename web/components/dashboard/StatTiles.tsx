// KPI stat tiles — hero numbers summarising the eligibility scan.
import type { ReactNode } from 'react';
import { Card } from '../ui';

type Tone = 'primary' | 'success' | 'muted' | 'accent';

const toneChip: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  muted: 'bg-surface-2 text-muted',
  accent: 'bg-warn-soft text-warn',
};

export interface Stat {
  label: string;
  value: number;
  tone: Tone;
  icon: ReactNode;
}

export function StatTiles({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="p-5">
          <div className="flex items-center justify-between">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                toneChip[s.tone]
              }`}
            >
              {s.icon}
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-content">
            {s.value}
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}
