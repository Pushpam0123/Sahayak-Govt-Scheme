import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Sahayak — Find Government Schemes You Qualify For';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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
          <span style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Sahayak
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1.15, color: '#ffffff' }}>
            Find out which government schemes will actually pay you.
          </div>
          <div style={{ fontSize: '24px', color: '#94a3b8', lineHeight: 1.4 }}>
            Instant eligibility evaluation backed by exact sentence citations from official ministry documents.
          </div>
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
          <span>Deterministic Eligibility · Local Privacy</span>
          <span>sahayak.example</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
