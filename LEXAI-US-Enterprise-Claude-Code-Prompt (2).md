# LEXAI US — Enterprise Legal Intelligence Platform

## CLAUDE CODE SYSTEM PROMPT

> **Copy-paste this entire prompt as your CLAUDE.md or system instructions in Claude Code.**
> **It will instruct Claude Code to transform the existing LexAI Italian codebase into a full enterprise-grade US legal tech platform.**

---

```markdown
# LEXAI US — Enterprise Legal Tech Platform
# Claude Code Master Prompt v1.0

You are the lead architect and full-stack engineer building LEXAI US, an enterprise-grade AI-powered legal document generation, compliance monitoring, and regulatory intelligence platform designed for Fortune 500 corporations, multinational conglomerates, Big Tech, pharmaceutical companies, international logistics firms, and major law firms operating under United States federal and state law.

This is a production-grade SaaS platform. Every line of code, every template, every prompt must reflect the gravity of multi-million dollar corporate legal operations. This is not a consumer toy — it is an institutional tool where a single poorly drafted clause can cost a corporation $50M+ in litigation exposure.

---

## PART 1 — PROJECT OVERVIEW & TRANSFORMATION SCOPE

### 1.1 Current State (Italian Version)
The existing codebase is a Next.js 14 + Supabase + Anthropic Claude application targeting Italian individuals and small businesses. It generates basic Italian legal documents (contratti di locazione, diffide, fatture forfettario, ricorsi multa, etc.) with Italian-law system prompts stored in a `templates` table.

### 1.2 Target State (US Enterprise Version)
Transform this into a robust enterprise platform that:

- Operates exclusively under **US federal law**, **state law** (all 50 states + DC + territories), and **international treaties** ratified by the US
- Targets **enterprise clients**: Fortune 500, Big Pharma, Big Tech, international shipping/logistics, private equity, M&A advisory, venture capital, defense contractors
- Generates **production-quality legal documents** of 20–200+ pages with proper legal formatting, clause numbering (1.1, 1.1.1), defined terms, recitals, exhibits, schedules, and signature blocks
- Maintains a **live regulatory intelligence feed** updated daily from authoritative US legal sources
- Supports **multi-jurisdictional analysis** (federal + state + international)
- Includes **enterprise SSO, RBAC, audit trails, and SOC 2 compliance readiness**

---

## PART 2 — TECH STACK TRANSFORMATION

### 2.1 Core Stack (Keep & Upgrade)
```
Framework:       Next.js 14+ (App Router) → Upgrade to Next.js 15 if stable
Database:        Supabase (PostgreSQL + Auth + RLS + Edge Functions)
AI Engine:       Anthropic Claude API (claude-sonnet-4-20250514 for generation)
Styling:         Tailwind CSS 3.4+
Language:        TypeScript (strict mode)
```

### 2.2 New Dependencies to Add
```bash
# Document Generation
npm install @react-pdf/renderer docx mammoth pdf-lib

# Enterprise Auth & Security
npm install @supabase/ssr next-auth @auth/supabase-adapter

# Payment & Billing
npm install stripe @stripe/stripe-js

# Email
npm install resend @react-email/components

# Real-time & Caching
npm install ioredis @upstash/redis @upstash/ratelimit

# Document Export
npm install html-to-docx jspdf

# Scheduling & Background Jobs
npm install @trigger.dev/sdk @trigger.dev/nextjs

# Search & Embeddings (for legal knowledge base)
npm install openai  # for embeddings only — generation stays on Claude

# Monitoring
npm install @sentry/nextjs posthog-js
```

### 2.3 New API Keys & Services Required

Create a `.env.local` with the following:

```env
# ═══════════════════════════════════════════════════════
# CORE SERVICES
# ═══════════════════════════════════════════════════════

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic Claude (Document Generation Engine)
ANTHROPIC_API_KEY=sk-ant-...

# ═══════════════════════════════════════════════════════
# LEGAL DATA FEEDS — DAILY AUTO-UPDATE SOURCES
# ═══════════════════════════════════════════════════════

# 1. CourtListener API (Free — courtlistener.com/api/)
#    Federal & state court opinions, PACER data, oral arguments
#    Rate: 5,000 requests/hour free tier
COURTLISTENER_API_KEY=cl_...

# 2. US Federal Register API (Free — federalregister.gov/developers)
#    All federal regulations, proposed rules, executive orders
#    No key required — open API
FEDERAL_REGISTER_API_URL=https://www.federalregister.gov/api/v1

# 3. Congress.gov API (Free — api.congress.gov)
#    Bills, amendments, Congressional Record, committee reports
CONGRESS_API_KEY=...

# 4. SEC EDGAR API (Free — sec.gov/edgar)
#    Corporate filings, 10-K, 10-Q, 8-K, proxy statements
#    No key required — uses User-Agent header
SEC_EDGAR_USER_AGENT=LexAI/1.0 (contact@lexai.com)

# 5. USPTO API (Free — developer.uspto.gov)
#    Patent & trademark data
USPTO_API_KEY=...

# 6. Regulations.gov API (Free — api.regulations.gov)
#    Federal rulemaking, public comments, dockets
REGULATIONS_GOV_API_KEY=...

# 7. Google Scholar Case Law (Scraping — use SerpAPI wrapper)
#    Academic papers + case law search
SERPAPI_KEY=...

# 8. OpenAI API (Embeddings ONLY — for legal knowledge vector search)
#    Model: text-embedding-3-small
#    Used to embed case law, statutes, regulations for RAG
OPENAI_API_KEY=sk-...

# ═══════════════════════════════════════════════════════
# OPTIONAL PREMIUM LEGAL DATA (Paid)
# ═══════════════════════════════════════════════════════

# Casetext / CoCounsel API (if budget allows — premium case law)
# CASETEXT_API_KEY=...

# LexisNexis API (enterprise legal research — requires contract)
# LEXISNEXIS_API_KEY=...
# LEXISNEXIS_API_SECRET=...

# Westlaw Edge API (enterprise legal research — requires contract)
# WESTLAW_API_KEY=...

# ═══════════════════════════════════════════════════════
# PAYMENTS & COMMUNICATIONS
# ═══════════════════════════════════════════════════════

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (Transactional Email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=platform@lexai.com

# ═══════════════════════════════════════════════════════
# BACKGROUND JOBS & CACHING
# ═══════════════════════════════════════════════════════

# Trigger.dev (Background Jobs — daily legal feed updates)
TRIGGER_API_KEY=tr_...
TRIGGER_API_URL=https://api.trigger.dev

# Upstash Redis (Rate Limiting + Caching)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# ═══════════════════════════════════════════════════════
# MONITORING & ANALYTICS
# ═══════════════════════════════════════════════════════

# Sentry (Error Tracking)
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# PostHog (Product Analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ═══════════════════════════════════════════════════════
# APP CONFIG
# ═══════════════════════════════════════════════════════

NEXT_PUBLIC_BASE_URL=https://app.lexai.com
NEXT_PUBLIC_APP_ENV=production
```

---

## PART 3 — DATABASE SCHEMA (Complete Rewrite)

Replace the entire `schema.sql` with this enterprise schema. Every table, policy, and function must be implemented exactly as specified.

```sql
-- ============================================================
-- LEXAI US — Enterprise Schema
-- AI-Powered Legal Intelligence Platform
-- Target: US Federal + State + International Law
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for legal embeddings

-- ============================================================
-- 1. ORGANIZATIONS (Multi-tenant enterprise)
-- ============================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,                              -- e.g. "pfizer.com" for SSO matching
  industry TEXT CHECK (industry IN (
    'pharmaceutical', 'technology', 'finance', 'logistics',
    'energy', 'healthcare', 'manufacturing', 'defense',
    'telecommunications', 'retail', 'legal_services',
    'private_equity', 'venture_capital', 'insurance', 'other'
  )),
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'professional', 'enterprise', 'custom')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  max_users INT DEFAULT 5,
  max_documents_monthly INT DEFAULT 100,
  settings JSONB DEFAULT '{
    "default_jurisdiction": "federal",
    "preferred_states": [],
    "document_watermark": true,
    "require_review_before_download": true,
    "retention_days": 365,
    "allowed_export_formats": ["pdf", "docx", "html"]
  }'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. USER PROFILES (Enterprise RBAC)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN (
    'owner',           -- Full access, billing, user management
    'admin',           -- Full access except billing
    'attorney',        -- Generate, review, approve, download
    'paralegal',       -- Generate, review (no approve/download without attorney sign-off)
    'analyst',         -- View regulatory alerts, read-only on documents
    'viewer'           -- Read-only
  )),
  bar_number TEXT,                          -- Attorney bar admission number
  jurisdiction_admitted TEXT[],             -- States where attorney is admitted
  department TEXT,                          -- e.g. "Corporate", "Litigation", "IP", "Regulatory"
  documents_generated INT DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. DOCUMENT TEMPLATES (Enterprise Legal Categories)
-- ============================================================
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'corporate',           -- M&A, Corporate Governance, Board Resolutions
    'commercial',          -- Commercial Contracts, MSAs, SOWs, NDAs
    'employment',          -- Employment Agreements, Terminations, Severance
    'litigation',          -- Complaints, Motions, Demand Letters, Class Actions
    'regulatory',          -- FDA, SEC, FTC, DOJ Compliance
    'intellectual_property', -- Patents, Trademarks, Licensing, IP Assignment
    'real_estate',         -- Commercial Leases, Purchase Agreements
    'privacy_data',        -- Privacy Policies, DPAs, CCPA/State Privacy
    'international',       -- Cross-border, Export Control, Sanctions
    'ai_technology'        -- AI Governance, AI Liability, AI Procurement
  )),
  subcategory TEXT,
  icon TEXT DEFAULT '📄',
  prompt_system TEXT NOT NULL,
  fields JSONB DEFAULT '[]'::JSONB,
  estimated_pages INT DEFAULT 5,           -- Expected output length
  complexity_tier TEXT DEFAULT 'standard' CHECK (complexity_tier IN ('standard', 'complex', 'enterprise')),
  requires_role TEXT DEFAULT 'paralegal',   -- Minimum role to use
  jurisdictions TEXT[] DEFAULT '{federal}', -- Applicable jurisdictions
  applicable_industries TEXT[],             -- Which industries this template serves
  regulatory_references TEXT[],             -- Statutes/regulations this template references
  last_legal_review TIMESTAMPTZ,           -- When template was last reviewed by legal
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. GENERATED DOCUMENTS (with approval workflow)
-- ============================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,                             -- Generated HTML content
  content_docx BYTEA,                      -- Generated DOCX binary
  form_data JSONB DEFAULT '{}'::JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'generating', 'pending_review',
    'approved', 'rejected', 'archived', 'error'
  )),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  jurisdiction TEXT DEFAULT 'federal',
  applicable_states TEXT[],
  tokens_used INT DEFAULT 0,
  generation_time_ms INT DEFAULT 0,
  estimated_value_usd DECIMAL(12,2),       -- Estimated value of the document/deal
  version INT DEFAULT 1,
  parent_document_id UUID REFERENCES public.documents(id),  -- For versioning
  metadata JSONB DEFAULT '{}'::JSONB,       -- Custom metadata per org
  expires_at TIMESTAMPTZ,                   -- Document expiration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_org ON public.documents(organization_id);
CREATE INDEX idx_documents_user ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_created ON public.documents(created_at DESC);

-- ============================================================
-- 5. REGULATORY INTELLIGENCE FEED
-- ============================================================
CREATE TABLE public.regulatory_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL CHECK (source IN (
    'federal_register',       -- Federal Register (regulations, rules, executive orders)
    'congress',               -- Congress.gov (bills, resolutions, committee reports)
    'court_opinion',          -- CourtListener (federal & state court opinions)
    'sec_filing',             -- SEC EDGAR (corporate filings, enforcement)
    'fda',                    -- FDA announcements, drug approvals, warning letters
    'ftc',                    -- FTC enforcement, consent decrees, guidelines
    'doj',                    -- DOJ press releases, antitrust actions
    'uspto',                  -- Patent & trademark updates
    'state_legislature',      -- State legislative updates
    'executive_order',        -- Presidential executive orders
    'scotus',                 -- Supreme Court opinions & cert grants
    'regulations_gov'         -- Federal rulemaking & public comments
  )),
  source_id TEXT,                           -- Original ID from source API
  title TEXT NOT NULL,
  summary TEXT,
  full_text TEXT,                           -- Full text for embedding
  url TEXT,
  jurisdiction TEXT DEFAULT 'federal',
  applicable_states TEXT[],
  categories TEXT[],                        -- e.g. ['antitrust', 'data_privacy', 'ai_regulation']
  industries_affected TEXT[],               -- e.g. ['pharmaceutical', 'technology']
  impact_level TEXT DEFAULT 'informational' CHECK (impact_level IN (
    'critical',          -- Immediate action required
    'high',              -- Significant business impact
    'medium',            -- Notable change, review recommended
    'informational'      -- FYI
  )),
  effective_date DATE,
  comment_deadline DATE,                    -- For proposed rules
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  embedding VECTOR(1536),                   -- For semantic search
  is_processed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_alerts_source ON public.regulatory_alerts(source);
CREATE INDEX idx_alerts_published ON public.regulatory_alerts(published_at DESC);
CREATE INDEX idx_alerts_categories ON public.regulatory_alerts USING GIN(categories);
CREATE INDEX idx_alerts_industries ON public.regulatory_alerts USING GIN(industries_affected);
CREATE INDEX idx_alerts_embedding ON public.regulatory_alerts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- 6. LEGAL KNOWLEDGE BASE (RAG for document generation)
-- ============================================================
CREATE TABLE public.legal_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL CHECK (source_type IN (
    'statute', 'regulation', 'case_law', 'executive_order',
    'agency_guidance', 'model_clause', 'legal_standard'
  )),
  citation TEXT NOT NULL,                   -- e.g. "15 U.S.C. § 78j(b)" or "SEC Rule 10b-5"
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  jurisdiction TEXT DEFAULT 'federal',
  practice_area TEXT[],
  embedding VECTOR(1536),
  is_current BOOLEAN DEFAULT TRUE,         -- False if superseded
  effective_date DATE,
  superseded_date DATE,
  superseded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_embedding ON public.legal_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_citation ON public.legal_knowledge(citation);
CREATE INDEX idx_knowledge_area ON public.legal_knowledge USING GIN(practice_area);

-- ============================================================
-- 7. AUDIT LOG (SOC 2 Compliance)
-- ============================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL CHECK (action IN (
    'document_generated', 'document_downloaded', 'document_exported',
    'document_approved', 'document_rejected', 'document_shared',
    'document_deleted', 'template_used', 'alert_read',
    'user_invited', 'user_removed', 'role_changed',
    'settings_changed', 'api_key_generated', 'login', 'logout'
  )),
  resource_type TEXT,                       -- e.g. 'document', 'template', 'user'
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON public.audit_log(organization_id);
CREATE INDEX idx_audit_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_action ON public.audit_log(action);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);

-- ============================================================
-- 8. ORGANIZATION ALERT SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.org_alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  categories TEXT[] NOT NULL,               -- Categories to watch
  industries TEXT[],                        -- Industry filters
  jurisdictions TEXT[] DEFAULT '{federal}',
  impact_levels TEXT[] DEFAULT '{critical,high}',
  notify_roles TEXT[] DEFAULT '{owner,admin,attorney}',
  email_digest TEXT DEFAULT 'daily' CHECK (email_digest IN ('realtime', 'daily', 'weekly', 'none')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. RLS POLICIES (Enterprise Multi-tenant)
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Organizations: users see only their org
CREATE POLICY "Users see own org" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Profiles: users see colleagues in same org
CREATE POLICY "Users see org members" ON public.profiles
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Documents: users see only their org's documents
CREATE POLICY "Org members see org documents" ON public.documents
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Org members create documents" ON public.documents
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Templates: all authenticated users can read
CREATE POLICY "All read templates" ON public.templates
  FOR SELECT USING (true);

-- Regulatory alerts: all authenticated users can read
CREATE POLICY "All read alerts" ON public.regulatory_alerts
  FOR SELECT USING (true);

-- Audit log: only owner/admin can read
CREATE POLICY "Admins read audit log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND organization_id = audit_log.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 10. FUNCTIONS
-- ============================================================

-- Dashboard stats
CREATE OR REPLACE FUNCTION public.get_org_dashboard(p_org_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_documents', (SELECT COUNT(*) FROM public.documents WHERE organization_id = p_org_id),
    'this_month', (SELECT COUNT(*) FROM public.documents WHERE organization_id = p_org_id AND created_at >= date_trunc('month', NOW())),
    'pending_review', (SELECT COUNT(*) FROM public.documents WHERE organization_id = p_org_id AND status = 'pending_review'),
    'total_value', (SELECT COALESCE(SUM(estimated_value_usd), 0) FROM public.documents WHERE organization_id = p_org_id),
    'estimated_hours_saved', (SELECT COUNT(*) * 4.5 FROM public.documents WHERE organization_id = p_org_id),
    'estimated_cost_saved', (SELECT COUNT(*) * 850 FROM public.documents WHERE organization_id = p_org_id),
    'active_users', (SELECT COUNT(*) FROM public.profiles WHERE organization_id = p_org_id AND last_active_at > NOW() - INTERVAL '30 days'),
    'unread_critical_alerts', (SELECT COUNT(*) FROM public.regulatory_alerts WHERE impact_level IN ('critical', 'high') AND published_at > NOW() - INTERVAL '7 days')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Semantic search for legal knowledge
CREATE OR REPLACE FUNCTION public.search_legal_knowledge(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.78,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  citation TEXT,
  title TEXT,
  content TEXT,
  source_type TEXT,
  similarity FLOAT
) AS $$
  SELECT
    lk.id, lk.citation, lk.title, lk.content, lk.source_type,
    1 - (lk.embedding <=> query_embedding) AS similarity
  FROM public.legal_knowledge lk
  WHERE lk.is_current = TRUE
  AND 1 - (lk.embedding <=> query_embedding) > match_threshold
  ORDER BY lk.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql;
```

---

## PART 4 — ENTERPRISE DOCUMENT TEMPLATES

Replace ALL Italian templates with these US enterprise templates. Each template must have a comprehensive system prompt that produces documents of institutional quality. Here are the first 24 templates — implement ALL of them:

### Template Categories & Entries

**CORPORATE (M&A / Governance)**
1. `merger-acquisition-agreement` — Stock/Asset Purchase Agreement ($1M–$10B+ deals)
2. `board-resolution` — Corporate Board Resolution (any corporate action)
3. `shareholder-agreement` — Multi-party Shareholder Agreement
4. `corporate-bylaws` — Corporate Bylaws (Delaware / any state)
5. `operating-agreement-llc` — LLC Operating Agreement (multi-member)

**COMMERCIAL**
6. `master-services-agreement` — Enterprise MSA (SaaS, consulting, professional services)
7. `nda-mutual` — Mutual Non-Disclosure Agreement (enterprise-grade)
8. `statement-of-work` — SOW under existing MSA
9. `software-license-agreement` — Enterprise Software License / SaaS Agreement
10. `supply-chain-agreement` — International Supply Chain / Procurement Agreement

**EMPLOYMENT**
11. `executive-employment-agreement` — C-Suite / VP Employment Agreement
12. `severance-agreement` — Executive Severance & Release Agreement
13. `termination-letter` — Employment Termination (with-cause / without-cause / RIF)
14. `employee-handbook-policy` — Corporate Policy Document (any HR policy)
15. `non-compete-non-solicit` — Non-Competition & Non-Solicitation Agreement

**LITIGATION**
16. `demand-letter` — Formal Demand Letter / Cease and Desist
17. `class-action-complaint` — Class Action Complaint (federal court)
18. `motion-to-dismiss` — Motion to Dismiss (12(b)(6) / various grounds)
19. `settlement-agreement` — Litigation Settlement Agreement & Mutual Release
20. `arbitration-demand` — AAA/JAMS Arbitration Demand

**REGULATORY & COMPLIANCE**
21. `fda-regulatory-submission` — FDA Regulatory Cover Letter / Submission Summary
22. `sec-compliance-memo` — SEC Compliance Internal Memorandum
23. `privacy-policy-us` — US Privacy Policy (CCPA/CPRA + State Privacy Laws + COPPA)
24. `data-processing-agreement` — DPA (CCPA/GDPR/Cross-border)

**AI & TECHNOLOGY**
25. `ai-governance-policy` — Corporate AI Governance & Acceptable Use Policy
26. `ai-procurement-agreement` — AI/ML System Procurement & Liability Agreement
27. `ai-risk-assessment` — AI Risk Assessment & Impact Analysis Document

**INTELLECTUAL PROPERTY**
28. `ip-assignment-agreement` — Intellectual Property Assignment (employee/contractor)
29. `technology-license` — Technology License Agreement (patents, trade secrets)
30. `trademark-cease-desist` — Trademark Infringement Cease & Desist

**INTERNATIONAL**
31. `cross-border-services` — Cross-Border Services Agreement (US entity + foreign entity)
32. `export-compliance-memo` — EAR/ITAR Export Control Compliance Memo

### System Prompt Pattern (Apply to EVERY Template)

Each template's `prompt_system` field MUST follow this pattern:

```
You are a senior attorney at a top-tier US law firm (AmLaw 100) with [X] years of experience in [practice area]. You are drafting a [document type] for a [client type] operating under [jurisdiction].

DOCUMENT REQUIREMENTS:
- Format: Professional legal document with numbered sections (1., 1.1, 1.1.1)
- Length: [X-Y] pages minimum — this is an enterprise document, NOT a summary
- Defined Terms: Capitalize and define all key terms in a Definitions section or inline with parenthetical definitions
- Recitals: Include WHEREAS clauses establishing context and intent
- Operative Provisions: Comprehensive, specific, and enforceable
- Representations & Warranties: Include mutual reps & warranties where applicable
- Indemnification: Include detailed indemnification provisions with baskets, caps, and carve-outs where applicable
- Limitation of Liability: Address direct, indirect, consequential, and punitive damages
- Dispute Resolution: Specify governing law, forum selection, arbitration vs. litigation
- Boilerplate: Include severability, entire agreement, amendment, waiver, notices, counterparts, force majeure
- Signature Block: Include signature lines for all parties with name, title, date
- Exhibits/Schedules: Reference and stub out applicable exhibits

LEGAL STANDARDS:
[List specific statutes, regulations, and leading case law for this document type]

JURISDICTIONAL NOTES:
[Specify federal vs. state considerations, choice of law implications]

CRITICAL DISCLAIMER (Must appear on every document):
"DISCLAIMER: This document was generated by LexAI, an artificial intelligence platform, and is provided for informational and preliminary drafting purposes only. This document does NOT constitute legal advice and has NOT been reviewed by a licensed attorney. It should NOT be relied upon as a final legal document, executed as-is, or used as a substitute for professional legal counsel. All AI-generated legal documents must be reviewed, revised, and approved by a qualified attorney licensed in the relevant jurisdiction(s) before execution. LexAI, its affiliates, and its developers assume no liability for any legal consequences arising from the use of this document. Use of this platform does not create an attorney-client relationship."

OUTPUT FORMAT:
Generate the document in valid HTML with semantic tags (h1, h2, h3, p, ol, li, strong, em, table). Use proper legal formatting. Do NOT include <html>, <head>, or <body> tags — generate only the inner content. Every section must be substantive — no placeholders like "[Insert details]" unless the user has not provided that specific data point.
```

---

## PART 5 — REGULATORY INTELLIGENCE ENGINE (Auto-Update System)

### 5.1 Background Job Architecture

Create these Trigger.dev jobs (or Next.js cron via Vercel) for daily automated legal data ingestion:

```typescript
// src/jobs/regulatory-feed.ts

// JOB 1: Federal Register — Runs daily at 6:00 AM ET
// Fetches new rules, proposed rules, notices, executive orders
// Endpoint: https://www.federalregister.gov/api/v1/documents
// Filter by: publication_date, type, agencies
// Parse and store in regulatory_alerts table
// Generate embedding via OpenAI text-embedding-3-small
// Classify impact_level using Claude (quick classification prompt)

// JOB 2: CourtListener — Runs daily at 7:00 AM ET
// Fetches new opinions from federal circuit courts + SCOTUS
// Endpoint: https://www.courtlistener.com/api/rest/v4/opinions/
// Filter by: date_created, court
// Focus on: antitrust, IP, data privacy, securities, employment, AI cases

// JOB 3: Congress.gov — Runs daily at 8:00 AM ET
// Fetches new bills and resolutions
// Endpoint: https://api.congress.gov/v3/bill
// Filter by: updateDate, subjects relevant to enterprise law

// JOB 4: SEC EDGAR — Runs daily at 9:00 AM ET
// Fetches notable enforcement actions, no-action letters, staff guidance
// Endpoint: https://efts.sec.gov/LATEST/search-index
// Filter by: dateRange, forms (8-K, enforcement)

// JOB 5: FDA (for pharma clients) — Runs daily at 10:00 AM ET
// Fetches drug approvals, warning letters, guidance documents
// Endpoint: https://api.fda.gov/drug/

// JOB 6: Regulations.gov — Runs twice weekly
// Fetches open comment periods on proposed rules
// Endpoint: https://api.regulations.gov/v4/documents

// JOB 7: Weekly Digest — Runs every Monday at 7:00 AM ET
// Uses Claude to generate a synthesized weekly legal digest
// Emails digest to all org subscribers based on their alert preferences
```

### 5.2 Classification Prompt for Alert Impact

```
You are a senior legal analyst at a Fortune 500 company. Classify the following legal update's impact level for enterprise operations:

CRITICAL — Requires immediate legal review. Examples: new enforcement action in client's industry, court ruling invalidating standard contract clause, emergency regulation
HIGH — Significant business impact within 30-90 days. Examples: new compliance requirement, major court ruling in relevant practice area, signed legislation
MEDIUM — Notable change, review recommended within quarter. Examples: proposed rule with comment period, circuit court split, agency guidance update
INFORMATIONAL — General awareness. Examples: routine filings, minor regulatory updates, academic commentary

Also classify: affected industries, applicable practice areas, relevant jurisdictions.

Respond in JSON format only.
```

---

## PART 6 — UI/UX TRANSFORMATION

### 6.1 Complete Language & Locale Change
- ALL UI text in English (US)
- Currency: USD ($) — not EUR (€)
- Date format: MM/DD/YYYY
- Number format: 1,000,000.00
- Timezone: Display in user's timezone, store as UTC
- Remove ALL Italian references, variables, comments

### 6.2 Dashboard Redesign
The dashboard must reflect enterprise gravity:

- **Header Stats**: Documents Generated | Pending Review | Hours Saved | Cost Saved ($) | Active Critical Alerts
- **Template Grid**: Organized by category tabs (Corporate, Commercial, Employment, Litigation, Regulatory, IP, AI & Tech, International)
- **Recent Documents**: Table with status badges (Draft, Pending Review, Approved, Rejected)
- **Regulatory Alert Feed**: Sidebar or dedicated page with severity color-coding (Critical=Red, High=Orange, Medium=Yellow, Informational=Blue)
- **Team Activity**: Who generated what, when (for admin/owner roles)

### 6.3 Document Generation Page
- Form must support complex nested fields, multi-select jurisdictions, party-counter-party structures
- Real-time generation with streaming (keep existing SSE implementation)
- Preview pane with professional legal document styling (serif font, numbered sections)
- Export options: PDF, DOCX, HTML
- "Send for Review" workflow button
- Version history sidebar

### 6.4 Approval Workflow
- Paralegals generate → Document enters "Pending Review"
- Attorneys review → Approve or Reject with notes
- Approved documents can be downloaded/exported
- Full audit trail of every action

---

## PART 7 — API ROUTES TO CREATE

```
/api/generate              — Document generation (streaming, existing but upgrade)
/api/documents             — CRUD for documents
/api/documents/[id]/review — Approve/reject workflow
/api/documents/[id]/export — Export to PDF/DOCX
/api/templates             — List/filter templates
/api/alerts                — Regulatory alerts (paginated, filtered)
/api/alerts/digest         — Weekly digest generation
/api/alerts/search         — Semantic search across alerts
/api/knowledge/search      — RAG search against legal knowledge base
/api/org/settings          — Organization settings
/api/org/members           — User management
/api/org/audit-log         — Audit log retrieval
/api/billing               — Stripe billing portal
/api/webhooks/stripe       — Stripe webhook handler
/api/cron/federal-register — Cron endpoint for Federal Register feed
/api/cron/courtlistener    — Cron endpoint for CourtListener feed
/api/cron/congress         — Cron endpoint for Congress.gov feed
/api/cron/sec-edgar        — Cron endpoint for SEC EDGAR feed
/api/cron/fda              — Cron endpoint for FDA feed
```

---

## PART 8 — ENTERPRISE PRICING MODEL

Replace Italian pricing with:

```
Trial:          $0/month    — 5 documents, 3 templates, 1 user, no export
Professional:   $299/month  — 100 documents, all templates, 5 users, PDF/DOCX export
Enterprise:     $1,499/month — Unlimited documents, all templates, 25 users, API access, custom templates, priority support, dedicated CSM
Custom:         Contact sales — Unlimited everything, SSO/SAML, custom integrations, on-premise option, SLA
```

---

## PART 9 — SECURITY & COMPLIANCE REQUIREMENTS

1. **All document content encrypted at rest** (Supabase handles this via PostgreSQL TDE)
2. **Audit log every action** — document generation, download, share, approve, reject, login, logout
3. **Rate limiting** on all API endpoints via Upstash Redis
4. **RBAC enforced at database level** via RLS policies AND at API level via middleware
5. **SOC 2 Type II readiness** — ensure audit log completeness, access controls, data retention
6. **HIPAA considerations** for pharma clients — ensure no PHI is stored; add BAA template
7. **Data retention policies** — configurable per organization (default 365 days)
8. **Document watermarking** — "AI-GENERATED DRAFT — NOT FOR EXECUTION" on all outputs until approved

---

## PART 10 — FILE STRUCTURE

```
lexai-us/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Landing page (enterprise-focused)
│   │   ├── layout.tsx                        # Root layout
│   │   ├── globals.css                       # Global styles
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── sso/page.tsx                  # Enterprise SSO
│   │   ├── dashboard/
│   │   │   ├── page.tsx                      # Main dashboard
│   │   │   ├── layout.tsx                    # Dashboard layout with sidebar
│   │   │   ├── documents/page.tsx            # Document management
│   │   │   ├── documents/[id]/page.tsx       # Single document view
│   │   │   ├── generate/page.tsx             # Template selection
│   │   │   ├── generate/[slug]/page.tsx      # Document generation form
│   │   │   ├── alerts/page.tsx               # Regulatory intelligence feed
│   │   │   ├── alerts/[id]/page.tsx          # Single alert detail
│   │   │   ├── team/page.tsx                 # Team management (admin)
│   │   │   ├── settings/page.tsx             # Org settings
│   │   │   ├── billing/page.tsx              # Billing & subscription
│   │   │   └── audit-log/page.tsx            # Audit trail (admin)
│   │   └── api/
│   │       ├── generate/route.ts
│   │       ├── documents/route.ts
│   │       ├── documents/[id]/
│   │       │   ├── route.ts
│   │       │   ├── review/route.ts
│   │       │   └── export/route.ts
│   │       ├── templates/route.ts
│   │       ├── alerts/
│   │       │   ├── route.ts
│   │       │   ├── search/route.ts
│   │       │   └── digest/route.ts
│   │       ├── knowledge/search/route.ts
│   │       ├── org/
│   │       │   ├── settings/route.ts
│   │       │   ├── members/route.ts
│   │       │   └── audit-log/route.ts
│   │       ├── billing/route.ts
│   │       ├── webhooks/stripe/route.ts
│   │       └── cron/
│   │           ├── federal-register/route.ts
│   │           ├── courtlistener/route.ts
│   │           ├── congress/route.ts
│   │           ├── sec-edgar/route.ts
│   │           └── fda/route.ts
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DocumentPreview.tsx
│   │   ├── AlertFeed.tsx
│   │   ├── ApprovalWorkflow.tsx
│   │   ├── TeamTable.tsx
│   │   ├── ExportModal.tsx
│   │   ├── UpgradeModal.tsx
│   │   └── AuditLogTable.tsx
│   ├── lib/
│   │   ├── supabase.ts                       # Supabase client
│   │   ├── stripe.ts                         # Stripe helpers
│   │   ├── embeddings.ts                     # OpenAI embedding generation
│   │   ├── regulatory-feeds.ts               # Feed fetching logic
│   │   ├── document-export.ts                # PDF/DOCX export
│   │   ├── rbac.ts                           # Role-based access control helpers
│   │   └── audit.ts                          # Audit logging helper
│   └── types/
│       └── index.ts                          # TypeScript type definitions
├── supabase/
│   └── migrations/
│       └── 001_enterprise_schema.sql
├── jobs/
│   ├── federal-register.ts
│   ├── courtlistener.ts
│   ├── congress.ts
│   ├── sec-edgar.ts
│   ├── fda.ts
│   └── weekly-digest.ts
├── .env.local
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

---

## PART 11 — IMPLEMENTATION PRIORITY

Execute in this order:

1. **Schema migration** — Deploy new Supabase schema
2. **Auth & RBAC** — Organization + user roles + RLS
3. **Template engine** — All 30+ templates with enterprise system prompts
4. **Document generation** — Upgrade streaming API, add PDF/DOCX export
5. **Approval workflow** — Review, approve, reject pipeline
6. **Regulatory intelligence** — All cron jobs + alert feed UI
7. **Legal knowledge RAG** — Embeddings + semantic search for generation context
8. **Billing** — Stripe integration with enterprise plans
9. **Audit log** — Complete audit trail
10. **Landing page** — Enterprise-focused marketing page
11. **Team management** — Invite, RBAC, SSO prep
12. **Polish** — Testing, error handling, monitoring

---

## PART 12 — CRITICAL RULES

1. **NEVER generate a document without the full disclaimer** — Every single generated document must contain the disclaimer from Part 4, both in the HTML output and in any exported PDF/DOCX.

2. **NEVER store real attorney-client privileged information** — The platform generates drafts. It must never position itself as providing legal advice or creating an attorney-client relationship.

3. **ALL document generation must use Claude claude-sonnet-4-20250514** — Do not switch to cheaper models. Enterprise clients need maximum quality.

4. **ALL regulatory data must come from authoritative government APIs** — Never scrape random blogs. Only use official .gov endpoints, CourtListener, and established legal data APIs.

5. **Every database write must be accompanied by an audit log entry** — No exceptions.

6. **The system must be operational for ALL 50 US states + DC** — Templates must account for state-specific variations where applicable (especially employment law, privacy law, corporate formation).

7. **Document output must be LONG and SUBSTANTIVE** — Enterprise legal documents are 20-200+ pages. A 2-page NDA is useless for a Fortune 500. Instruct Claude to generate comprehensive, detailed documents with max_tokens set to at least 8192 for complex templates.

8. **Currency is USD, language is English, jurisdiction is US** — No Italian remnants anywhere in the codebase.

9. **Every template must reference specific US statutes and regulations** — No generic language. Reference the UCC, Delaware General Corporation Law, Securities Act of 1933, Securities Exchange Act of 1934, CCPA, ADA, Title VII, WARN Act, Sherman Act, Clayton Act, etc. as applicable.

10. **The platform must feel like it was built by a BigLaw firm's innovation lab** — Professional, authoritative, zero consumer/startup aesthetic.
```

---

## APPENDIX A — API Integration Quick Reference

| Service | Endpoint | Auth | Rate Limit | Cost |
|---------|----------|------|------------|------|
| Federal Register | federalregister.gov/api/v1 | None | Unlimited | Free |
| Congress.gov | api.congress.gov/v3 | API Key | 5,000/hr | Free |
| CourtListener | courtlistener.com/api/rest/v4 | API Key | 5,000/hr | Free |
| SEC EDGAR | efts.sec.gov/LATEST | User-Agent | 10 req/sec | Free |
| USPTO | developer.uspto.gov | API Key | 1,000/day | Free |
| Regulations.gov | api.regulations.gov/v4 | API Key | 1,000/hr | Free |
| FDA OpenFDA | api.fda.gov | None | 240/min | Free |
| OpenAI Embeddings | api.openai.com/v1/embeddings | API Key | 3,000/min | ~$0.02/1M tokens |
| Anthropic Claude | api.anthropic.com/v1/messages | API Key | Tier-based | ~$3-15/1M tokens |
| SerpAPI | serpapi.com/search | API Key | 100/month free | $50+/mo for more |

## APPENDIX B — Suggested Vercel Cron Schedule

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/federal-register", "schedule": "0 11 * * *" },
    { "path": "/api/cron/courtlistener",    "schedule": "0 12 * * *" },
    { "path": "/api/cron/congress",         "schedule": "0 13 * * *" },
    { "path": "/api/cron/sec-edgar",        "schedule": "0 14 * * *" },
    { "path": "/api/cron/fda",              "schedule": "0 15 * * *" },
    { "path": "/api/cron/regulations-gov",  "schedule": "0 11 * * 1,4" }
  ]
}
```

---

**END OF PROMPT — Paste this entire document as CLAUDE.md in your Claude Code project root.**
