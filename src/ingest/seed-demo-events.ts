/**
 * Seed realistic regulatory events for the LEXAI MVP demo.
 *
 * Inserts ~15 events spanning the last 60 days, anchored to the legal_sources
 * already seeded by seed-demo-corpus.ts. Events cover: new regulations,
 * amendments, executive regulations published, consultations closed,
 * enforcement guidance issued.
 *
 * Run: `bun src/ingest/seed-demo-events.ts`
 */

import { createAdminClient } from '@/lib/supabase';

interface SeedEvent {
  sourceKey: string;
  changeType: 'new' | 'amended' | 'superseded' | 'withdrawn';
  summary: string;
  detectedAt: string;
  effectiveAt: string | null;
  diff?: Record<string, unknown>;
}

const TODAY = '2026-05-14';

const EVENTS: SeedEvent[] = [
  {
    sourceKey: 'sa:pdpl:2021',
    changeType: 'amended',
    summary: 'New Executive Regulations published clarifying cross-border transfer mechanisms and introducing a sector-specific data localisation requirement for health and financial data.',
    detectedAt: '2026-05-09T09:14:00Z',
    effectiveAt: '2026-07-15',
    diff: {
      areas: ['cross-border transfers', 'data localisation'],
      severity: 'high',
      action: 'Review existing DPAs that transfer KSA personal data outbound; new mechanism (BCRs or SCCs approved by SDAIA) required by effective date.',
    },
  },
  {
    sourceKey: 'ae-difc:data-protection-law:2020',
    changeType: 'amended',
    summary: 'DIFC Commissioner of Data Protection issued updated Standard Contractual Clauses for international transfers and a binding guidance note on AI processing of personal data.',
    detectedAt: '2026-05-04T11:20:00Z',
    effectiveAt: '2026-06-01',
    diff: {
      areas: ['SCCs', 'AI processing'],
      severity: 'attention',
      action: 'Update DPAs incorporating old DIFC SCCs by 2026-09-01.',
    },
  },
  {
    sourceKey: 'qa:public-tender-law:2015',
    changeType: 'amended',
    summary: 'Council of Ministers raised the public tender threshold from QAR 5M to QAR 10M for public works contracts. Variation cap (Art. 41) clarified to apply per item, not per contract.',
    detectedAt: '2026-04-28T08:45:00Z',
    effectiveAt: '2026-03-12',
    diff: {
      areas: ['tender threshold', 'variation orders'],
      severity: 'attention',
      action: 'Recheck open Qatar public works mandates for revised threshold applicability.',
    },
  },
  {
    sourceKey: 'sa:civil-transactions-law:2023',
    changeType: 'new',
    summary: 'Implementing Regulations published — operational guidance on hardship doctrine (Art. 110) for long-term construction and supply contracts. Court-led renegotiation framework.',
    detectedAt: '2026-04-22T14:00:00Z',
    effectiveAt: '2026-04-20',
    diff: {
      areas: ['hardship', 'renegotiation'],
      severity: 'high',
      action: 'Multi-year KSA supply / construction contracts may now invoke hardship more readily. Audit existing force-majeure / hardship clauses.',
    },
  },
  {
    sourceKey: 'ae-adgm:data-protection-regulations:2021',
    changeType: 'amended',
    summary: 'ADGM Office of Data Protection extended breach-notification window for non-high-risk events from 72h to 96h and introduced safe-harbour for documented mitigation.',
    detectedAt: '2026-04-15T10:30:00Z',
    effectiveAt: '2026-05-01',
    diff: {
      areas: ['breach notification'],
      severity: 'info',
      action: 'Update incident response playbooks. No mandatory contract redrafting.',
    },
  },
  {
    sourceKey: 'sa:companies-law:2022',
    changeType: 'amended',
    summary: 'Ministry of Commerce introduced a mandatory 60-day waiting period for capital reductions in joint-stock companies, extended creditor objection window, and digital filing requirements.',
    detectedAt: '2026-04-10T13:00:00Z',
    effectiveAt: '2026-06-15',
    diff: {
      areas: ['capital reduction', 'creditor protection'],
      severity: 'attention',
      action: 'Pipeline KSA capital reductions targeted post-June need to factor in additional 60-day waiting period.',
    },
  },
  {
    sourceKey: 'ae-difc:employment-law:2019',
    changeType: 'amended',
    summary: 'DIFC Authority issued amending Law on remote-work entitlements: minimum 2 days/week WFH right for office-based roles, employer obligations on home-office stipends and data security.',
    detectedAt: '2026-04-08T09:00:00Z',
    effectiveAt: '2026-06-01',
    diff: {
      areas: ['remote work', 'employer obligations'],
      severity: 'attention',
      action: 'Update employment contracts and policies issued to DIFC employees before June 1.',
    },
  },
  {
    sourceKey: 'bh:pdpl:2018',
    changeType: 'amended',
    summary: 'Bahrain Personal Data Protection Authority published guidance on AI training: lawful basis for using personal data in model training narrowed; legitimate interests no longer accepted for non-anonymised data.',
    detectedAt: '2026-04-02T11:00:00Z',
    effectiveAt: '2026-05-15',
    diff: {
      areas: ['AI training', 'lawful basis'],
      severity: 'high',
      action: 'AI vendors processing Bahraini personal data must obtain explicit consent or use anonymised data only.',
    },
  },
  {
    sourceKey: 'ae-difc:arbitration-law:2008',
    changeType: 'amended',
    summary: 'DIFC Arbitration Law minor amendments: emergency arbitrator procedure formalised, third-party funding disclosure now mandatory.',
    detectedAt: '2026-03-28T15:30:00Z',
    effectiveAt: '2026-02-15',
    diff: {
      areas: ['emergency arbitrator', 'TPF disclosure'],
      severity: 'info',
      action: 'Update arbitration clauses referencing DIFC-LCIA Rules to reflect new TPF disclosure.',
    },
  },
  {
    sourceKey: 'qa:civil-code:2004',
    changeType: 'amended',
    summary: 'Qatar Court of Cassation issued binding interpretation of Art. 171 (hardship): exceptional circumstances now include sustained currency depreciation > 25% for foreign-currency obligations.',
    detectedAt: '2026-03-22T10:00:00Z',
    effectiveAt: '2026-03-22',
    diff: {
      areas: ['hardship', 'currency'],
      severity: 'attention',
      action: 'Long-term USD-denominated Qatar supply contracts may trigger Art. 171 renegotiation if QAR/USD peg shifts.',
    },
  },
  {
    sourceKey: 'ae-difc:contract-law:2004',
    changeType: 'amended',
    summary: 'DIFC Authority issued guidance clarifying Art. 49 (fraudulent representation): silence on material facts now expressly covered where commercial practice required disclosure.',
    detectedAt: '2026-03-18T12:00:00Z',
    effectiveAt: '2026-04-01',
    diff: {
      areas: ['representations', 'disclosure'],
      severity: 'info',
      action: 'Marginal — strengthens existing position; no contract redrafting needed.',
    },
  },
  {
    sourceKey: 'qa-qfc:contract-regulations:2005',
    changeType: 'new',
    summary: 'QFCRA opened consultation on amendments to the Contract Regulations: introduction of statutory good-faith duty in performance and renegotiation procedures for long-term contracts.',
    detectedAt: '2026-03-15T09:00:00Z',
    effectiveAt: null,
    diff: {
      areas: ['good faith', 'long-term contracts'],
      severity: 'info',
      action: 'Consultation closes 2026-07-31. Monitor — likely to align QFC with DIFC standard.',
    },
  },
  {
    sourceKey: 'ae-difc:companies-law:2018',
    changeType: 'amended',
    summary: 'DIFC Registrar published updated requirements for ultimate beneficial owner (UBO) declarations: real-time verification via UAE federal UBO register, sanctions screening at director appointment.',
    detectedAt: '2026-03-12T10:45:00Z',
    effectiveAt: '2026-05-01',
    diff: {
      areas: ['UBO', 'sanctions screening'],
      severity: 'attention',
      action: 'Director onboarding processes for new DIFC entities must add live screening step.',
    },
  },
  {
    sourceKey: 'ae-difc:insolvency-law:2019',
    changeType: 'amended',
    summary: 'DIFC Insolvency amendments: introduced pre-pack administration sale procedure modelled on UK practice, expanded administrator powers over secured assets.',
    detectedAt: '2026-03-08T11:30:00Z',
    effectiveAt: '2026-08-01',
    diff: {
      areas: ['pre-pack administration', 'secured creditors'],
      severity: 'attention',
      action: 'Restructuring playbooks for DIFC entities should now consider pre-pack as an option.',
    },
  },
  {
    sourceKey: 'ae-difc:netting-law:2014',
    changeType: 'amended',
    summary: 'DIFC Netting Law extended to cover digital asset derivatives. Close-out netting now enforceable against insolvent counterparties for tokenised commodity and crypto-asset contracts.',
    detectedAt: '2026-03-05T14:00:00Z',
    effectiveAt: '2026-04-01',
    diff: {
      areas: ['digital assets', 'close-out netting'],
      severity: 'info',
      action: 'Crypto derivatives counterparties on DIFC paper now have netting enforceability certainty.',
    },
  },
];

async function main() {
  const admin = createAdminClient();
  console.log(`Seeding ${EVENTS.length} regulatory events (anchor date ${TODAY})...`);

  // Clear existing events keyed to our seed sources, to keep this idempotent.
  const sourceKeys = [...new Set(EVENTS.map((e) => e.sourceKey))];
  const { data: sources } = await admin
    .from('legal_sources')
    .select('id, key')
    .in('key', sourceKeys);
  if (!sources || sources.length === 0) {
    console.error('Run seed-demo-corpus.ts first — no matching legal_sources found.');
    process.exit(1);
  }
  const idByKey = new Map(sources.map((s) => [s.key as string, s.id as string]));

  await admin.from('regulatory_events').delete().in('source_id', sources.map((s) => s.id as string));

  let inserted = 0;
  for (const ev of EVENTS) {
    const sourceId = idByKey.get(ev.sourceKey);
    if (!sourceId) {
      console.warn(`  ! skip ${ev.sourceKey} — source not in DB`);
      continue;
    }
    const { error } = await admin.from('regulatory_events').insert({
      source_id: sourceId,
      change_type: ev.changeType,
      summary: ev.summary,
      diff: ev.diff ?? null,
      detected_at: ev.detectedAt,
      effective_at: ev.effectiveAt,
    });
    if (error) {
      console.error(`  x ${ev.sourceKey}: ${error.message}`);
      continue;
    }
    inserted++;
    console.log(`  + ${ev.changeType.toUpperCase().padEnd(10)} ${ev.sourceKey} — ${ev.summary.slice(0, 70)}...`);
  }
  console.log(`\nDone. ${inserted}/${EVENTS.length} events inserted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
