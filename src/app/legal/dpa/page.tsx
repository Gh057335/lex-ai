import { MarketingShell, BRAND, SERIF, MONO } from '@/components/MarketingShell';

export default function DPAPage() {
  return (
    <MarketingShell
      eyebrow="Legal · Data Processing Agreement"
      title="How LEXAI processes your data."
      intro="This page is the operative DPA between LEXAI and any client (the 'Customer'). It governs all processing of personal data carried out by LEXAI on behalf of the Customer in connection with the Services. It is drafted against the standards of DIFC DPL 2020, ADGM DPR 2021, Saudi PDPL 2021, and Bahrain PDPL 2018."
    >
      <Article id="1" title="Roles and scope">
        <p>
          The Customer is the <strong>Controller</strong>. LEXAI is the <strong>Processor</strong>.
          The processing covered by this DPA is limited to: (i) the documents and uploads the
          Customer submits to the Services; (ii) usage metadata reasonably necessary to operate
          the Services; (iii) personal data of the Customer's authorised users (names, emails,
          authentication metadata). No processing of special categories of personal data is
          authorised unless agreed in a signed schedule.
        </p>
      </Article>

      <Article id="2" title="Permitted purpose">
        <p>
          LEXAI processes Customer Personal Data solely (a) to perform the Services described
          in the Order Form, (b) for security, integrity and abuse-prevention purposes, and (c)
          to comply with applicable law. LEXAI will not use Customer Personal Data to train
          any model that benefits parties other than the Customer.
        </p>
      </Article>

      <Article id="3" title="Sub-processors">
        <p>The current list of sub-processors as of the date of this DPA:</p>
        <SubprocessorTable />
        <p className="mt-4">
          LEXAI will give the Customer at least <strong>30 days' notice</strong> of any new
          sub-processor and allow the Customer to object on documented, reasonable grounds. If
          the parties cannot agree within 30 days, the Customer may terminate the affected
          portion of the Services for cause.
        </p>
      </Article>

      <Article id="4" title="Cross-border transfers">
        <p>
          Where Customer Personal Data is exported outside the Customer's jurisdiction, LEXAI
          will rely on (a) an adequacy determination by the competent regulator, where one
          exists; (b) the DIFC Standard Contractual Clauses, the ADGM Standard Data Export
          Clauses, or the SDAIA-approved transfer mechanism, as applicable; or (c) explicit
          informed consent. Customers in KSA may elect that processing occur in-Kingdom under
          the Sovereign edition.
        </p>
      </Article>

      <Article id="5" title="Security measures">
        <p>LEXAI maintains the following technical and organisational measures:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2 text-[13px]" style={{ color: BRAND.muted }}>
          <li>Encryption in transit (TLS 1.3) and at rest (AES-256).</li>
          <li>Hash-chained append-only audit log on every AI inference and document operation.</li>
          <li>Role-based access control with least privilege; SSO mandatory at the Sovereign edition.</li>
          <li>Quarterly internal penetration tests; annual external test.</li>
          <li>Encryption-key management via cloud HSM; production keys never exported.</li>
          <li>SOC 2 Type I — target Q4 2026; Type II — target Q3 2027.</li>
        </ul>
      </Article>

      <Article id="6" title="Breach notification">
        <p>
          LEXAI will notify the Customer of any confirmed Personal Data Breach affecting the
          Customer's data <strong>without undue delay</strong> and in any event no later than
          <strong>48 hours</strong> after becoming aware. The notification will describe the
          nature of the breach, categories and approximate number of data subjects, likely
          consequences, and mitigation measures taken. This obligation is more protective than
          the 72-hour minimum required by DIFC DPL Art. 41, ADGM DPR Reg. 39, and Saudi PDPL
          Art. 20.
        </p>
      </Article>

      <Article id="7" title="Data subject rights">
        <p>
          LEXAI will assist the Customer, taking into account the nature of the processing, in
          fulfilling its obligation to respond to requests from data subjects exercising their
          rights of access, rectification, erasure, restriction, portability, and objection.
          LEXAI provides programmatic export APIs and a self-service erasure interface in the
          Customer's workspace.
        </p>
      </Article>

      <Article id="8" title="Audits">
        <p>
          The Customer may, no more than once per twelve-month period, conduct an audit (or
          appoint an independent third-party auditor bound by confidentiality) to verify
          compliance with this DPA. LEXAI will provide reasonable cooperation. Findings flagged
          high or critical will be remediated within 30 days. Annual SOC 2 reports (once
          available) will satisfy this clause for most Customers.
        </p>
      </Article>

      <Article id="9" title="Return and deletion">
        <p>
          On termination of the Services, LEXAI will, at the Customer's election, return all
          Customer Personal Data in a structured machine-readable format and delete remaining
          copies within 60 days, save where retention is required by law (in which case
          retention is limited to the duration legally required, segregated, and subject to the
          security obligations of this DPA).
        </p>
      </Article>

      <Article id="10" title="Governing law">
        <p>
          This DPA is governed by the law of the Customer's primary jurisdiction of operation
          as identified in the Order Form. Disputes are submitted to the courts of that
          jurisdiction unless the Order Form provides for arbitration (DIFC-LCIA Rules unless
          otherwise agreed).
        </p>
      </Article>

      <div className="mt-10 pt-6 text-[11px]" style={{ color: BRAND.faint, borderTop: `1px solid ${BRAND.hairline}` }}>
        <div style={{ fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.22em' }}>
          Version 1.0 · 2026-05-14 · counsel@lexai.legal
        </div>
        <p className="mt-2">
          This DPA is incorporated by reference into the Order Form and the Master Services
          Agreement. The signed Order Form prevails over any conflicting term herein.
        </p>
      </div>
    </MarketingShell>
  );
}

function Article({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={`art-${id}`} className="mb-10">
      <div className="flex items-baseline gap-3 mb-3">
        <span style={{ fontFamily: MONO, fontSize: 11, color: BRAND.gold, letterSpacing: '0.22em' }}>Art. {id}</span>
        <h2 className="text-[20px]" style={{ fontFamily: SERIF, fontWeight: 700 }}>{title}</h2>
      </div>
      <div className="text-[13.5px] leading-[1.75]" style={{ color: BRAND.muted }}>
        {children}
      </div>
    </section>
  );
}

function SubprocessorTable() {
  const rows = [
    { name: 'Supabase, Inc.',         purpose: 'Primary datastore (Postgres + Storage)',        location: 'AWS eu-central / ae-dub (Sovereign)' },
    { name: 'Anthropic PBC',          purpose: 'AI inference (Claude Sonnet / Opus)',           location: 'US (zero-retention API tier)' },
    { name: 'Vercel Inc. / Cloudflare', purpose: 'Edge runtime, CDN, DDoS protection',            location: 'Global edge with EU/UAE failover' },
    { name: 'Resend, Inc.',           purpose: 'Transactional email (account & breach notices)',  location: 'EU' },
  ];
  return (
    <table className="w-full text-[12px] mt-3" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ color: BRAND.gold, fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em' }}>
          <th className="text-left pb-2 uppercase" style={{ borderBottom: `1px solid ${BRAND.hairline}` }}>Sub-processor</th>
          <th className="text-left pb-2 uppercase" style={{ borderBottom: `1px solid ${BRAND.hairline}` }}>Purpose</th>
          <th className="text-left pb-2 uppercase" style={{ borderBottom: `1px solid ${BRAND.hairline}` }}>Location</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} style={{ color: BRAND.muted }}>
            <td className="py-2 pr-3" style={{ borderBottom: `0.3pt dotted ${BRAND.hairline}` }}>{r.name}</td>
            <td className="py-2 pr-3" style={{ borderBottom: `0.3pt dotted ${BRAND.hairline}` }}>{r.purpose}</td>
            <td className="py-2" style={{ borderBottom: `0.3pt dotted ${BRAND.hairline}` }}>{r.location}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
