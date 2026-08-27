import { ImageResponse } from 'next/og';
import { getApiBase } from '../../../../lib/server-env';
import type { SchemeDetail } from '../../../../lib/types';

export const runtime = 'nodejs';
export const alt = 'Scheme Eligibility & Benefit Details — Sahayak';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

async function getScheme(slug: string): Promise<SchemeDetail | null> {
  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/v1/schemes/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as SchemeDetail;
  } catch {
    return null;
  }
}

export default async function SchemeOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scheme = await getScheme(slug);

  // If fetch failed or unknown scheme, render default site card (never fake name from slug)
  if (!scheme) {
    return new ImageResponse(
      (
        <div
          style={{
            background: '#0f172a',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '64px',
            fontFamily: 'sans-serif',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: '#1d4ed8',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 900,
              }}
            >
              स
            </div>
            <span style={{ fontSize: '32px', fontWeight: 800 }}>Sahayak</span>
          </div>

          <div style={{ fontSize: '48px', fontWeight: 800 }}>
            Official Government Schemes & Eligibility
          </div>

          <div style={{ borderTop: '1px solid #334155', paddingTop: '24px', color: '#94a3b8', fontSize: '18px' }}>
            sahayak.example
          </div>
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: '#1d4ed8',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 900,
              }}
            >
              स
            </div>
            <span style={{ fontSize: '28px', fontWeight: 800 }}>Sahayak</span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                background: '#1e293b',
                color: '#94a3b8',
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              {scheme.state}
            </div>
            <div
              style={{
                background: '#1e293b',
                color: '#94a3b8',
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              {scheme.category}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.15, color: '#ffffff' }}>
            {scheme.name}
          </div>
          {scheme.benefit_amount ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '12px' }}>
              <span style={{ fontSize: '18px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
                Direct Benefit
              </span>
              <span style={{ fontSize: '40px', fontWeight: 800, color: '#3b82f6' }}>
                {scheme.benefit_amount}
              </span>
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #334155',
            paddingTop: '24px',
            color: '#cbd5e1',
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          <span>Official Guidelines & Eligibility Rules</span>
          <span>sahayak.example</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
