import { MarketingShell, BRAND, SERIF } from '@/components/MarketingShell';

const CONTROLS = [
  {
    title: 'Encryption',
    body: 'TLS 1.3 in transit. AES-256 at rest. Customer secrets are isolated per tenant.',
  },
  {
    title: 'Audit log',
    body: 'Every AI inference writes an append-only record with SHA-256 hashes of the prompt, retrieval and output. Records are chained per tenant. Any tampering breaks the chain.',
  },
  {
    title: 'Access control',
    body: 'Role-based access enforced at the database layer through row-level security. SSO (SAML, OIDC) is mandatory at the Sovereign edition.',
  },
  {
    title: 'Data residency',
    body: 'EU (Frankfurt) by default. UAE (Dubai) and KSA (Riyadh) available at the Sovereign edition. On-prem and VPC deployment available on request.',
  },
  {
    title: 'Compliance',
    body: 'DIFC DPL 2020, ADGM DPR 2021, KSA PDPL 2021 and Bahrain PDPL 2018 controls are aligned today. SOC 2 Type I in Q4 2026. SOC 2 Type II in Q3 2027.',
  },
  {
    title: 'Incident response',
    body: 'Breach detection target is 24 hours. Customer notification within 48 hours of confirmation, contractually committed.',
  },
];

const LIMITS = [
  'We do not train models on Customer Inputs or Outputs without explicit written consent.',
  'We do not share Customer corpus with other Customers, including in aggregate.',
  'We do not send Personal Data to a model provider operating in a jurisdiction without an applicable transfer mechanism.',
  'We do not hold copies of Customer data outside the contractual retention period.',
  'We do not persist Customer data with the model provider. We use the zero-retention API tier with Anthropic.',
];

export default function SecurityPage() {
  return (
    <MarketingShell
      eyebrow="Security"
      title="Security posture."
      intro="Every AI inference, document operation and change to Customer data leaves a tamper-evident record. The controls below are live today. Certifications are scheduled."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {CONTROLS.map((c) => (
          <article key={c.title}>
            <h3
              className="text-[19px] mb-3"
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                color: BRAND.ink,
                letterSpacing: '-0.015em',
                fontVariationSettings: "'opsz' 24, 'SOFT' 30",
              }}
            >
              {c.title}
            </h3>
            <p className="text-[14.5px] leading-[1.65]" style={{ color: BRAND.muted }}>
              {c.body}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-20 pt-14" style={{ borderTop: `1px solid ${BRAND.hairline}` }}>
        <h2
          className="text-[28px] md:text-[36px] mb-8 max-w-[24ch]"
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            color: BRAND.ink,
            letterSpacing: '-0.02em',
            fontVariationSettings: "'opsz' 48, 'SOFT' 30",
          }}
        >
          What we do not do.
        </h2>
        <ul className="space-y-3 max-w-[68ch]">
          {LIMITS.map((line) => (
            <li
              key={line}
              className="text-[15px] leading-[1.65] flex gap-3"
              style={{ color: BRAND.text }}
            >
              <span className="mt-2.5 h-px w-3 shrink-0" style={{ background: BRAND.accent }} aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16 text-[12px]" style={{ color: BRAND.faint }}>
        Updated 15 May 2026. Contact: security@lexai.legal
      </div>
    </MarketingShell>
  );
}
