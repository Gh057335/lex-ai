import { MarketingShell, BRAND, SERIF, MONO } from '@/components/MarketingShell';

export default function TermsPage() {
  return (
    <MarketingShell
      eyebrow="Legal · Terms of Service"
      title="The four things you need to know."
      intro="The full Master Services Agreement is delivered with the Order Form and the DPA. This summary tells you upfront what matters: what we provide, who owns the output, what we don't warrant, and how disputes resolve."
    >
      <Article id="1" title="What the Services are">
        <p>
          LEXAI provides AI-assisted legal research, document review, document generation and
          regulatory monitoring, grounded in a corpus of statutes, regulations and model
          contracts maintained by LEXAI. The Services are tools to assist licensed counsel.
          <strong>The Services do not provide legal advice, and using them does not create a
          lawyer-client relationship</strong> between the user and LEXAI.
        </p>
      </Article>

      <Article id="2" title="Ownership of outputs">
        <p>
          All <strong>Customer Inputs</strong> (uploads, prompts, edits) remain the property
          of the Customer. All <strong>Outputs</strong> generated through the Services on
          behalf of the Customer (drafted contracts, reviews, digests) are owned by the
          Customer, with a perpetual licence back to LEXAI to use the Outputs in aggregated,
          de-identified form for service improvement (not for model training without consent).
          The corpus, system prompts, and the Service software remain the property of LEXAI.
        </p>
      </Article>

      <Article id="3" title="Warranties and disclaimers">
        <p>
          LEXAI warrants that the Services will operate substantially in accordance with the
          documentation. <strong>LEXAI does not warrant the correctness, completeness or
          legal sufficiency of any AI-generated Output.</strong> The Customer is responsible
          for the review of all Outputs by qualified counsel before reliance. Citations
          surface the source articles relied upon to make this review feasible.
        </p>
        <p className="mt-3">
          LEXAI&apos;s aggregate liability under the agreement is capped at the fees paid by the
          Customer in the twelve months preceding the claim, save for breaches of
          confidentiality, the DPA, or gross negligence / wilful misconduct.
        </p>
      </Article>

      <Article id="4" title="Governing law and arbitration">
        <p>
          The agreement is governed by the laws of the Dubai International Financial Centre
          (DIFC), unless the Order Form specifies otherwise. Disputes are referred to and
          finally resolved by arbitration administered by the DIFC-LCIA Arbitration Centre
          under its Arbitration Rules. The seat is the DIFC. The tribunal is one arbitrator
          for disputes under USD 1M, three arbitrators above. The language is English.
        </p>
      </Article>

      <div className="mt-10 pt-6 text-[11px]" style={{ color: BRAND.faint, borderTop: `1px solid ${BRAND.hairline}` }}>
        <div style={{ fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.22em' }}>
          Version 1.0 · 2026-05-14 · counsel@lexai.legal
        </div>
        <p className="mt-2">
          Plain-English summary only. The signed Order Form and Master Services Agreement
          contain the operative legal terms.
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
