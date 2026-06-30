/**
 * Demo seed dataset.
 *
 * Powers the in-memory mock database used when no Supabase credentials are
 * configured. Mirrors the real schema (table + column names) so the exact same
 * queries the pages run against Supabase resolve against this data.
 *
 * IDs are stable, human-readable strings — the mock store does not validate
 * UUID format, and readable IDs make the demo URLs legible.
 */

export type Table = Record<string, unknown>;
export type SeedStore = Record<string, Table[]>;

const now = Date.now();
const iso = (ms: number) => new Date(ms).toISOString();
const daysAgo = (n: number) => iso(now - n * 86_400_000);
const daysFromNow = (n: number) => iso(now + n * 86_400_000);

// Fixed identifiers shared across the dataset.
export const DEMO_ORG_ID = 'demo-org';
export const DEMO_USER_ID = 'demo-user';
export const DEMO_WORKSPACE_ID = 'ws-default';
export const DEMO_EMAIL = 'demo@lexai.local';
export const DEMO_ORG_SLUG = 'demo-org';

// Jurisdictions the demo workspace watches (super-set of lib/demo.ts defaults so
// the lazy seeding there is a no-op against the mock store).
const DEMO_JURISDICTIONS = ['ae-difc', 'ae-adgm', 'ae', 'qa', 'qa-qfc', 'sa', 'bh', 'ng', 'intl'];
const DEMO_SECTORS = ['corporate', 'data_protection', 'commercial', 'employment', 'financial', 'oil_gas'];

export function buildSeed(): SeedStore {
  return {
    organizations: [
      {
        id: DEMO_ORG_ID,
        name: 'Demo Organisation',
        slug: DEMO_ORG_SLUG,
        billing_plan: 'growth',
        settings: {},
        created_at: daysAgo(180),
        updated_at: daysAgo(2),
      },
    ],

    profiles: [
      { id: DEMO_USER_ID, email: DEMO_EMAIL, full_name: 'Demo Counsel', avatar_url: null, created_at: daysAgo(180), updated_at: daysAgo(2) },
      { id: 'user-counsel', email: 'amina.k@lexai.local', full_name: 'Amina Kassim', avatar_url: null, created_at: daysAgo(160), updated_at: daysAgo(20) },
      { id: 'user-reviewer', email: 'tariq.r@lexai.local', full_name: 'Tariq Rahman', avatar_url: null, created_at: daysAgo(120), updated_at: daysAgo(20) },
    ],

    memberships: [
      { org_id: DEMO_ORG_ID, user_id: DEMO_USER_ID, role: 'owner', created_at: daysAgo(180) },
      { org_id: DEMO_ORG_ID, user_id: 'user-counsel', role: 'counsel', created_at: daysAgo(160) },
      { org_id: DEMO_ORG_ID, user_id: 'user-reviewer', role: 'reviewer', created_at: daysAgo(120) },
    ],

    workspaces: [
      {
        id: DEMO_WORKSPACE_ID,
        org_id: DEMO_ORG_ID,
        name: 'MENA & Africa operations',
        default_jurisdiction: 'ae-difc',
        default_language: 'en',
        enabled_jurisdictions: DEMO_JURISDICTIONS,
        enabled_sectors: DEMO_SECTORS,
        created_at: daysAgo(180),
        updated_at: daysAgo(2),
      },
    ],

    legal_sources: [
      src('difc-contract-law', 'DIFC Contract Law (DIFC Law No. 6 of 2004)', 'ae-difc', 'commercial', 'statute', '2004-09-13', 'https://www.difc.ae/business/laws-and-regulations'),
      src('difc-employment-law', 'DIFC Employment Law (DIFC Law No. 2 of 2019)', 'ae-difc', 'employment', 'statute', '2019-08-28', 'https://www.difc.ae/business/laws-and-regulations'),
      src('difc-dp-law', 'DIFC Data Protection Law (DIFC Law No. 5 of 2020)', 'ae-difc', 'data_protection', 'statute', '2020-07-01', 'https://www.difc.ae/business/laws-and-regulations/data-protection-law'),
      src('adgm-dp-regs', 'ADGM Data Protection Regulations 2021', 'ae-adgm', 'data_protection', 'regulation', '2021-07-14', 'https://www.adgm.com/legal-framework/guidance-and-policy-statements'),
      src('sa-pdpl', 'KSA Personal Data Protection Law (Royal Decree M/19)', 'sa', 'data_protection', 'statute', '2023-09-14', 'https://sdaia.gov.sa/en/SDAIA/about/Pages/PersonalDataProtection.aspx'),
      src('qfc-employment-regs', 'QFC Employment Regulations 2020', 'qa-qfc', 'employment', 'regulation', '2020-01-01', 'https://qfc.qa/legislation'),
      src('ng-pia-2021', 'Nigeria Petroleum Industry Act 2021', 'ng', 'oil_gas', 'statute', '2021-08-16', 'https://www.nuprc.gov.ng'),
    ],

    legal_chunks: [
      chunk('difc-contract-law', 1, 'Art. 17', ['Formation', 'Offer and acceptance'],
        'A contract is concluded by the acceptance of an offer. An offer becomes effective when it reaches the offeree, and may be revoked if the revocation reaches the offeree before or at the same time as the offer.'),
      chunk('difc-contract-law', 2, 'Art. 49', ['Performance', 'Time of performance'],
        'Where a party is obliged to perform at a fixed time or within a fixed period, it must perform at that time. A party may not require performance before time unless the circumstances indicate otherwise.'),
      chunk('difc-contract-law', 3, 'Art. 82', ['Damages', 'Right to damages'],
        'Any non-performance gives the aggrieved party a right to damages either exclusively or in conjunction with any other remedies, subject to the limits on foreseeability and mitigation.'),
      chunk('difc-employment-law', 1, 'Art. 17', ['Written particulars'],
        'An employer must give an employee a written employment contract within one month of the employee’s start date, setting out wages, working hours, leave entitlement and notice periods.'),
      chunk('difc-employment-law', 2, 'Art. 19', ['Working time'],
        'The maximum working week is 48 hours averaged over a reference period, unless the employee has agreed in writing to exceed it. Daily and weekly rest periods are mandatory.'),
      chunk('difc-employment-law', 3, 'Art. 62', ['Termination', 'Notice'],
        'Either party may terminate employment by giving the minimum statutory notice, which scales with length of service. Payment in lieu of notice is permitted where the contract so provides.'),
      chunk('difc-dp-law', 1, 'Art. 9', ['Lawful processing'],
        'Personal data must be processed lawfully, fairly and transparently. A controller must identify a lawful basis prior to processing and document it.'),
      chunk('difc-dp-law', 2, 'Art. 14', ['Cross-border transfers'],
        'A transfer of personal data to a recipient outside the DIFC may occur only where an adequate level of protection exists, or appropriate safeguards such as standard contractual clauses are in place.'),
      chunk('difc-dp-law', 3, 'Art. 33', ['Personal data breach'],
        'A controller must notify the Commissioner of a personal data breach that compromises a data subject’s confidentiality, security or privacy as soon as practicable, and in any event within 72 hours where feasible.'),
      chunk('adgm-dp-regs', 1, 'Reg. 36', ['Breach notification'],
        'A controller shall notify the Office of Data Protection of a personal data breach without undue delay and, where feasible, not later than 72 hours after becoming aware of it.'),
      chunk('adgm-dp-regs', 2, 'Reg. 42', ['International transfers'],
        'Transfers outside ADGM require an adequacy decision or appropriate safeguards. The controller bears the burden of demonstrating that the safeguards are enforceable.'),
      chunk('sa-pdpl', 1, 'Art. 12', ['Consent'],
        'Processing of personal data requires the data subject’s consent, save for the limited exceptions set out in the Law. Consent must be freely given and may be withdrawn.'),
      chunk('sa-pdpl', 2, 'Art. 29', ['Transfer outside the Kingdom'],
        'Transfer of personal data outside the Kingdom is permitted only to the extent necessary and subject to safeguards prescribed by the Competent Authority.'),
      chunk('qfc-employment-regs', 1, 'Reg. 24', ['End of service'],
        'On termination, an employee with at least one year of continuous service is entitled to an end-of-service gratuity calculated on the basic wage for each year of service.'),
      chunk('ng-pia-2021', 1, 'Sec. 235', ['Host community development'],
        'A settlor shall make an annual contribution to the host communities development trust fund of an amount equal to a prescribed percentage of its actual operating expenditure for the preceding year.'),
    ],

    matters: [
      matter('matter-acme', 'DIFC SaaS distribution — ACME / Beta', ['ae-difc'], ['commercial', 'data_protection'], false, daysAgo(40)),
      matter('matter-helios', 'ADGM data transfer assessment — Helios', ['ae-adgm'], ['data_protection'], false, daysAgo(22)),
      matter('matter-najd', 'KSA employment restructuring — Najd Energy', ['sa'], ['employment'], true, daysAgo(11)),
    ],

    contracts: [
      {
        id: 'contract-nda', matter_id: 'matter-acme', title: 'Mutual NDA — ACME / Beta',
        language: 'en', jurisdictions: ['ae-difc'], contract_type: 'Mutual NDA',
        source_file_path: 'acme-beta-mutual-nda.pdf', current_version_id: 'ver-nda',
        status: 'review', created_by: DEMO_USER_ID, created_at: daysAgo(8), updated_at: daysAgo(8),
      },
      {
        id: 'contract-employment', matter_id: 'matter-najd', title: 'Employment Contract — Najd Energy',
        language: 'en', jurisdictions: ['sa'], contract_type: 'Employment Contract',
        source_file_path: null, current_version_id: 'ver-employment',
        status: 'review', created_by: DEMO_USER_ID, created_at: daysAgo(5), updated_at: daysAgo(5),
      },
    ],

    contract_versions: [
      {
        id: 'ver-nda', contract_id: 'contract-nda', version_no: 1,
        body_md: 'Mutual Non-Disclosure Agreement between ACME DIFC Ltd and Beta Holdings Ltd. (Full text extracted from the uploaded PDF.)',
        body_docx_path: null, generated_by: 'review_merge', prompt_hash: 'demo', retrieval_hash: 'demo',
        model_id: 'claude-sonnet-4-6', created_by: DEMO_USER_ID, created_at: daysAgo(8),
      },
      {
        id: 'ver-employment', contract_id: 'contract-employment', version_no: 1,
        body_md: '# Employment Contract\n\n**Parties.** Najd Energy Co. and the Employee.\n\n## 1. Term [C1]\n## 2. Working time [C2]\n## 3. End of service [C3]',
        body_docx_path: null, generated_by: 'ai', prompt_hash: 'demo', retrieval_hash: 'demo',
        model_id: 'claude-opus-4-7', created_by: DEMO_USER_ID, created_at: daysAgo(5),
      },
    ],

    clauses: [
      clause('cl-nda-1', 'ver-nda', 0, 'governing_law', 'Governing Law & Jurisdiction', 'ae-difc', 'ok', 'high',
        'This Agreement is governed by the laws of the DIFC and the parties submit to the exclusive jurisdiction of the DIFC Courts.', null),
      clause('cl-nda-2', 'ver-nda', 1, 'confidentiality', 'Definition of Confidential Information', 'ae-difc', 'attention', 'high',
        'Confidential Information means any information disclosed by one party to the other, whether orally or in writing.',
        '**Issue.** The definition is broad and lacks a carve-out for information already in the public domain or independently developed.\n\n**Suggested redline.**\nAdd: "Confidential Information shall not include information that (a) is or becomes publicly available other than through breach of this Agreement, or (b) was independently developed by the receiving party."'),
      clause('cl-nda-3', 'ver-nda', 2, 'indemnity', 'Indemnification', 'ae-difc', 'high', 'medium',
        'The Receiving Party shall indemnify the Disclosing Party against all losses arising from any unauthorised disclosure.',
        '**Issue.** The indemnity is uncapped and does not exclude indirect or consequential loss, exposing the client to disproportionate liability.\n\n**Suggested redline.**\nCap aggregate liability and exclude indirect, consequential and punitive damages, consistent with DIFC Contract Law remedies on foreseeability.'),
      clause('cl-nda-4', 'ver-nda', 3, 'term', 'Term & Survival', 'ae-difc', 'ok', 'high',
        'This Agreement remains in force for three (3) years, and confidentiality obligations survive for a further two (2) years.', null),
      clause('cl-nda-5', 'ver-nda', 4, 'data_protection', 'Data Protection', 'ae-difc', 'blocking', 'high',
        'Each party may process personal data shared under this Agreement as it sees fit.',
        '**Issue.** The clause permits unrestricted processing and is incompatible with the DIFC Data Protection Law, which requires a lawful basis and safeguards for cross-border transfers. As drafted it is unenforceable.\n\n**Suggested redline.**\nRestrict processing to the purpose of this Agreement, require a lawful basis, and add standard contractual clauses for any transfer of personal data outside the DIFC.'),

      clause('cl-emp-1', 'ver-employment', 0, 'cited_law', 'QFC Employment Regulations 2020', 'sa', null, 'high',
        'On termination, an employee with at least one year of continuous service is entitled to an end-of-service gratuity calculated on the basic wage for each year of service.', 'Cited: Reg. 24'),
      clause('cl-emp-2', 'ver-employment', 1, 'cited_law', 'DIFC Employment Law (DIFC Law No. 2 of 2019)', 'sa', null, 'high',
        'The maximum working week is 48 hours averaged over a reference period, unless the employee has agreed in writing to exceed it.', 'Cited: Art. 19'),
      clause('cl-emp-3', 'ver-employment', 2, 'cited_law', 'KSA Personal Data Protection Law', 'sa', null, 'high',
        'Processing of employee personal data requires a lawful basis; consent must be freely given and may be withdrawn.', 'Cited: Art. 12'),
    ],

    clause_citations: [
      cite('cc-1', 'cl-nda-3', 'difc-contract-law', 'chunk:difc-contract-law:3', 'Art. 82', 'Any non-performance gives the aggrieved party a right to damages subject to foreseeability and mitigation.'),
      cite('cc-2', 'cl-nda-5', 'difc-dp-law', 'chunk:difc-dp-law:2', 'Art. 14', 'A transfer of personal data outside the DIFC may occur only where appropriate safeguards such as standard contractual clauses are in place.'),
      cite('cc-3', 'cl-emp-1', 'qfc-employment-regs', 'chunk:qfc-employment-regs:1', 'Reg. 24', 'End-of-service gratuity calculated on the basic wage for each year of service.'),
      cite('cc-4', 'cl-emp-2', 'difc-employment-law', 'chunk:difc-employment-law:2', 'Art. 19', 'The maximum working week is 48 hours averaged over a reference period.'),
      cite('cc-5', 'cl-emp-3', 'sa-pdpl', 'chunk:sa-pdpl:1', 'Art. 12', 'Processing of personal data requires the data subject’s consent.'),
    ],

    regulatory_events: [
      event('ev-1', 'difc-dp-law', 'amended', daysAgo(6), daysFromNow(24), 'high',
        'DIFC issued amendments tightening breach-notification timelines and expanding the definition of high-risk processing under the Data Protection Law.',
        'Map current processing activities against the new high-risk categories and update the breach runbook before the effective date.',
        ['data_protection', 'breach_notification']),
      event('ev-2', 'adgm-dp-regs', 'amended', daysAgo(14), daysFromNow(40), 'attention',
        'ADGM Office of Data Protection published guidance clarifying acceptable safeguards for international transfers.',
        'Review existing SCCs against the clarified guidance.',
        ['data_protection', 'international_transfers']),
      event('ev-3', 'sa-pdpl', 'amended', daysAgo(20), daysFromNow(10), 'high',
        'SDAIA released implementing regulations specifying conditions for transferring personal data outside the Kingdom.',
        'Assess any KSA-to-offshore data flows for the Najd Energy matter against the new transfer conditions.',
        ['data_protection', 'cross_border']),
      event('ev-4', 'difc-employment-law', 'new', daysAgo(31), null, 'info',
        'DIFC published a practice note on written particulars and probation periods.',
        null,
        ['employment']),
      event('ev-5', 'qfc-employment-regs', 'amended', daysAgo(48), daysFromNow(5), 'attention',
        'QFC updated the end-of-service gratuity calculation basis effective next month.',
        'Recompute gratuity accruals for QFC-based staff.',
        ['employment', 'end_of_service']),
      event('ev-6', 'ng-pia-2021', 'new', daysAgo(60), daysAgo(5), 'blocking',
        'NUPRC issued host-community trust fund contribution regulations now in force, with penalties for non-compliance.',
        'Confirm settlor contribution calculations are filed; non-compliance carries licence-level consequences.',
        ['oil_gas', 'host_community']),
      event('ev-7', 'difc-contract-law', 'new', daysAgo(80), null, 'info',
        'DIFC Courts published a practice direction on electronic execution of contracts.',
        null,
        ['commercial']),
    ],

    audit_log: [
      audit('al-1', 'contract.review', 'contract', 'contract-nda', daysAgo(8), null, 'a1b2c3d4e5f6', { filename: 'acme-beta-mutual-nda.pdf', clauses: 5, blocking: 1, high: 1 }),
      audit('al-2', 'contract.generate', 'contract', 'contract-employment', daysAgo(5), 'a1b2c3d4e5f6', 'b2c3d4e5f6a7', { documentType: 'Employment Contract', jurisdiction: 'sa', cited: 3 }),
      audit('al-3', 'regulatory.digest', null, null, daysAgo(2), 'b2c3d4e5f6a7', 'c3d4e5f6a7b8', { eventCount: 7 }),
    ],
  };
}

// --- row builders ---------------------------------------------------------

function src(
  key: string, title: string, jurisdiction: string, sector: string,
  source_type: string, effective_from: string, official_url: string,
): Table {
  return {
    id: `src-${key}`, key, jurisdiction, sector, source_type, title,
    publisher: null, official_url, language: 'en',
    effective_from, effective_to: null, superseded_by: null,
    raw_storage_path: null, sha256: null, license_class: 'public',
    metadata: {}, ingested_at: daysAgo(90), created_at: daysAgo(90),
  };
}

function chunk(sourceKey: string, ordinal: number, locator: string, heading_path: string[], body: string): Table {
  return {
    id: `chunk:${sourceKey}:${ordinal}`, source_id: `src-${sourceKey}`, ordinal,
    heading_path, locator, body, token_count: Math.ceil(body.length / 4),
    language: 'en', embedding: null, created_at: daysAgo(90),
  };
}

function matter(
  id: string, name: string, jurisdictions: string[], sectors: string[],
  is_sharia: boolean, created_at: string,
): Table {
  return {
    id, workspace_id: DEMO_WORKSPACE_ID, name, parties: [], jurisdictions, sectors,
    is_sharia, status: 'active', created_by: DEMO_USER_ID, created_at, updated_at: created_at,
  };
}

function clause(
  id: string, contract_version_id: string, ordinal: number, clause_type: string,
  heading: string, jurisdiction: string, risk_level: string | null, confidence: string,
  body_md: string, rationale: string | null,
): Table {
  return {
    id, contract_version_id, ordinal, clause_type, heading, body_md,
    jurisdiction, language: 'en', risk_level, confidence, rationale,
  };
}

function cite(id: string, clause_id: string, sourceKey: string, chunk_id: string, locator: string, quote: string): Table {
  return { id, clause_id, source_id: `src-${sourceKey}`, chunk_id, locator, quote, created_at: daysAgo(8) };
}

function event(
  id: string, sourceKey: string, change_type: string, detected_at: string,
  effective_at: string | null, severity: string, summary: string,
  action: string | null, areas: string[],
): Table {
  return {
    id, source_id: `src-${sourceKey}`, change_type, summary,
    diff: { severity, action, areas }, detected_at, effective_at,
  };
}

function audit(
  id: string, action: string, target_type: string | null, target_id: string | null,
  created_at: string, prev_hash: string | null, entry_hash: string, metadata: Table,
): Table {
  return {
    id, org_id: DEMO_ORG_ID, actor_id: DEMO_USER_ID, action, target_type, target_id,
    prompt_hash: null, retrieval_hash: null, output_hash: null, metadata,
    prev_hash, entry_hash, created_at,
  };
}
