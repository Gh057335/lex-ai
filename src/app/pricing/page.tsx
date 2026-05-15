import { ArrowUpRight, Check } from 'lucide-react';
import Link from 'next/link';
import { MarketingShell, BRAND, SERIF } from '@/components/MarketingShell';

const TIERS = [
  {
    name: 'Counsel',
    price: '$1,500',
    cadence: 'per user, per month',
    description: 'For a single in-house counsel or a small mandate team.',
    features: [
      '3 jurisdictions',
      '50 reviewed documents per month',
      'Unlimited assistant queries',
      'Standard templates (NDA, DPA, SHA, employment)',
      'Monthly regulatory digest',
      'Audit log',
    ],
    cta: 'Start',
    ctaHref: '/dashboard',
  },
  {
    name: 'Chambers',
    price: '$4,500',
    cadence: 'per workspace, per month',
    description: 'For an in-house team or a boutique firm with sector focus.',
    highlight: true,
    features: [
      '6 jurisdictions',
      'Unlimited reviews and drafts',
      'One sector vertical at depth',
      'Custom clause library and house style',
      'Priority support',
      'Quarterly business review',
    ],
    cta: 'Contact us',
    ctaHref: 'mailto:counsel@lexai.legal?subject=Chambers',
  },
  {
    name: 'Sovereign',
    price: 'Custom',
    cadence: 'annual contract',
    description: 'For multi-jurisdiction GCs, sovereign desks, and NOCs.',
    features: [
      'Full coverage',
      'SSO (SAML, OIDC)',
      'Data residency (UAE, KSA, Singapore)',
      'On-prem or VPC deployment',
      'Custom corpus ingestion',
      'Named senior counsel, 24/7 SLA',
    ],
    cta: 'Contact us',
    ctaHref: 'mailto:counsel@lexai.legal?subject=Sovereign',
  },
];

export default function PricingPage() {
  return (
    <MarketingShell
      eyebrow="Pricing"
      title="Three editions, one platform."
      intro="LEXAI is priced by edition, not by seat. Each edition includes the same product. The difference is the breadth of coverage and the operational guarantees."
    >
      <div
        className="grid grid-cols-1 md:grid-cols-3 rounded-xl overflow-hidden"
        style={{ border: `1px solid ${BRAND.hairline}` }}
      >
        {TIERS.map((t, i) => (
          <article
            key={t.name}
            className="p-8 flex flex-col"
            style={{
              backgroundColor: t.highlight ? BRAND.accentSoft : BRAND.paperPure,
              borderRight: i < TIERS.length - 1 ? `1px solid ${BRAND.hairline}` : undefined,
            }}
          >
            <h3
              className="text-[22px] mb-2"
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                color: t.highlight ? BRAND.accent : BRAND.ink,
                letterSpacing: '-0.01em',
                fontVariationSettings: "'opsz' 32, 'SOFT' 30",
              }}
            >
              {t.name}
            </h3>

            <p className="text-[13.5px] mb-6" style={{ color: BRAND.muted }}>
              {t.description}
            </p>

            <div className="mb-6">
              <div
                className="text-[44px]"
                style={{
                  fontFamily: SERIF,
                  color: BRAND.ink,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  fontVariationSettings: "'opsz' 96, 'SOFT' 30",
                  lineHeight: 1,
                }}
              >
                {t.price}
              </div>
              <div className="mt-2 text-[12.5px]" style={{ color: BRAND.faint }}>
                {t.cadence}
              </div>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] leading-[1.5]" style={{ color: BRAND.text }}>
                  <Check className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} style={{ color: BRAND.accent }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={t.ctaHref}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-[13px] font-medium rounded-full transition-all hover:gap-3"
              style={
                t.highlight
                  ? { backgroundColor: BRAND.accent, color: BRAND.paper }
                  : { backgroundColor: BRAND.ink, color: BRAND.paper }
              }
            >
              {t.cta}
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-16 max-w-[64ch]">
        <p className="text-[15px] leading-[1.7]" style={{ color: BRAND.muted }}>
          Custom corpus ingestion, in-house training for your associates, and on-prem
          deployment are scoped separately. We do not charge for citations, model
          inference, or storage at the editions above.
        </p>
      </div>
    </MarketingShell>
  );
}
