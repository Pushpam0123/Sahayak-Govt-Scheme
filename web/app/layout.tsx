import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const notoSans = Noto_Sans({
  subsets: ['latin', 'devanagari'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sahayak — Official Government Scheme Assistance',
  description: 'Find official central and state government welfare schemes in India with exact grounded citations and eligibility checks.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Sahayak — Official Government Scheme Assistance',
    description: 'Find official central and state government welfare schemes in India with exact grounded citations and eligibility checks.',
    siteName: 'Sahayak',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={notoSans.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-page text-content font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
