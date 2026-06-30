import type { Metadata, Viewport } from 'next';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
});

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

// VERCEL_URL is set automatically on every deployment; NEXT_PUBLIC_SITE_URL
// should be set in the Vercel project settings for the production domain.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Lexai — Legal AI for Emerging Markets',
    template: '%s | Lexai',
  },
  description:
    'Draft, review and monitor contracts against the primary sources of Africa, the GCC and 40+ sector regimes. Every clause cites its source.',
  authors: [{ name: 'Lexai' }],
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Lexai — Legal AI for Emerging Markets',
    description:
      'Draft, review and monitor contracts against the primary sources of Africa, the GCC and 40+ sector regimes.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1024,
        height: 512,
        alt: 'Lexai',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lexai — Legal AI for Emerging Markets',
    description:
      'Draft, review and monitor contracts against the primary sources of Africa, the GCC and 40+ sector regimes.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/logo-mark.jpg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFFFFF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
