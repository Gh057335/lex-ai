/**
 * LEXAI jurisdiction and sector taxonomy.
 *
 * Jurisdiction keys are stable identifiers used throughout the codebase, the database
 * (legal_sources.jurisdiction, matters.jurisdictions[], etc.) and the AI prompts.
 * Format: ISO-3166-1 alpha-2 country code, optionally followed by ":subdivision".
 *
 * Cross-cutting bodies (OHADA, AfCFTA, EU, UN) use mnemonic keys.
 */

export type JurisdictionRegion =
  | 'africa_cross'
  | 'africa_country'
  | 'gcc_federal'
  | 'gcc_zone'
  | 'cross_cutting';

export interface Jurisdiction {
  key: string;
  label: string;
  region: JurisdictionRegion;
  languages: string[];
  legal_system: 'civil' | 'common' | 'mixed' | 'sharia_inflected' | 'supranational';
}

export const JURISDICTIONS: Jurisdiction[] = [
  // --- Africa cross-cutting
  { key: 'ohada',     label: 'OHADA',  region: 'africa_cross', languages: ['fr','en'], legal_system: 'supranational' },
  { key: 'afcfta',    label: 'AfCFTA', region: 'africa_cross', languages: ['en','fr','pt','ar'], legal_system: 'supranational' },

  // --- Africa tier-1 countries (full coverage at MVP)
  { key: 'ng', label: '🇳🇬 Nigeria',      region: 'africa_country', languages: ['en'],    legal_system: 'common' },
  { key: 'za', label: '🇿🇦 South Africa', region: 'africa_country', languages: ['en'],    legal_system: 'mixed' },
  { key: 'ke', label: '🇰🇪 Kenya',        region: 'africa_country', languages: ['en'],    legal_system: 'common' },
  { key: 'eg', label: '🇪🇬 Egypt',        region: 'africa_country', languages: ['ar','en'], legal_system: 'civil' },
  { key: 'ma', label: '🇲🇦 Morocco',      region: 'africa_country', languages: ['fr','ar'], legal_system: 'civil' },
  { key: 'ci', label: '🇨🇮 Côte d\'Ivoire', region: 'africa_country', languages: ['fr'],   legal_system: 'civil' },
  { key: 'sn', label: '🇸🇳 Senegal',      region: 'africa_country', languages: ['fr'],    legal_system: 'civil' },
  { key: 'cm', label: '🇨🇲 Cameroon',     region: 'africa_country', languages: ['fr','en'], legal_system: 'mixed' },

  // --- Africa tier-2 (regulator-monitoring + v1.1 templates)
  { key: 'gh', label: '🇬🇭 Ghana',     region: 'africa_country', languages: ['en'],    legal_system: 'common' },
  { key: 'rw', label: '🇷🇼 Rwanda',    region: 'africa_country', languages: ['en','fr'], legal_system: 'mixed' },
  { key: 'tz', label: '🇹🇿 Tanzania',  region: 'africa_country', languages: ['en','sw'], legal_system: 'common' },
  { key: 'ug', label: '🇺🇬 Uganda',    region: 'africa_country', languages: ['en'],    legal_system: 'common' },
  { key: 'et', label: '🇪🇹 Ethiopia',  region: 'africa_country', languages: ['en','am'], legal_system: 'civil' },
  { key: 'ao', label: '🇦🇴 Angola',    region: 'africa_country', languages: ['pt'],    legal_system: 'civil' },
  { key: 'mz', label: '🇲🇿 Mozambique', region: 'africa_country', languages: ['pt'],   legal_system: 'civil' },
  { key: 'cd', label: '🇨🇩 DRC',       region: 'africa_country', languages: ['fr'],    legal_system: 'civil' },
  { key: 'zm', label: '🇿🇲 Zambia',    region: 'africa_country', languages: ['en'],    legal_system: 'common' },
  { key: 'bw', label: '🇧🇼 Botswana',  region: 'africa_country', languages: ['en'],    legal_system: 'mixed' },
  { key: 'na', label: '🇳🇦 Namibia',   region: 'africa_country', languages: ['en'],    legal_system: 'mixed' },
  { key: 'tn', label: '🇹🇳 Tunisia',   region: 'africa_country', languages: ['ar','fr'], legal_system: 'civil' },
  { key: 'dz', label: '🇩🇿 Algeria',   region: 'africa_country', languages: ['ar','fr'], legal_system: 'civil' },

  // --- GCC federal
  { key: 'ae',      label: '🇦🇪 UAE Federal',  region: 'gcc_federal', languages: ['ar','en'], legal_system: 'civil' },
  { key: 'sa',      label: '🇸🇦 Saudi Arabia', region: 'gcc_federal', languages: ['ar','en'], legal_system: 'sharia_inflected' },
  { key: 'qa',      label: '🇶🇦 Qatar',        region: 'gcc_federal', languages: ['ar','en'], legal_system: 'mixed' },
  { key: 'bh',      label: '🇧🇭 Bahrain',      region: 'gcc_federal', languages: ['ar','en'], legal_system: 'mixed' },
  { key: 'kw',      label: '🇰🇼 Kuwait',       region: 'gcc_federal', languages: ['ar','en'], legal_system: 'civil' },
  { key: 'om',      label: '🇴🇲 Oman',         region: 'gcc_federal', languages: ['ar','en'], legal_system: 'mixed' },

  // --- GCC free zones / financial centres (common-law islands)
  { key: 'ae:difc', label: 'DIFC (Dubai)',     region: 'gcc_zone', languages: ['en'], legal_system: 'common' },
  { key: 'ae:adgm', label: 'ADGM (Abu Dhabi)', region: 'gcc_zone', languages: ['en'], legal_system: 'common' },
  { key: 'ae:dmcc', label: 'DMCC',             region: 'gcc_zone', languages: ['en'], legal_system: 'common' },
  { key: 'ae:jafza', label: 'JAFZA',           region: 'gcc_zone', languages: ['en'], legal_system: 'common' },
  { key: 'ae:rakez', label: 'RAKEZ',           region: 'gcc_zone', languages: ['en'], legal_system: 'common' },
  { key: 'sa:neom', label: 'NEOM',             region: 'gcc_zone', languages: ['en','ar'], legal_system: 'common' },
  { key: 'sa:kaec', label: 'KAEC',             region: 'gcc_zone', languages: ['en','ar'], legal_system: 'mixed' },
  { key: 'qa:qfc',  label: 'QFC',              region: 'gcc_zone', languages: ['en'], legal_system: 'common' },
  { key: 'ae:vara', label: 'VARA (Dubai VA)',  region: 'gcc_zone', languages: ['en'], legal_system: 'common' },
  { key: 'ae:fsra', label: 'ADGM FSRA',        region: 'gcc_zone', languages: ['en'], legal_system: 'common' },

  // --- Cross-cutting frameworks (used as citation targets, not workspace defaults)
  { key: 'aaoifi', label: 'AAOIFI (Sharia)', region: 'cross_cutting', languages: ['en','ar'], legal_system: 'sharia_inflected' },
  { key: 'fatf',   label: 'FATF',            region: 'cross_cutting', languages: ['en'],     legal_system: 'supranational' },
  { key: 'fidic',  label: 'FIDIC',           region: 'cross_cutting', languages: ['en'],     legal_system: 'supranational' },
  { key: 'icc',    label: 'ICC Arbitration', region: 'cross_cutting', languages: ['en','fr'], legal_system: 'supranational' },
  { key: 'uncitral', label: 'UNCITRAL',      region: 'cross_cutting', languages: ['en'],    legal_system: 'supranational' },
  { key: 'verra',  label: 'Verra VCS',       region: 'cross_cutting', languages: ['en'],    legal_system: 'supranational' },
  { key: 'goldstd', label: 'Gold Standard',  region: 'cross_cutting', languages: ['en'],    legal_system: 'supranational' },
];

export const JURISDICTION_BY_KEY = new Map(JURISDICTIONS.map(j => [j.key, j]));

export function isValidJurisdiction(key: string): boolean {
  return JURISDICTION_BY_KEY.has(key);
}

export type SectorKey =
  | 'corporate'
  | 'employment'
  | 'data_protection'
  | 'commercial'
  | 'oil_gas'
  | 'renewables'
  | 'carbon_markets'
  | 'mining'
  | 'crypto'
  | 'fintech'
  | 'islamic_finance'
  | 'arbitration'
  | 'sanctions_aml';

export interface Sector {
  key: SectorKey;
  label: string;
  description: string;
}

export const SECTORS: Sector[] = [
  { key: 'corporate',       label: 'Corporate',        description: 'Companies, governance, M&A, SPVs.' },
  { key: 'employment',      label: 'Employment',       description: 'Hiring, termination, benefits, expat secondment.' },
  { key: 'data_protection', label: 'Data Protection',  description: 'GDPR, PDPL, NDPR, POPIA, DIFC DPL, ADGM DPR.' },
  { key: 'commercial',      label: 'Commercial',       description: 'Sales, distribution, agency, supply.' },
  { key: 'oil_gas',         label: 'Oil & Gas',        description: 'PSAs, JOAs, LNG SPAs, FIDIC, REACH, GHS.' },
  { key: 'renewables',      label: 'Renewable Energy', description: 'PPAs, EPC, hydrogen, grid connection.' },
  { key: 'carbon_markets',  label: 'Carbon Markets',   description: 'Verra, Gold Standard, Article 6, ICVCM.' },
  { key: 'mining',          label: 'Mining & Resources', description: 'Mining codes, royalties, IFC PS, Equator Principles.' },
  { key: 'crypto',          label: 'Crypto / Web3',    description: 'VARA, FSRA, CBB, MAS, FATF Travel Rule.' },
  { key: 'fintech',         label: 'Fintech',          description: 'Payment licensing, open banking, KYC tiers.' },
  { key: 'islamic_finance', label: 'Islamic Finance',  description: 'Sharia compliance, sukuk, takaful, AAOIFI.' },
  { key: 'arbitration',     label: 'Arbitration',      description: 'ICC, LCIA, DIAC, ADGM, NY Convention.' },
  { key: 'sanctions_aml',   label: 'Sanctions & AML',  description: 'OFAC, EU, UK OFSI, UN, FATF, FCPA, Bribery Act.' },
];

export const SECTOR_BY_KEY = new Map(SECTORS.map(s => [s.key, s]));

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar', 'pt', 'sw', 'am'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export const RTL_LANGUAGES: LanguageCode[] = ['ar'];

export function isRTL(lang: string): boolean {
  return (RTL_LANGUAGES as string[]).includes(lang);
}
