/**
 * Row types mirroring supabase/migrations/001_lexai_schema.sql.
 *
 * Keep in sync with the SQL. When adding columns, update both this file and the
 * migration. Prefer extending via Pick<>/Omit<> in feature code rather than
 * redeclaring shapes here.
 */

import type { SectorKey } from '@/lib/taxonomy';

export type UUID = string;
export type ISODate = string;
export type Role = 'owner' | 'counsel' | 'reviewer' | 'viewer';
export type BillingPlan = 'trial' | 'starter' | 'growth' | 'enterprise' | 'custom';
export type RiskLevel = 'ok' | 'attention' | 'high' | 'blocking';
export type Confidence = 'high' | 'medium' | 'low';
export type ContractStatus = 'draft' | 'generating' | 'review' | 'approved' | 'exported' | 'archived';
export type MatterStatus = 'active' | 'closed' | 'archived';
export type GeneratedBy = 'ai' | 'user' | 'review_merge';
export type SourceType = 'statute' | 'regulation' | 'rulebook' | 'case' | 'model_contract' | 'standard' | 'guidance';
export type LicenseClass = 'public' | 'restricted' | 'meta_only';
export type ChangeType = 'new' | 'amended' | 'superseded' | 'withdrawn';
export type Severity = 'info' | 'attention' | 'high' | 'blocking';
export type JobStatus = 'pending' | 'running' | 'done' | 'failed' | 'dead';

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  billing_plan: BillingPlan;
  settings: Record<string, unknown>;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface Profile {
  id: UUID;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface Membership {
  org_id: UUID;
  user_id: UUID;
  role: Role;
  created_at: ISODate;
}

export interface Workspace {
  id: UUID;
  org_id: UUID;
  name: string;
  default_jurisdiction: string | null;
  default_language: string;
  enabled_jurisdictions: string[];
  enabled_sectors: SectorKey[];
  created_at: ISODate;
  updated_at: ISODate;
}

export interface MatterParty {
  name: string;
  role: 'company' | 'counterparty' | 'guarantor' | 'lender' | 'government' | 'other';
  jurisdiction?: string;
}

export interface Matter {
  id: UUID;
  workspace_id: UUID;
  name: string;
  parties: MatterParty[];
  jurisdictions: string[];
  sectors: SectorKey[];
  is_sharia: boolean;
  status: MatterStatus;
  created_by: UUID | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface Contract {
  id: UUID;
  matter_id: UUID;
  title: string;
  language: string;
  jurisdictions: string[];
  contract_type: string | null;
  source_file_path: string | null;
  current_version_id: UUID | null;
  status: ContractStatus;
  created_by: UUID | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface ContractVersion {
  id: UUID;
  contract_id: UUID;
  version_no: number;
  body_md: string;
  body_docx_path: string | null;
  generated_by: GeneratedBy;
  prompt_hash: string | null;
  retrieval_hash: string | null;
  model_id: string | null;
  created_by: UUID | null;
  created_at: ISODate;
}

export interface Clause {
  id: UUID;
  contract_version_id: UUID;
  ordinal: number;
  clause_type: string;
  heading: string | null;
  body_md: string;
  jurisdiction: string | null;
  language: string;
  risk_level: RiskLevel | null;
  confidence: Confidence;
  rationale: string | null;
}

export interface LegalSource {
  id: UUID;
  key: string;
  jurisdiction: string;
  sector: SectorKey | null;
  source_type: SourceType;
  title: string;
  publisher: string | null;
  official_url: string | null;
  language: string;
  effective_from: ISODate | null;
  effective_to: ISODate | null;
  superseded_by: UUID | null;
  raw_storage_path: string | null;
  sha256: string | null;
  license_class: LicenseClass;
  metadata: Record<string, unknown>;
  ingested_at: ISODate | null;
  created_at: ISODate;
}

export interface LegalChunk {
  id: UUID;
  source_id: UUID;
  ordinal: number;
  heading_path: string[];
  locator: string | null;
  body: string;
  token_count: number;
  language: string;
  embedding: number[] | null;
  created_at: ISODate;
}

export interface ClauseCitation {
  id: UUID;
  clause_id: UUID;
  source_id: UUID;
  chunk_id: UUID | null;
  locator: string | null;
  quote: string | null;
  created_at: ISODate;
}

export interface ClauseTemplate {
  id: UUID;
  key: string;
  name: string;
  sector: SectorKey | null;
  contract_type: string;
  jurisdiction_scope: string[];
  default_language: string;
  skeleton_md: string;
  required_facts: TemplateFact[];
  optional_facts: TemplateFact[];
  license_class: LicenseClass;
  version: number;
  is_active: boolean;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface TemplateFact {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'jurisdiction' | 'party';
  options?: { value: string; label: string }[];
  helpText?: string;
}

export interface TemplateOverlay {
  id: UUID;
  template_id: UUID;
  jurisdiction: string;
  overlay_md: string;
  citations: { source_key: string; locator?: string }[];
  language: string;
  created_at: ISODate;
}

export interface RegulatoryEvent {
  id: UUID;
  source_id: UUID;
  change_type: ChangeType;
  summary: string;
  diff: Record<string, unknown> | null;
  detected_at: ISODate;
  effective_at: ISODate | null;
}

export interface EventImpact {
  id: UUID;
  event_id: UUID;
  contract_id: UUID;
  severity: Severity;
  suggested_action: string | null;
  acknowledged_at: ISODate | null;
  acknowledged_by: UUID | null;
  created_at: ISODate;
}

export interface AuditLogEntry {
  id: UUID;
  org_id: UUID | null;
  actor_id: UUID | null;
  action: string;
  target_type: string | null;
  target_id: UUID | null;
  prompt_hash: string | null;
  retrieval_hash: string | null;
  output_hash: string | null;
  metadata: Record<string, unknown>;
  prev_hash: string | null;
  entry_hash: string;
  created_at: ISODate;
}

export interface JobRow {
  id: UUID;
  kind: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  run_at: ISODate;
  attempts: number;
  last_error: string | null;
  locked_by: string | null;
  locked_at: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate;
}
