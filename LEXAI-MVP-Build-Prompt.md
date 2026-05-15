# LEXAI — MVP Build Prompt for Claude Code

> **Role:** You are a senior product engineer + legal-tech architect operating inside `/Users/emanuele/Desktop/lexai-us`. Your job is to deliver a working, accurate, citation-grounded MVP of **LEXAI — The AI Legal Operating System for Emerging Markets** as described in `LEXAI_Business_Plan_Completo.html`.
>
> **North star:** The product is only useful if its legal answers are *correct*. Every assertion the AI makes about a statute, regulation, or contractual norm must be tied to a verifiable primary source. Confident-sounding hallucinations are an existential failure mode and must be engineered out, not patched after the fact.

---

## 0. Operating Principles (read before touching code)

1. **Primary sources beat prose.** The AI must reason against ingested statute text, regulator publications, and standardised contract templates — not its own pretraining recall. Pretraining is used only to interpret and translate, never to assert legal facts.
2. **No citation, no claim.** Every legal output (clause, risk flag, regulator-change alert, Q&A answer) must include at least one citation pointing to a stored, retrievable source. If retrieval returns nothing, the system replies *"insufficient sources for this jurisdiction"* — it never extrapolates.
3. **Jurisdiction is a first-class input.** Nothing runs without an explicit `{jurisdiction, sector, contract_type, language}` tuple. Defaulting silently is forbidden.
4. **Confidence is exposed.** Each generated clause/answer carries a `confidence` band (`high|medium|low`) derived from retrieval coverage, source recency, and model self-consistency check. `low` outputs are surfaced with a "requires human counsel" banner.
5. **Bilingual by construction.** EN + FR (OHADA), EN + AR (GCC), EN + PT (Lusophone Africa) — the data model, prompts, and UI must treat language as a per-document axis, never a global toggle.
6. **Auditable end-to-end.** Every prompt, retrieved chunk, model output, user edit, and export is persisted with hashes. Regulated clients will demand this on day one.
7. **Build vertical slices, not horizontal layers.** One end-to-end flow that *actually works* (e.g., generate a DIFC services agreement with citations and export to DOCX) beats eight half-built modules.

---

## 1. Scope of the MVP

Deliver the **8 capabilities** from §2 of the business plan, scoped to a defensible MVP:

| # | Capability | MVP scope |
|---|---|---|
| 1 | **Draft from scratch** | Template-driven contract generation, jurisdiction-aware, with inline citations |
| 2 | **Review incoming contracts** | Upload DOCX/PDF → clause segmentation → risk flags vs. jurisdiction norms → redline suggestions |
| 3 | **Regulatory change alerts** | Daily ingestion job per jurisdiction → diff vs. last snapshot → user-scoped notifications for impacted contracts |
| 4 | **Workflow / roles** | Workspaces, projects, matters, RBAC (Owner / Counsel / Reviewer / Viewer), assignment, status |
| 5 | **Same contract, many jurisdictions** | Master clause library + jurisdiction overlays → "fan-out" generation across selected countries |
| 6 | **Audit trail** | Append-only event log: prompts, retrieved chunks, outputs, user edits, exports — all hashed |
| 7 | **AI assistant Q&A** | Chat scoped to a workspace + jurisdiction set, RAG over the legal corpus, mandatory citations |
| 8 | **Integrations** | DOCX/PDF import + export, e-signature handoff (DocuSign sandbox), Slack alert webhook |

**Out of scope for MVP:** on-chain anchoring, mobile-money billing flows, native CLM marketplace, on-prem deployment. Stub these behind feature flags.

---

## 2. Legal Knowledge Corpus — *what the MVP must actually know*

This is the heart of the product. Build an ingestion pipeline (§5) that loads, normalises, chunks, embeds, and indexes the following primary-source bodies. **All citations in the product must resolve back to a row in `legal_sources`.**

### 2.1 Africa — Cross-cutting frameworks
- **OHADA Uniform Acts** (all 10): General Commercial Law, Commercial Companies & Economic Interest Groups, Security Interests, Simplified Recovery Procedures & Enforcement, Insolvency, Arbitration, Accounting, Carriage of Goods by Road, Cooperative Societies, Mediation. Source: `ohada.org` Journal Officiel.
- **AfCFTA Agreement** + Protocols on Trade in Goods, Trade in Services, Rules of Origin, Investment, Competition, IP, Digital Trade, Women & Youth in Trade.
- **African Charter on Human and Peoples' Rights** (where it impacts employment/data clauses).

### 2.2 Africa — Country tier-1 (full coverage required at MVP)
- **🇳🇬 Nigeria:** Companies and Allied Matters Act 2020 (CAMA), Nigeria Data Protection Act 2023 + NDPR, Finance Acts (most recent), Investments and Securities Act, CBN Guidelines, NCC Telecoms regs, Petroleum Industry Act 2021, FIRS tax circulars.
- **🇿🇦 South Africa:** Companies Act 71 of 2008, POPIA, B-BBEE Act + Codes, Labour Relations Act, Mineral and Petroleum Resources Development Act, Competition Act, FICA (AML), Electronic Communications and Transactions Act.
- **🇰🇪 Kenya:** Companies Act 2015, Data Protection Act 2019, Employment Act, Capital Markets Act, Central Bank Act + CBK prudential guidelines, Mining Act 2016.
- **🇪🇬 Egypt:** Companies Law 159/1981, Investment Law 72/2017, Personal Data Protection Law 151/2020, Labour Law 12/2003, Capital Market Law 95/1992.
- **🇲🇦 Morocco:** Code des Obligations et des Contrats, Loi 09-08 (data protection), Code du Travail, Code Général des Impôts, Code des Investissements 2022.
- **🇨🇮 Côte d'Ivoire, 🇸🇳 Senegal, 🇨🇲 Cameroon:** OHADA-aligned commercial regimes + national data protection (Loi 2013-450 CI; Loi 2008-12 SN; Loi 2010/012 CM) + investment codes.

### 2.3 Africa — Country tier-2 (regulator-change monitoring required, full template coverage v1.1)
Ghana, Rwanda, Tanzania, Uganda, Ethiopia, Angola, Mozambique, DRC, Zambia, Botswana, Namibia, Tunisia, Algeria.

### 2.4 GCC — Full coverage required at MVP
- **🇦🇪 UAE Federal:** Commercial Companies Law (Federal Decree-Law 32/2021), Personal Data Protection Law (Federal Decree-Law 45/2021 — PDPL), Labour Law (33/2021), Anti-Money Laundering Law (20/2018), Commercial Transactions Law, Civil Code, VAT Law, Corporate Tax Law (47/2022).
- **🇦🇪 DIFC:** DIFC Companies Law, DIFC Data Protection Law (5/2020), DIFC Employment Law, DIFC Contract Law, DFSA Rulebook (GEN, COB, AML, CIR), DIFC Insolvency Law, DIFC Arbitration Law.
- **🇦🇪 ADGM:** ADGM Companies Regulations 2020, ADGM Data Protection Regulations 2021, ADGM Employment Regulations 2019, FSRA Rulebook (GEN, COBS, PRU, AML), FSRA Virtual Asset Framework, ADGM Arbitration Regulations.
- **🇦🇪 Free Zones:** DMCC, JAFZA, RAKEZ, NEOM, KAEC company-formation rule packs.
- **🇦🇪 VARA (Dubai):** Virtual Assets Regulatory Authority — full rulebook (Company Rulebook + activity-specific rulebooks: Advisory, Broker-Dealer, Custody, Exchange, Lending & Borrowing, Management & Investment, VA Issuance).
- **🇸🇦 Saudi Arabia:** Companies Law (Royal Decree M/132), Personal Data Protection Law (PDPL) + Executive Regulations, Labor Law, Anti-Cybercrime Law, SAMA banking & insurance rulebooks, CMA Rules on the Offer of Securities and Continuing Obligations, NDMO Data Management & Personal Data Protection Standards, Saudi Central Bank Open Banking Framework, ZATCA tax rulings.
- **🇶🇦 Qatar:** Commercial Companies Law 11/2015, Personal Data Privacy Protection Law 13/2016, Labour Law 14/2004, QFC Regulations, QFCRA Rulebook.
- **🇧🇭 Bahrain:** Commercial Companies Law (Decree-Law 21/2001 as amended), Personal Data Protection Law 30/2018, CBB Rulebook (Volumes 1–6 incl. crypto-asset module), Labour Law 36/2012.
- **🇰🇼 Kuwait, 🇴🇲 Oman:** Companies laws, employment codes, data-protection regulations (Oman Personal Data Protection Law 6/2022), CMA/CBK rulebooks.
- **Islamic finance standards:** **AAOIFI** Sharia Standards (all in force), Financial Accounting Standards, Governance Standards; **IFSB** prudential standards.

### 2.5 Sector — Oil & Gas / Petrochemical
- **Model contracts:** AIPN Model PSA, Model JOA, Model LNG SPA, Model Farmout; ISDA Master + Energy Annex; **FIDIC** Red, Yellow, Silver, Gold, Emerald Books (full clause libraries).
- **Operator/technology licensing references:** Lummus, UOP, Linde, Topsoe standard clause patterns (proprietary — store as *meta-templates*, not verbatim).
- **Regulatory:** EU REACH (Reg. 1907/2006), CLP (1272/2008), **GHS** UN Rev. 10, IMO MARPOL Annex I/VI, EITI Standard 2023, OECD Guidelines for Multinational Enterprises.
- **National petroleum codes:** Nigeria PIA 2021, Angola Law 10/04 + Decree 282/11, Mozambique Petroleum Law 21/2014, Saudi Hydrocarbons Law, UAE Federal Law 14/2017, Qatar Law 3/2007.

### 2.6 Sector — Renewable Energy & Carbon
- **Contract templates:** PPA (solar, wind, gas, biomass, geothermal), EPC (FIDIC Yellow/Silver), O&M, Grid Connection Agreement, Wheeling Agreement, Land Lease (Free-Zone variants), Off-take Agreement.
- **Carbon markets:** Paris Agreement **Article 6** (6.2 ITMOs, 6.4 PACM rules), **Verra VCS** Standard v4.7 + methodologies, **Gold Standard** for the Global Goals v2.x, ICVCM Core Carbon Principles, CORSIA eligibility criteria.
- **Hydrogen / green molecules:** EU Renewable Energy Directive III, Delegated Acts on RFNBOs, UAE National Hydrogen Strategy 2050, Saudi NEOM Green Hydrogen offtake framework.

### 2.7 Sector — Mining & Sovereign Resources
- **National mining codes:** DRC Mining Code 2018, South Africa MPRDA, Zambia Mines & Minerals Development Act 2015, Tanzania Mining Act (as amended 2017), Ghana Minerals and Mining Act 703, Saudi Mining Investment Law 2020, Australia model state acts for cross-reference.
- **Contractual frameworks:** Model Mining Development Agreement (IBA/IGF), local content acts, royalty regimes, environmental rehabilitation bonds.
- **Standards:** IFC Performance Standards, Equator Principles 4, IRMA Standard for Responsible Mining, OECD Due Diligence Guidance for Responsible Supply Chains of Minerals.

### 2.8 Sector — Crypto / Web3 / Fintech
- **VARA Dubai** full rulebook (see §2.4), **ADGM FSRA** Virtual Asset Framework, **CBB** Crypto-Asset Module (Volume 6), **MAS** Payment Services Act + Notices PSN01–PSN08, **HKMA/SFC** VATP regime.
- **AML/CTF:** FATF Recommendations (40), FATF Updated Guidance for VASPs (2021/2023), **Travel Rule** technical implementations (IVMS101), EU TFR (Reg. 2023/1113), OFAC sanctions framework.
- **Tokenisation:** MiCA (Reg. 2023/1114) where it intersects with cross-border offerings, Howey/securities-law cross-references for US-touch transactions, AAOIFI shariah views on digital assets.

### 2.9 Cross-cutting compliance bodies
- **Data protection comparative matrix:** GDPR ↔ UK DPA ↔ UAE PDPL ↔ KSA PDPL ↔ DIFC DPL ↔ ADGM DPR ↔ NDPR ↔ POPIA ↔ Kenya DPA ↔ Egypt PDPL ↔ Bahrain PDPL ↔ Qatar PDPPL ↔ Oman PDPL. Field-by-field equivalence map.
- **Sanctions:** OFAC SDN, EU consolidated list, UK OFSI, UN Security Council consolidated list — for screening-clause generation only.
- **Anti-corruption:** US FCPA, UK Bribery Act 2010, OECD Anti-Bribery Convention, national anti-corruption acts.
- **Arbitration:** New York Convention 1958, UNCITRAL Model Law, ICC Arbitration Rules 2021, LCIA Rules 2020, DIAC Rules 2022, DIFC-LCIA legacy, ADGM Arbitration Centre, AFSA, Cairo CRCICA, Lagos LCA.

---

## 3. Source Acquisition Policy

For each item in §2:

1. **Prefer official primary publishers** (regulator portals, official gazettes). Store the canonical URL, publication date, language, and a SHA-256 of the captured text.
2. **For paywalled / non-redistributable model contracts** (AIPN, FIDIC, ISDA, AAOIFI in some cases): do **not** ingest verbatim. Instead, build *clause-pattern templates* describing the contractual structure and obligations, and store a reference pointer (citation only). The MVP must respect IP licensing.
3. **Translations:** when an official translation does not exist (e.g., OHADA in English), generate one via Claude with a `translation_provenance` field and mark all derived clauses as `translation: unofficial`.
4. **Versioning:** every source row has `effective_from`, `effective_to`, `superseded_by`. The retrieval layer filters by `effective_from <= NOW() AND (effective_to IS NULL OR effective_to > NOW())`.
5. **Update cadence:** daily diff job per regulator portal; hash-based change detection; on change, enqueue a re-embedding task and a *user impact computation* (which workspaces hold contracts whose clauses cite the changed source).

---

## 4. Architecture

### 4.1 Stack (aligned with the existing repo)
- **Frontend / app:** Next.js 15 App Router (already initialised), TypeScript strict, Tailwind, server components for data fetching, server actions for mutations.
- **Auth + DB + Storage:** Supabase (Postgres + pgvector + Storage + Realtime + Auth). RLS on every tenant table.
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`), Claude Opus 4.7 for drafting/review, Claude Haiku 4.5 for classification, embedding, and cheap routing. **Use prompt caching** (`cache_control: { type: "ephemeral" }`) on (a) the system prompt, (b) the retrieved corpus block, (c) the template skeleton. Target ≥80% cache hit rate on repeated drafting flows.
- **Background jobs:** Supabase Edge Functions + `pg_cron` for ingestion and diff jobs; for heavier pipelines, a Node worker on Fly.io or Railway pulling from a `jobs` queue table (SKIP LOCKED).
- **Document handling:** `mammoth` for DOCX → HTML, `pdf-parse` + `pdfjs` for PDF extraction, `docx` (npm) for DOCX export, `puppeteer` for PDF export with track-changes rendering.

> **Bun note:** the global user preference is Bun, but this is a Next.js 15 project deployed to Vercel — keep Next + npm-compatible tooling. Use `bun install` / `bun run` locally; do not swap the framework.

### 4.2 Core data model (Supabase / Postgres)

```
organizations(id, name, billing_plan, created_at)
users(id, email, full_name)
memberships(org_id, user_id, role)  -- owner|counsel|reviewer|viewer
workspaces(id, org_id, name, default_jurisdiction, default_language)
matters(id, workspace_id, name, parties jsonb, jurisdictions text[], sectors text[], status)

contracts(id, matter_id, title, language, jurisdictions text[], status,
          source_file_id, current_version_id)
contract_versions(id, contract_id, version_no, body_md, body_docx_file_id,
                  generated_by, prompt_hash, created_at)
clauses(id, contract_version_id, ordinal, clause_type, body_md,
        jurisdiction, language, risk_level, confidence)
clause_citations(clause_id, source_id, locator)   -- many-to-many

legal_sources(id, jurisdiction, sector, source_type,   -- statute|regulation|case|model_contract|standard
              title, publisher, official_url, language,
              effective_from, effective_to, superseded_by,
              raw_storage_path, sha256, ingested_at, license_class)
legal_chunks(id, source_id, ordinal, heading_path text[], body, token_count,
             embedding vector(1536))
CREATE INDEX ON legal_chunks USING hnsw (embedding vector_cosine_ops);

clause_templates(id, name, sector, contract_type, jurisdiction_scope text[],
                 skeleton_md, required_facts jsonb, optional_facts jsonb,
                 default_language, license_class)
template_overlays(id, template_id, jurisdiction, overlay_md, citations jsonb)

regulatory_events(id, source_id, change_type, summary, detected_at,
                  diff jsonb)
event_impacts(event_id, contract_id, severity, suggested_action)

audit_log(id, actor_id, action, target_type, target_id,
          prompt_hash, retrieval_hash, output_hash, created_at)
jobs(id, kind, payload jsonb, status, run_at, attempts, last_error)
```

All tenant tables enforce RLS: `org_id = auth.jwt() ->> 'org_id'` (or membership lookup for cross-org users).

### 4.3 Retrieval

Hybrid retrieval, in this order:
1. **Structured filter:** `jurisdiction ∈ user.jurisdictions`, `effective_at <= NOW()`, `sector` overlap, `language` preference.
2. **BM25 (Postgres `tsvector`)** over titles + headings.
3. **Vector kNN** via pgvector HNSW over `legal_chunks.embedding`.
4. **Reciprocal Rank Fusion** of (2) and (3); top-k = 24, then **rerank** with Claude Haiku scoring `query↔chunk` relevance, keep top-8.
5. **Citation gate:** the drafting prompt is given the 8 chunks plus their `source_id` + `locator`. The model is instructed (and post-validated) to cite at least one chunk per generated clause; outputs failing the gate are regenerated once, then surfaced as `confidence: low`.

### 4.4 Generation prompts (skeleton)

System prompt sections, in this order (each marked `cache_control: ephemeral` independently):
1. **Identity & guardrails** (never invent statutes; cite or refuse; bilingual rules; sharia-compliance flags when `sector ∈ {islamic_finance}` or `jurisdiction ∈ GCC` and `is_sharia=true`).
2. **Jurisdiction profile** (data-protection regime, contract-law regime, language defaults, mandatory clauses).
3. **Retrieved sources block** (8 chunks, each prefixed with `[source_id | publisher | effective_from | locator]`).
4. **Template skeleton** (the clause-template `skeleton_md` with `{{required_facts}}` placeholders).
5. **User facts** (the only non-cached, per-request block).

Post-generation validators (run on every output):
- **Citation validator:** every clause has ≥1 citation pointing to a row in the retrieved set.
- **Forbidden-pattern scanner:** riba/gharar/haram triggers for sharia-flagged matters; sanctioned-jurisdiction triggers; export-control triggers.
- **Self-consistency check:** re-ask Claude Haiku "does this clause contradict any cited source?" — if yes, regenerate or downgrade confidence.

### 4.5 Review pipeline (capability #2)

1. Upload → text extraction → clause segmentation (Haiku, structured-output JSON).
2. For each clause: classify `clause_type`, derive `jurisdiction_relevance`, retrieve the corresponding norm chunks.
3. Compare clause vs. norms: produce `risk_level ∈ {ok, attention, high, blocking}`, `rationale`, `suggested_redline`.
4. Render side-by-side diff UI with accept/reject; on accept, write a new `contract_versions` row.

### 4.6 Regulatory-change pipeline (capability #3)

`pg_cron` job per source domain → fetcher → text extraction → hash compare → on change: write `regulatory_events`, enqueue impact analysis. Impact analysis joins changed `source_id` against `clause_citations` to find affected contracts; produces `event_impacts` rows; fans out notifications (in-app + Slack webhook + email).

---

## 5. Ingestion Pipeline (build this first — nothing else works without it)

Implement under `src/ingest/`:

- `src/ingest/sources/<jurisdiction>/<source-key>.ts` — one module per source. Exports `{ key, fetch(), parse(html|pdf), version() }`.
- `src/ingest/run.ts` — CLI entrypoint: `bun run ingest -- --jurisdiction=ae-difc --source=companies-law`.
- `src/ingest/chunk.ts` — heading-aware chunker (target 800–1,200 tokens, 100-token overlap, preserves article/section numbers in `heading_path`).
- `src/ingest/embed.ts` — batch embedder (use Voyage `voyage-3-large` or Cohere `embed-multilingual-v3.0` — Anthropic does not ship embeddings; pick one and stick to it for the whole corpus).
- `src/ingest/translate.ts` — Claude Opus translation with provenance tags.
- `src/ingest/verify.ts` — sample 1% of chunks per source; round-trip a known answer; fail the ingestion if recall<0.9.

**Seed order (do not skip):**
1. UAE PDPL + DIFC DPL + ADGM DPR (smallest, builds the comparative scaffold).
2. DIFC Companies Law + ADGM Companies Regs + UAE Federal Companies Law.
3. VARA Company Rulebook + FSRA VA Framework.
4. OHADA Uniform Acts (FR + EN translation).
5. Nigeria CAMA + NDPA, South Africa POPIA + Companies Act, Kenya DPA + Companies Act.
6. Saudi PDPL + Companies Law + SAMA Banking rules.
7. AAOIFI Sharia Standards (clause-pattern only, with citation pointer).
8. FIDIC clause patterns (meta-templates).
9. Article 6 + Verra + Gold Standard.
10. National petroleum + mining codes.
11. FATF Recs + Travel Rule guidance + VARA/ADGM/CBB/MAS VASP rulebooks.

Each seed batch is "done" when: (a) all sources show `ingested_at`, (b) verification recall ≥ 0.9, (c) at least one end-to-end generation flow in that jurisdiction passes its acceptance test (§7).

---

## 6. Build Plan (phased, ordered, no parallel speculation)

> Mark each phase complete only when its acceptance tests pass.

**Phase 0 — Foundation (1–2 days)**
- Supabase schema + RLS policies + migrations under `supabase/migrations/`.
- Auth flows (email + magic link), org/workspace creation, RBAC enforcement.
- App shell: `dashboard/` with workspaces, matters, contracts lists.

**Phase 1 — Ingestion infra (3–5 days)**
- `src/ingest/*` skeleton, chunker, embedder, verifier.
- Seed batch 1 (UAE PDPL + DIFC DPL + ADGM DPR).
- `legal_sources` + `legal_chunks` queryable via a debug `/dashboard/sources` page.

**Phase 2 — Vertical slice #1: DIFC Services Agreement (3–4 days)**
- One template (`clause_templates`) for "DIFC Professional Services Agreement", English, with overlays for DIFC-DPL data-processing clauses.
- Drafting flow: facts form → retrieval → generation → citation gate → preview with hover-citations → DOCX export.
- Acceptance: generated contract cites ≥ 1 DIFC source per clause; legal counsel reviewer approves accuracy of 8/10 sample runs.

**Phase 3 — Vertical slice #2: Review incoming DOCX (3 days)**
- Upload → extract → segment → classify → norm-compare → redline UI.
- Acceptance: on a known-flawed DOCX, system flags ≥ 90% of seeded issues.

**Phase 4 — Seed batches 2–4, multi-jurisdiction fan-out (5–7 days)**
- Add OHADA + Nigeria + South Africa + KSA seed batches.
- Capability #5: select one master clause set and fan out across `{difc, adgm, ksa, nigeria, ohada}` with overlays.
- Acceptance: same NDA generated in 5 jurisdictions, each variant citing local data-protection law correctly.

**Phase 5 — Regulatory change pipeline (3 days)**
- Daily fetchers for ≥ 5 sources, diff job, `regulatory_events` + `event_impacts`, in-app inbox + Slack webhook.
- Acceptance: simulated source change produces correct impact list within 15 minutes.

**Phase 6 — Q&A assistant (2–3 days)**
- Workspace-scoped chat, RAG over the corpus, citation chips inline.
- Acceptance: on a 50-question eval set (10 per top-5 jurisdictions), ≥ 85% answers verified correct by reviewer; 0% uncited assertions.

**Phase 7 — Audit, polish, e-sign handoff (2–3 days)**
- `audit_log` writes from every mutation path; admin viewer.
- DocuSign sandbox handoff.
- Performance: cold drafting p50 < 12s, warm (cached) p50 < 4s.

---

## 7. Quality Gates (cannot ship without these)

1. **Citation coverage:** automated test asserts 100% of generated clauses in the eval set have ≥ 1 valid citation.
2. **Hallucination probe:** 100-question adversarial set with deliberately non-existent statutes ("under the UAE Federal Decree-Law 999/2099…"). System must refuse / express uncertainty on ≥ 98%.
3. **Jurisdiction routing:** 50-prompt set crossing jurisdictions. System never cites a source whose `jurisdiction` is outside the requested set.
4. **Recency:** any source with `effective_to < NOW()` is excluded from retrieval (verified by integration test).
5. **RLS:** automated test attempts cross-org reads with a forged JWT; all must fail.
6. **Sharia trigger:** for matters flagged `is_sharia=true`, generation must not produce clauses containing prohibited patterns (riba interest mechanics, gharar speculation language). Pattern tests ≥ 99% precision.
7. **Bilingual integrity:** AR + EN clause pairs render correctly RTL + LTR; numeric/date fields agree; Hijri/Gregorian dual calendar where applicable.
8. **Eval harness:** `bun run eval` runs the full set above and emits a `eval-report.json`. CI blocks merge on regression.

---

## 8. Deliverables Checklist

- [ ] All migrations in `supabase/migrations/` apply clean from empty.
- [ ] `src/ingest/` operational; seed batches 1–4 ingested, verified, embedded.
- [ ] `src/app/dashboard/` covers: workspaces, matters, contracts, drafting wizard, review viewer, Q&A chat, sources browser, regulatory inbox, audit viewer.
- [ ] `src/lib/ai/` contains: `prompts/`, `retrieval.ts`, `generate.ts`, `validate.ts`, `embed.ts`, `cache.ts`.
- [ ] `src/eval/` contains: golden contracts, adversarial prompts, jurisdiction-routing tests, sharia-pattern tests, RLS tests.
- [ ] `docs/legal-corpus-coverage.md` enumerates every ingested source with version + `effective_from`.
- [ ] `docs/citation-style.md` defines the canonical citation format used in UI + exports.
- [ ] `.env.example` lists every required key (`ANTHROPIC_API_KEY`, `SUPABASE_*`, embedding provider key, DocuSign sandbox, Slack webhook).
- [ ] `README.md` updated with onboarding, ingestion how-to, eval how-to.

---

## 9. What to do if you get stuck

- **Source unavailable / paywalled:** record it in `docs/sourcing-gaps.md` with the regulator, URL, and licensing status. Do **not** silently substitute pretraining knowledge.
- **Translation ambiguity:** keep both languages, mark `translation: unofficial`, surface a UI banner.
- **Conflicting norms across jurisdictions:** never average them. Generate one variant per jurisdiction with its own citations.
- **Confidence low:** show the user, don't hide it. Offer "request human counsel review" as a first-class CTA.

---

## 10. Definition of Done

The MVP is shippable when a real general counsel, given a workspace with `{DIFC, ADGM, KSA, Nigeria, OHADA}` enabled, can:

1. Generate a Services Agreement, NDA, and Data Processing Addendum in any of those jurisdictions, each with verifiable citations to ingested primary sources, in ≤ 2 minutes per document.
2. Upload an incoming DIFC employment contract and receive risk-flagged redlines that a human lawyer rates ≥ 4/5 useful.
3. Receive an alert within 24 hours when a watched source changes, with the impacted contracts pre-identified.
4. Ask "what are the cross-border data-transfer obligations under KSA PDPL?" and receive an answer with citations to the PDPL articles + Executive Regulations.
5. Export an audit pack (PDF) of any contract showing every prompt, source, model output, and human edit, hash-chained.

Anything less is not the MVP. Anything more (mobile-money billing, on-chain anchoring, marketplace) is v1.1.
