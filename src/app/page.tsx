import Link from 'next/link';
import { ArrowUpRight, FileText, ScanLine, BellRing } from 'lucide-react';
import { MarketingNav, MarketingFoot, BRAND, SERIF, MONO } from '@/components/MarketingShell';

export default function Landing() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: BRAND.paper, color: BRAND.ink }}>
      <MarketingNav />
      <Hero />
      <Product />
      <Features />
      <Coverage />
      <Cta />
      <MarketingFoot />
    </main>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section>
      <div className="mx-auto max-w-[1100px] px-6 md:px-10 pt-24 md:pt-32 pb-20">
        <h1
          className="text-[48px] md:text-[80px] leading-[1.02]"
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            letterSpacing: '-0.03em',
            maxWidth: '18ch',
            color: BRAND.ink,
            fontVariationSettings: "'opsz' 144, 'SOFT' 30",
          }}
        >
          Legal AI for emerging markets.
        </h1>

        <p
          className="mt-8 text-[18px] md:text-[20px] leading-[1.55] max-w-[58ch]"
          style={{ color: BRAND.muted }}
        >
          Draft, review and monitor contracts against the primary sources of
          Africa, the GCC and 40+ sector regimes. Every clause cites its source.
        </p>

        <div className="mt-10 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium rounded-full transition-all hover:gap-3"
            style={{ backgroundColor: BRAND.ink, color: BRAND.paper }}
          >
            Open the app
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center px-5 py-3 text-[14px] font-medium transition-colors hover:text-[#C0673E]"
            style={{ color: BRAND.ink }}
          >
            See pricing
          </Link>
        </div>

        <div className="mt-14 flex items-center gap-x-10 gap-y-3 flex-wrap">
          <Stat n="113" label="Jurisdictions" />
          <Divider />
          <Stat n="867" label="Primary sources" />
          <Divider />
          <Stat n="40+" label="Sector verticals" />
          <Divider />
          <Stat n="24h" label="Update SLA" />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <div
        className="text-[28px] tabular-nums"
        style={{
          fontFamily: SERIF,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: BRAND.ink,
          fontVariationSettings: "'opsz' 32, 'SOFT' 30",
        }}
      >
        {n}
      </div>
      <div className="text-[13px]" style={{ color: BRAND.muted }}>
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="hidden md:block w-px h-5" style={{ backgroundColor: BRAND.hairlineStrong }} />;
}

/* ─── Product visual ─────────────────────────────────────────────── */

function Product() {
  return (
    <section id="product" style={{ borderTop: `1px solid ${BRAND.hairline}`, backgroundColor: BRAND.canvas }}>
      <div className="mx-auto max-w-[1100px] px-6 md:px-10 py-20 md:py-24">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: BRAND.paperPure,
            border: `1px solid ${BRAND.hairline}`,
            boxShadow: '0 24px 48px -20px rgba(0,0,0,0.14)',
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-3"
            style={{ borderBottom: `1px solid ${BRAND.hairline}`, backgroundColor: BRAND.canvas }}
          >
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND.hairlineStrong }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND.hairlineStrong }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND.hairlineStrong }} />
            </div>
            <div className="text-[12px] hidden sm:block" style={{ color: BRAND.faint }}>
              DIFC Services Agreement · v4
            </div>
            <div className="ml-auto text-[12px] hidden md:block" style={{ color: BRAND.faint }}>
              3 citations attached
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
            <div className="p-7 md:p-10" style={{ borderRight: `1px solid ${BRAND.hairline}` }}>
              <div className="text-[12px] mb-3" style={{ color: BRAND.faint }}>
                Clause 14.3 — International Transfers
              </div>
              <p
                className="text-[17px] md:text-[19px] leading-[1.7]"
                style={{
                  fontFamily: SERIF,
                  color: BRAND.text,
                  fontVariationSettings: "'opsz' 24, 'SOFT' 60",
                }}
              >
                The Processor shall not transfer Personal Data outside the DIFC unless
                the recipient jurisdiction is subject to an{` `}
                <span
                  style={{
                    background: 'linear-gradient(180deg, transparent 65%, rgba(192,103,62,0.18) 65%, rgba(192,103,62,0.18) 95%, transparent 95%)',
                    paddingBottom: 2,
                  }}
                >
                  Adequacy Decision issued by the Commissioner
                </span>
                {` `}under Article 26, or appropriate safeguards under Article 27.
              </p>
            </div>

            <aside className="p-7 md:p-8" style={{ backgroundColor: BRAND.canvas }}>
              <div className="text-[11px] uppercase mb-4" style={{ color: BRAND.accent, letterSpacing: '0.16em' }}>
                Citation
              </div>
              <div
                className="text-[16px] mb-1"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 500,
                  color: BRAND.ink,
                  letterSpacing: '-0.01em',
                  fontVariationSettings: "'opsz' 24, 'SOFT' 50",
                }}
              >
                DIFC Law No. 5 of 2020
              </div>
              <div className="text-[13px]" style={{ color: BRAND.text }}>
                Data Protection Law
              </div>
              <div className="text-[12px] mt-1" style={{ color: BRAND.muted }}>
                Articles 26 — 27
              </div>

              <div className="mt-5 pt-4 space-y-2 text-[12px]" style={{ borderTop: `1px solid ${BRAND.hairline}` }}>
                <Row k="Publisher" v="DIFC Authority" />
                <Row k="Effective" v="2020-07-01" />
                <Row k="Status" v="In force" accent />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: BRAND.faint }}>{k}</span>
      <span style={{ color: accent ? BRAND.accent : BRAND.inkSoft }}>{v}</span>
    </div>
  );
}

/* ─── Features ──────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: FileText,
    title: 'Draft',
    body: 'Generate contracts clause by clause. Every clause includes a citation to the underlying statute or regulation.',
  },
  {
    icon: ScanLine,
    title: 'Review',
    body: 'Upload a PDF or DOCX. Get a clause-level redline marked as attention, high or blocking, with sources quoted in full.',
  },
  {
    icon: BellRing,
    title: 'Monitor',
    body: 'Track regulatory changes daily. When a source you cite changes, every affected contract surfaces within 24 hours.',
  },
];

function Features() {
  return (
    <section style={{ borderTop: `1px solid ${BRAND.hairline}` }}>
      <div className="mx-auto max-w-[1100px] px-6 md:px-10 py-20 md:py-28">
        <h2
          className="text-[32px] md:text-[44px] mb-14 max-w-[20ch]"
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            color: BRAND.ink,
            letterSpacing: '-0.02em',
            fontVariationSettings: "'opsz' 72, 'SOFT' 30",
          }}
        >
          Three things LEXAI does for legal teams.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 md:gap-x-12">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article key={title}>
              <Icon className="w-5 h-5 mb-5" strokeWidth={1.4} style={{ color: BRAND.accent }} />
              <h3
                className="text-[22px] mb-3"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 400,
                  color: BRAND.ink,
                  letterSpacing: '-0.015em',
                  fontVariationSettings: "'opsz' 32, 'SOFT' 30",
                }}
              >
                {title}
              </h3>
              <p className="text-[15px] leading-[1.6]" style={{ color: BRAND.muted }}>
                {body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Coverage ───────────────────────────────────────────────────── */

const REGIONS = [
  {
    region: 'Africa',
    items: 'OHADA · AfCFTA · Nigeria · South Africa · Kenya · Egypt · Morocco · Ghana · Rwanda · Tanzania · Uganda · Ethiopia',
  },
  {
    region: 'GCC & MENA',
    items: 'UAE Federal · DIFC · ADGM · VARA · Saudi Arabia · Qatar · QFC · Bahrain · Kuwait · Oman · AAOIFI · IFSB',
  },
  {
    region: 'Asia',
    items: 'India · Indonesia · Vietnam · Singapore · Hong Kong · Thailand · Malaysia · Philippines · Bangladesh · Pakistan',
  },
  {
    region: 'Sector verticals',
    items: 'Oil & Gas · Renewables & Carbon · Mining · Crypto · FinTech · Maritime · Aviation · Construction · Insurance',
  },
];

function Coverage() {
  return (
    <section id="coverage" style={{ borderTop: `1px solid ${BRAND.hairline}`, backgroundColor: BRAND.canvas }}>
      <div className="mx-auto max-w-[1100px] px-6 md:px-10 py-20 md:py-28">
        <h2
          className="text-[32px] md:text-[44px] mb-14 max-w-[20ch]"
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            color: BRAND.ink,
            letterSpacing: '-0.02em',
            fontVariationSettings: "'opsz' 72, 'SOFT' 30",
          }}
        >
          What we cover.
        </h2>

        <div className="space-y-8">
          {REGIONS.map((r) => (
            <div
              key={r.region}
              className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-10 gap-y-2 pb-8"
              style={{ borderBottom: `1px solid ${BRAND.hairline}` }}
            >
              <h3
                className="text-[20px]"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 400,
                  color: BRAND.ink,
                  letterSpacing: '-0.015em',
                  fontVariationSettings: "'opsz' 24, 'SOFT' 30",
                }}
              >
                {r.region}
              </h3>
              <p className="text-[15px] leading-[1.7]" style={{ color: BRAND.muted }}>
                {r.items}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────────── */

function Cta() {
  return (
    <section style={{ borderTop: `1px solid ${BRAND.hairline}` }}>
      <div className="mx-auto max-w-[1100px] px-6 md:px-10 py-24 md:py-32">
        <h2
          className="text-[36px] md:text-[56px] leading-[1.05] max-w-[22ch]"
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            letterSpacing: '-0.025em',
            color: BRAND.ink,
            fontVariationSettings: "'opsz' 96, 'SOFT' 30",
          }}
        >
          Ready to see it on your contracts?
        </h2>

        <p className="mt-6 text-[16px] leading-[1.6] max-w-[52ch]" style={{ color: BRAND.muted }}>
          Access is private and credential-screened. We onboard a small number of
          design partners each quarter.
        </p>

        <div className="mt-10 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium rounded-full transition-all hover:gap-3"
            style={{ backgroundColor: BRAND.accent, color: BRAND.paper }}
          >
            Request access
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
          </Link>
          <Link
            href="mailto:counsel@lexai.legal"
            className="inline-flex items-center px-5 py-3 text-[14px] font-medium transition-colors hover:text-[#C0673E]"
            style={{ color: BRAND.ink }}
          >
            Email us
          </Link>
        </div>
      </div>
    </section>
  );
}
