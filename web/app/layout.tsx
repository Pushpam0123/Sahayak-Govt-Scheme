import type { Metadata } from 'next';
import { Noto_Sans, Noto_Sans_Bengali, Noto_Sans_Telugu, Noto_Sans_Tamil } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { SITE_URL } from '../lib/site';

const notoSans = Noto_Sans({
  subsets: ['latin', 'devanagari'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-bengali',
  display: 'swap',
});

const notoTelugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-telugu',
  display: 'swap',
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-tamil',
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

const themeAndLangScript = `
(function() {
  try {
    var storedTheme = localStorage.getItem('sahayak-theme');
    var isDark = storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    var storedLang = localStorage.getItem('sahayak-lang');
    if (storedLang && ['en', 'hi', 'bn', 'mr', 'te', 'ta'].indexOf(storedLang) !== -1) {
      document.documentElement.lang = storedLang;
    }
    var storedScale = localStorage.getItem('sahayak-font-scale');
    if (storedScale === 'large') {
      document.documentElement.style.setProperty('--font-scale', '1.15');
    } else if (storedScale === 'larger') {
      document.documentElement.style.setProperty('--font-scale', '1.3');
    } else {
      document.documentElement.style.setProperty('--font-scale', '1');
    }
    var storedContrast = localStorage.getItem('sahayak-contrast');
    var isHighContrast = storedContrast === 'high' || (!storedContrast && window.matchMedia('(prefers-contrast: more)').matches);
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVariables = `${notoSans.variable} ${notoBengali.variable} ${notoTelugu.variable} ${notoTamil.variable}`;

  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeAndLangScript }} />
      </head>
      <body className="min-h-screen bg-page text-content font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
