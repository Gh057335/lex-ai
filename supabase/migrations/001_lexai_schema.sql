-- LEXAI — AI Legal OS for Emerging Markets
-- Migration 001: core schema
--
-- Design principles (see LEXAI-MVP-Build-Prompt.md §0, §4.2):
--   - Multi-tenant via organizations + memberships, RLS on every tenant table.
--   - Every legal output is grounded in legal_sources, retrievable through legal_chunks (pgvector HNSW).
--   - Every clause carries one or more clause_citations pointing back to legal_sources.
--   - Sources are versioned (effective_from / effective_to / superseded_by); retrieval filters on temporal validity.
--   - Append-only audit_log records prompts, retrievals, outputs, edits — hash-chained for tamper-evidence.
--   - jobs table is a SKIP LOCKED work queue for ingestion/diff/impact pipelines.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================
-- IDENTITY & TENANCY
-- ============================================================

CREATE TABLE public.organizations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  billing_plan TEXT NOT NULL DEFAULT 'trial' CHECK (billing_plan IN ('trial','starter','growth','enterprise','custom')),
  settings     JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.memberships (
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner','counsel','reviewer','viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

CREATE INDEX idx_memberships_user ON public.memberships(user_id);

-- Helper: organisations the caller belongs to.
CREATE OR REPLACE FUNCTION public.current_org_ids() RETURNS SETOF UUID
  LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT org_id FROM public.memberships WHERE user_id = auth.uid();
$$;

-- ============================================================
-- WORKSPACE / MATTER / CONTRACT HIERARCHY
-- ============================================================

CREATE TABLE public.workspaces (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id               UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  default_jurisdiction TEXT,
  default_language     TEXT NOT NULL DEFAULT 'en',
  enabled_jurisdictions TEXT[] NOT NULL DEFAULT '{}',
  enabled_sectors       TEXT[] NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workspaces_org ON public.workspaces(org_id);

CREATE TABLE public.matters (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  parties       JSONB NOT NULL DEFAULT '[]'::JSONB,
  jurisdictions TEXT[] NOT NULL DEFAULT '{}',
  sectors       TEXT[] NOT NULL DEFAULT '{}',
  is_sharia     BOOLEAN NOT NULL DEFAULT FALSE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','archived')),
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matters_workspace ON public.matters(workspace_id);

CREATE TABLE public.contracts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id           UUID NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  language            TEXT NOT NULL DEFAULT 'en',
  jurisdictions       TEXT[] NOT NULL DEFAULT '{}',
  contract_type       TEXT,
  source_file_path    TEXT,  -- Supabase Storage path for the original upload, if any
  current_version_id  UUID,  -- FK fixed below after contract_versions exists
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','review','approved','exported','archived')),
  created_by          UUID REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_matter ON public.contracts(matter_id);

CREATE TABLE public.contract_versions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  version_no      INT NOT NULL,
  body_md         TEXT NOT NULL,
  body_docx_path  TEXT,
  generated_by    TEXT NOT NULL CHECK (generated_by IN ('ai','user','review_merge')),
  prompt_hash     TEXT,
  retrieval_hash  TEXT,
  model_id        TEXT,
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contract_id, version_no)
);

CREATE INDEX idx_contract_versions_contract ON public.contract_versions(contract_id);

ALTER TABLE public.contracts
  ADD CONSTRAINT fk_contracts_current_version
  FOREIGN KEY (current_version_id) REFERENCES public.contract_versions(id) ON DELETE SET NULL;

CREATE TABLE public.clauses (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_version_id UUID NOT NULL REFERENCES public.contract_versions(id) ON DELETE CASCADE,
  ordinal             INT NOT NULL,
  clause_type         TEXT NOT NULL,
  heading             TEXT,
  body_md             TEXT NOT NULL,
  jurisdiction        TEXT,
  language            TEXT NOT NULL DEFAULT 'en',
  risk_level          TEXT CHECK (risk_level IN ('ok','attention','high','blocking')),
  confidence          TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low')),
  rationale           TEXT,
  UNIQUE (contract_version_id, ordinal)
);

CREATE INDEX idx_clauses_contract_version ON public.clauses(contract_version_id);

-- ============================================================
-- LEGAL CORPUS
-- ============================================================

CREATE TABLE public.legal_sources (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key              TEXT UNIQUE NOT NULL,  -- e.g. "ae-difc:companies-law:2018"
  jurisdiction     TEXT NOT NULL,         -- e.g. "ae-difc", "ng", "ohada"
  sector           TEXT,                  -- e.g. "oil_gas", "renewables" (NULL = cross-cutting)
  source_type      TEXT NOT NULL CHECK (source_type IN (
                     'statute','regulation','rulebook','case','model_contract','standard','guidance')),
  title            TEXT NOT NULL,
  publisher        TEXT,
  official_url     TEXT,
  language         TEXT NOT NULL DEFAULT 'en',
  effective_from   DATE,
  effective_to     DATE,
  superseded_by    UUID REFERENCES public.legal_sources(id) ON DELETE SET NULL,
  raw_storage_path TEXT,                  -- Supabase Storage path for the captured original
  sha256           TEXT,                  -- content hash of the raw capture
  license_class    TEXT NOT NULL DEFAULT 'public' CHECK (license_class IN ('public','restricted','meta_only')),
  metadata         JSONB NOT NULL DEFAULT '{}'::JSONB,
  ingested_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_legal_sources_jurisdiction ON public.legal_sources(jurisdiction);
CREATE INDEX idx_legal_sources_sector ON public.legal_sources(sector);
CREATE INDEX idx_legal_sources_effective ON public.legal_sources(effective_from, effective_to);

-- legal_chunks: embeddings + lexical index.
-- Voyage voyage-multilingual-2 emits 1024-dim vectors.
CREATE TABLE public.legal_chunks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id     UUID NOT NULL REFERENCES public.legal_sources(id) ON DELETE CASCADE,
  ordinal       INT NOT NULL,
  heading_path  TEXT[] NOT NULL DEFAULT '{}',
  locator       TEXT,                       -- e.g. "Art. 12(3)"
  body          TEXT NOT NULL,
  token_count   INT NOT NULL,
  language      TEXT NOT NULL DEFAULT 'en',
  embedding     vector(1024),
  tsv           tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(body,''))) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, ordinal)
);

CREATE INDEX idx_legal_chunks_source ON public.legal_chunks(source_id);
CREATE INDEX idx_legal_chunks_tsv ON public.legal_chunks USING GIN(tsv);
CREATE INDEX idx_legal_chunks_embedding ON public.legal_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE TABLE public.clause_citations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clause_id  UUID NOT NULL REFERENCES public.clauses(id) ON DELETE CASCADE,
  source_id  UUID NOT NULL REFERENCES public.legal_sources(id) ON DELETE RESTRICT,
  chunk_id   UUID REFERENCES public.legal_chunks(id) ON DELETE SET NULL,
  locator    TEXT,
  quote      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clause_id, source_id, locator)
);

CREATE INDEX idx_clause_citations_clause ON public.clause_citations(clause_id);
CREATE INDEX idx_clause_citations_source ON public.clause_citations(source_id);

-- ============================================================
-- TEMPLATES & OVERLAYS
-- ============================================================

CREATE TABLE public.clause_templates (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key                 TEXT UNIQUE NOT NULL,         -- e.g. "difc.services_agreement.v1"
  name                TEXT NOT NULL,
  sector              TEXT,
  contract_type       TEXT NOT NULL,                -- e.g. "services_agreement", "nda", "dpa"
  jurisdiction_scope  TEXT[] NOT NULL DEFAULT '{}', -- jurisdictions where the base template applies
  default_language    TEXT NOT NULL DEFAULT 'en',
  skeleton_md         TEXT NOT NULL,                -- markdown skeleton with {{fact}} placeholders
  required_facts      JSONB NOT NULL DEFAULT '[]'::JSONB,
  optional_facts      JSONB NOT NULL DEFAULT '[]'::JSONB,
  license_class       TEXT NOT NULL DEFAULT 'public' CHECK (license_class IN ('public','restricted','meta_only')),
  version             INT NOT NULL DEFAULT 1,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clause_templates_type ON public.clause_templates(contract_type);

CREATE TABLE public.template_overlays (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id  UUID NOT NULL REFERENCES public.clause_templates(id) ON DELETE CASCADE,
  jurisdiction TEXT NOT NULL,
  overlay_md   TEXT NOT NULL,
  citations    JSONB NOT NULL DEFAULT '[]'::JSONB, -- [{source_key, locator}]
  language     TEXT NOT NULL DEFAULT 'en',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, jurisdiction, language)
);

-- ============================================================
-- REGULATORY MONITORING
-- ============================================================

CREATE TABLE public.regulatory_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id    UUID NOT NULL REFERENCES public.legal_sources(id) ON DELETE CASCADE,
  change_type  TEXT NOT NULL CHECK (change_type IN ('new','amended','superseded','withdrawn')),
  summary      TEXT NOT NULL,
  diff         JSONB,
  detected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_at DATE
);

CREATE INDEX idx_regulatory_events_source ON public.regulatory_events(source_id);
CREATE INDEX idx_regulatory_events_detected ON public.regulatory_events(detected_at DESC);

CREATE TABLE public.event_impacts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id          UUID NOT NULL REFERENCES public.regulatory_events(id) ON DELETE CASCADE,
  contract_id       UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  severity          TEXT NOT NULL CHECK (severity IN ('info','attention','high','blocking')),
  suggested_action  TEXT,
  acknowledged_at   TIMESTAMPTZ,
  acknowledged_by   UUID REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, contract_id)
);

CREATE INDEX idx_event_impacts_contract ON public.event_impacts(contract_id);

-- ============================================================
-- AUDIT LOG (append-only, hash-chained)
-- ============================================================

CREATE TABLE public.audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  target_type     TEXT,
  target_id       UUID,
  prompt_hash     TEXT,
  retrieval_hash  TEXT,
  output_hash     TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::JSONB,
  prev_hash       TEXT,
  entry_hash      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_org ON public.audit_log(org_id, created_at DESC);
CREATE INDEX idx_audit_log_target ON public.audit_log(target_type, target_id);

-- ============================================================
-- JOB QUEUE (SKIP LOCKED workers)
-- ============================================================

CREATE TABLE public.jobs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind        TEXT NOT NULL,    -- e.g. "ingest.source", "embed.batch", "diff.source", "impact.compute"
  payload     JSONB NOT NULL DEFAULT '{}'::JSONB,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed','dead')),
  run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempts    INT NOT NULL DEFAULT 0,
  last_error  TEXT,
  locked_by   TEXT,
  locked_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_pickup ON public.jobs(status, run_at) WHERE status IN ('pending','running');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matters          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clauses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clause_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_impacts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log        ENABLE ROW LEVEL SECURITY;
-- legal_sources, legal_chunks, clause_templates, template_overlays, regulatory_events, jobs:
-- corpus + ops tables. Readable by all authenticated users; writes only via service-role.
ALTER TABLE public.legal_sources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_chunks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clause_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs              ENABLE ROW LEVEL SECURITY;

-- Profile: every user can read their own row; users can read profiles of org-mates.
CREATE POLICY profiles_self_read ON public.profiles
  FOR SELECT USING (id = auth.uid() OR id IN (
    SELECT m2.user_id FROM public.memberships m1
    JOIN public.memberships m2 ON m1.org_id = m2.org_id
    WHERE m1.user_id = auth.uid()
  ));
CREATE POLICY profiles_self_write ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_self_insert ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Organisations: members read; owners update.
CREATE POLICY org_member_read ON public.organizations
  FOR SELECT USING (id IN (SELECT public.current_org_ids()));
CREATE POLICY org_owner_update ON public.organizations
  FOR UPDATE USING (id IN (
    SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- Memberships: members read their org's memberships; owners insert/update/delete.
CREATE POLICY membership_read ON public.memberships
  FOR SELECT USING (org_id IN (SELECT public.current_org_ids()));
CREATE POLICY membership_owner_write ON public.memberships
  FOR ALL USING (org_id IN (
    SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role = 'owner'
  )) WITH CHECK (org_id IN (
    SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- Workspaces / matters / contracts: tenant by org.
CREATE POLICY workspace_tenant ON public.workspaces
  FOR ALL USING (org_id IN (SELECT public.current_org_ids()))
  WITH CHECK (org_id IN (SELECT public.current_org_ids()));

CREATE POLICY matter_tenant ON public.matters
  FOR ALL USING (workspace_id IN (
    SELECT id FROM public.workspaces WHERE org_id IN (SELECT public.current_org_ids())
  )) WITH CHECK (workspace_id IN (
    SELECT id FROM public.workspaces WHERE org_id IN (SELECT public.current_org_ids())
  ));

CREATE POLICY contract_tenant ON public.contracts
  FOR ALL USING (matter_id IN (
    SELECT m.id FROM public.matters m
    JOIN public.workspaces w ON w.id = m.workspace_id
    WHERE w.org_id IN (SELECT public.current_org_ids())
  )) WITH CHECK (matter_id IN (
    SELECT m.id FROM public.matters m
    JOIN public.workspaces w ON w.id = m.workspace_id
    WHERE w.org_id IN (SELECT public.current_org_ids())
  ));

CREATE POLICY contract_version_tenant ON public.contract_versions
  FOR ALL USING (contract_id IN (
    SELECT c.id FROM public.contracts c
    JOIN public.matters m ON m.id = c.matter_id
    JOIN public.workspaces w ON w.id = m.workspace_id
    WHERE w.org_id IN (SELECT public.current_org_ids())
  )) WITH CHECK (contract_id IN (
    SELECT c.id FROM public.contracts c
    JOIN public.matters m ON m.id = c.matter_id
    JOIN public.workspaces w ON w.id = m.workspace_id
    WHERE w.org_id IN (SELECT public.current_org_ids())
  ));

CREATE POLICY clause_tenant ON public.clauses
  FOR ALL USING (contract_version_id IN (
    SELECT cv.id FROM public.contract_versions cv
    JOIN public.contracts c ON c.id = cv.contract_id
    JOIN public.matters m ON m.id = c.matter_id
    JOIN public.workspaces w ON w.id = m.workspace_id
    WHERE w.org_id IN (SELECT public.current_org_ids())
  )) WITH CHECK (contract_version_id IN (
    SELECT cv.id FROM public.contract_versions cv
    JOIN public.contracts c ON c.id = cv.contract_id
    JOIN public.matters m ON m.id = c.matter_id
    JOIN public.workspaces w ON w.id = m.workspace_id
    WHERE w.org_id IN (SELECT public.current_org_ids())
  ));

CREATE POLICY clause_citation_tenant ON public.clause_citations
  FOR ALL USING (clause_id IN (
    SELECT cl.id FROM public.clauses cl
    JOIN public.contract_versions cv ON cv.id = cl.contract_version_id
    JOIN public.contracts c ON c.id = cv.contract_id
    JOIN public.matters m ON m.id = c.matter_id
    JOIN public.workspaces w ON w.id = m.workspace_id
    WHERE w.org_id IN (SELECT public.current_org_ids())
  )) WITH CHECK (clause_id IN (
    SELECT cl.id FROM public.clauses cl
    JOIN public.contract_versions cv ON cv.id = cl.contract_version_id
    JOIN public.contracts c ON c.id = cv.contract_id
    JOIN public.matters m ON m.id = c.matter_id
    JOIN public.workspaces w ON w.id = m.workspace_id
    WHERE w.org_id IN (SELECT public.current_org_ids())
  ));

CREATE POLICY event_impact_tenant ON public.event_impacts
  FOR ALL USING (contract_id IN (
    SELECT c.id FROM public.contracts c
    JOIN public.matters m ON m.id = c.matter_id
    JOIN public.workspaces w ON w.id = m.workspace_id
    WHERE w.org_id IN (SELECT public.current_org_ids())
  )) WITH CHECK (contract_id IN (
    SELECT c.id FROM public.contracts c
    JOIN public.matters m ON m.id = c.matter_id
    JOIN public.workspaces w ON w.id = m.workspace_id
    WHERE w.org_id IN (SELECT public.current_org_ids())
  ));

CREATE POLICY audit_log_tenant_read ON public.audit_log
  FOR SELECT USING (org_id IN (SELECT public.current_org_ids()));
-- audit_log writes happen via service role only (no insert policy).

-- Corpus tables: readable by any authenticated user; writes only via service role.
CREATE POLICY legal_sources_read ON public.legal_sources
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY legal_chunks_read ON public.legal_chunks
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY clause_templates_read ON public.clause_templates
  FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY template_overlays_read ON public.template_overlays
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY regulatory_events_read ON public.regulatory_events
  FOR SELECT TO authenticated USING (TRUE);
-- jobs: no policies; service-role only.

-- ============================================================
-- RETRIEVAL HELPER
-- ============================================================
-- Hybrid lookup: lexical (ts_rank) + vector (cosine), returns chunks scoped to
-- jurisdictions/sectors and temporally valid sources. Higher-level rerank done in app.
CREATE OR REPLACE FUNCTION public.retrieve_chunks(
  query_text       TEXT,
  query_embedding  vector(1024),
  jurisdictions    TEXT[],
  sectors          TEXT[],
  langs            TEXT[],
  k                INT DEFAULT 24
) RETURNS TABLE (
  chunk_id      UUID,
  source_id     UUID,
  source_key    TEXT,
  source_title  TEXT,
  jurisdiction  TEXT,
  locator       TEXT,
  body          TEXT,
  language      TEXT,
  lex_score     REAL,
  vec_score     REAL,
  hybrid_score  REAL
) LANGUAGE SQL STABLE AS $$
  WITH valid_sources AS (
    SELECT id, key, title, jurisdiction
      FROM public.legal_sources
     WHERE (cardinality(jurisdictions) = 0 OR jurisdiction = ANY(jurisdictions))
       AND (cardinality(sectors) = 0 OR sector IS NULL OR sector = ANY(sectors))
       AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
       AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
  ),
  lex AS (
    SELECT c.id AS chunk_id, c.source_id, c.locator, c.body, c.language,
           ts_rank(c.tsv, plainto_tsquery('simple', query_text)) AS lex_score
      FROM public.legal_chunks c
      JOIN valid_sources s ON s.id = c.source_id
     WHERE (cardinality(langs) = 0 OR c.language = ANY(langs))
       AND c.tsv @@ plainto_tsquery('simple', query_text)
     ORDER BY lex_score DESC
     LIMIT (k * 4)
  ),
  vec AS (
    SELECT c.id AS chunk_id, c.source_id, c.locator, c.body, c.language,
           1.0 - (c.embedding <=> query_embedding) AS vec_score
      FROM public.legal_chunks c
      JOIN valid_sources s ON s.id = c.source_id
     WHERE (cardinality(langs) = 0 OR c.language = ANY(langs))
       AND c.embedding IS NOT NULL
     ORDER BY c.embedding <=> query_embedding
     LIMIT (k * 4)
  ),
  fused AS (
    SELECT coalesce(l.chunk_id, v.chunk_id) AS chunk_id,
           coalesce(l.source_id, v.source_id) AS source_id,
           coalesce(l.locator, v.locator) AS locator,
           coalesce(l.body, v.body) AS body,
           coalesce(l.language, v.language) AS language,
           coalesce(l.lex_score, 0)::REAL AS lex_score,
           coalesce(v.vec_score, 0)::REAL AS vec_score,
           (coalesce(l.lex_score, 0) * 0.4 + coalesce(v.vec_score, 0) * 0.6)::REAL AS hybrid_score
      FROM lex l
      FULL OUTER JOIN vec v ON v.chunk_id = l.chunk_id
  )
  SELECT f.chunk_id, f.source_id, s.key AS source_key, s.title AS source_title,
         s.jurisdiction, f.locator, f.body, f.language,
         f.lex_score, f.vec_score, f.hybrid_score
    FROM fused f
    JOIN valid_sources s ON s.id = f.source_id
   ORDER BY f.hybrid_score DESC
   LIMIT k;
$$;

-- ============================================================
-- TIMESTAMP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
  LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['organizations','profiles','workspaces','matters','contracts','clause_templates','jobs'])
  LOOP
    EXECUTE format('CREATE TRIGGER tg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();', t, t);
  END LOOP;
END$$;
