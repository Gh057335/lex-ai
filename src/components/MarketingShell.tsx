import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from './Logo';

export const BRAND = {
  paper: '#FFFFFF',
  paperPure: '#FFFFFF',
  elevated: '#FFFFFF',
  canvas: '#F5F2EC',
  ink: '#141007',
  inkSoft: '#2A2418',
  text: '#3E372A',
  muted: '#6E6346',
  faint: '#908569',
  hairline: '#ECEAE3',
  hairlineStrong: '#D4D0C5',
  accent: '#C0673E',
  accentBright: '#D8855F',
  accentDeep: '#9A4F2D',
  accentSoft: '#F2DDC8',
  accentLine: '#DBB89B',
};

export const SERIF = 'var(--font-fraunces), Georgia, serif';
export const SANS = 'var(--font-geist), system-ui, sans-serif';
export const MONO = 'var(--font-geist-mono), ui-monospace, monospace';

export function MarketingShell({ eyebrow, title, intro, children }: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen" style={{ backgroundColor: BRAND.paper, color: BRAND.text, fontFamily: SANS }}>
      <MarketingNav />
      <section>
        <div className="mx-auto max-w-[1040px] px-6 md:px-10 pt-24 md:pt-28 pb-12">
          <div
            className="text-[11px] uppercase mb-6"
            style={{ color: BRAND.faint, fontFamily: MONO, letterSpacing: '0.18em' }}
          >
            {eyebrow}
          </div>
          <h1
            className="text-[44px] md:text-[64px] leading-[1.02]"
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              letterSpacing: '-0.025em',
              maxWidth: '20ch',
              fontVariationSettings: "'opsz' 96, 'SOFT' 30",
              color: BRAND.ink,
            }}
          >
            {title}
          </h1>
          {intro && (
            <p
              className="mt-6 text-[17px] leading-[1.6] max-w-[62ch]"
              style={{ color: BRAND.muted }}
            >
              {intro}
            </p>
          )}
        </div>
      </section>
      <section style={{ borderTop: `1px solid ${BRAND.hairline}` }}>
        <div className="mx-auto max-w-[1040px] px-6 md:px-10 py-16 md:py-20">
          {children}
        </div>
      </section>
      <MarketingFoot />
    </main>
  );
}

export function MarketingNav() {
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md"
      style={{
        borderBottom: `1px solid ${BRAND.hairline}`,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
      }}
    >
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 h-16 flex items-center justify-between">
        <Logo href="/" size="md" />
        <nav className="hidden md:flex items-center gap-8 text-[14px]" style={{ color: BRAND.inkSoft }}>
          <Link href="/#product" className="hover:text-[#C0673E] transition-colors">Product</Link>
          <Link href="/#coverage" className="hover:text-[#C0673E] transition-colors">Coverage</Link>
          <Link href="/pricing" className="hover:text-[#C0673E] transition-colors">Pricing</Link>
          <Link href="/security" className="hover:text-[#C0673E] transition-colors">Security</Link>
        </nav>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-full transition-all hover:gap-2"
          style={{ backgroundColor: BRAND.ink, color: BRAND.paper }}
        >
          Open app
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
        </Link>
      </div>
    </header>
  );
}

export function MarketingFoot() {
  return (
    <footer style={{ borderTop: `1px solid ${BRAND.hairline}`, backgroundColor: BRAND.paper }}>
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Logo href="/" size="md" />
          <p className="mt-4 text-[13px] leading-[1.6]" style={{ color: BRAND.muted, maxWidth: '28ch' }}>
            Legal AI for Africa, the GCC, and sector regimes.
          </p>
        </div>

        <FootCol title="Product" items={[
          { label: 'Coverage', href: '/#coverage' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Open app', href: '/dashboard' },
        ]} />

        <FootCol title="Trust" items={[
          { label: 'Security', href: '/security' },
          { label: 'Data Processing', href: '/legal/dpa' },
          { label: 'Terms', href: '/legal/terms' },
        ]} />

        <FootCol title="Contact" items={[
          { label: 'counsel@lexai.legal', href: 'mailto:counsel@lexai.legal' },
        ]} />
      </div>

      <div style={{ borderTop: `1px solid ${BRAND.hairline}` }}>
        <div
          className="mx-auto max-w-[1200px] px-6 md:px-10 py-5 flex items-center justify-between text-[11px]"
          style={{ color: BRAND.faint }}
        >
          <span>© {new Date().getFullYear()} LEXAI</span>
          <span>All rights reserved</span>
        </div>
      </div>
    </footer>
  );
}

function FootCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <div
        className="text-[11px] uppercase mb-3"
        style={{ color: BRAND.faint, letterSpacing: '0.16em' }}
      >
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              className="text-[13px] hover:text-[#C0673E] transition-colors"
              style={{ color: BRAND.inkSoft }}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
