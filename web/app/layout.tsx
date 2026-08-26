import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { SITE_URL } from '../lib/site';

const notoSans = Noto_Sans({
  subsets: ['latin', 'devanagari'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sahayak — Find Government Schemes You Qualify For',
  description:
    'Search Indian central and state welfare schemes, check your eligibility, and read the exact line of the official guideline behind every answer.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'Sahayak — Find Government Schemes You Qualify For',
    description:
      'Search Indian central and state welfare schemes, check your eligibility, and read the exact line of the official guideline behind every answer.',
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
