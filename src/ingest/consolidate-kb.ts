#!/usr/bin/env bun
/**
 * Walks docs/knowledge-base/ and emits a single consolidated markdown master file.
 * Order is explicit (region → country → sector → cross-cutting). Adds TOC + front matter.
 *
 * Usage:
 *   bun src/ingest/consolidate-kb.ts --out=/Users/emanuele/Desktop/LEXAI-Norme-Master.md
 */
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

type SectionFile = { path: string; section: string; subSection: string };

const ORDER: SectionFile[] = [
  // 1. AFRICA
  { path: "africa/ohada.md", section: "Africa", subSection: "OHADA Uniform Acts" },
  { path: "africa/afcfta.md", section: "Africa", subSection: "AfCFTA + AU Frameworks" },
  { path: "africa/nigeria.md", section: "Africa", subSection: "Nigeria" },
  { path: "africa/south-africa.md", section: "Africa", subSection: "South Africa" },
  { path: "africa/kenya.md", section: "Africa", subSection: "Kenya" },
  { path: "africa/egypt.md", section: "Africa", subSection: "Egypt" },
  { path: "africa/morocco.md", section: "Africa", subSection: "Morocco" },
  { path: "africa/francophone-tier1.md", section: "Africa", subSection: "Côte d'Ivoire / Senegal / Cameroon" },
  { path: "africa/tier-2.md", section: "Africa", subSection: "Tier-2 monitoring (13 jurisdictions)" },
  { path: "africa/eac.md", section: "Africa", subSection: "EAC — East African Community" },

  // 2. GCC + MIDDLE EAST
  { path: "gcc/uae-federal.md", section: "GCC & Middle East", subSection: "UAE Federal" },
  { path: "gcc/uae-difc.md", section: "GCC & Middle East", subSection: "UAE — DIFC" },
  { path: "gcc/uae-adgm.md", section: "GCC & Middle East", subSection: "UAE — ADGM" },
  { path: "gcc/uae-free-zones.md", section: "GCC & Middle East", subSection: "UAE — Free Zones (DMCC, JAFZA, RAKEZ, NEOM, KAEC)" },
  { path: "gcc/uae-vara.md", section: "GCC & Middle East", subSection: "UAE — VARA Dubai" },
  { path: "gcc/saudi-arabia.md", section: "GCC & Middle East", subSection: "Saudi Arabia" },
  { path: "gcc/qatar.md", section: "GCC & Middle East", subSection: "Qatar (+ QFC)" },
  { path: "gcc/bahrain.md", section: "GCC & Middle East", subSection: "Bahrain (+ CBB Crypto Module)" },
  { path: "gcc/kuwait-oman.md", section: "GCC & Middle East", subSection: "Kuwait + Oman" },
  { path: "gcc/islamic-finance.md", section: "GCC & Middle East", subSection: "Islamic Finance — AAOIFI + IFSB" },

  // 3. ASIA
  { path: "asia/india.md", section: "Asia", subSection: "India" },
  { path: "asia/indonesia.md", section: "Asia", subSection: "Indonesia" },
  { path: "asia/vietnam.md", section: "Asia", subSection: "Vietnam" },
  { path: "asia/singapore.md", section: "Asia", subSection: "Singapore" },
  { path: "asia/hong-kong.md", section: "Asia", subSection: "Hong Kong SAR" },

  // 4. SECTORS
  { path: "sectors/oil-gas.md", section: "Sectors", subSection: "Oil & Gas / Petrochemical" },
  { path: "sectors/renewables-carbon.md", section: "Sectors", subSection: "Renewables + Carbon + Hydrogen" },
  { path: "sectors/mining.md", section: "Sectors", subSection: "Mining + Sovereign Resources" },
  { path: "sectors/crypto-web3-fintech.md", section: "Sectors", subSection: "Crypto / Web3 / Fintech — regulatory framework" },
  { path: "sectors/crypto-templates.md", section: "Sectors", subSection: "Crypto — contract templates + legal wrappers" },
  { path: "sectors/sovereign-concessions.md", section: "Sectors", subSection: "Sovereign Concessions (agri / forestry / water / port / diamond / rare-earth)" },
  { path: "sectors/mobile-money.md", section: "Sectors", subSection: "Mobile Money + Africa Fintech Operators" },

  // 5. CROSS-CUTTING
  { path: "cross-cutting/data-protection-matrix.md", section: "Cross-cutting", subSection: "Data Protection Comparative Matrix" },
  { path: "cross-cutting/sanctions.md", section: "Cross-cutting", subSection: "Sanctions (OFAC / EU / UK / UN)" },
  { path: "cross-cutting/anti-corruption.md", section: "Cross-cutting", subSection: "Anti-Corruption (FCPA / UKBA / OECD / UNCAC)" },
  { path: "cross-cutting/arbitration.md", section: "Cross-cutting", subSection: "International Arbitration" },
  { path: "cross-cutting/esg-reporting.md", section: "Cross-cutting", subSection: "ESG Reporting Frameworks (GRI / SASB / TCFD / ISSB / CSRD / GHG Protocol / UNGP / CS3D)" },
];

const FRONTMATTER = `# LEXAI — Master Knowledge Base of Existing Norms

> **Scope.** Single consolidated index of every legal norm cataloged for the markets named in \`LEXAI_Business_Plan_Completo.html\`: Africa (OHADA + 9 tier-1 + 13 tier-2 jurisdictions), GCC & Middle East (UAE Federal/DIFC/ADGM/free zones/VARA + Saudi Arabia + Qatar + Bahrain + Kuwait + Oman + Islamic finance), Asia (India + Indonesia + Vietnam), plus sector-specific stacks (Oil & Gas, Renewables, Mining, Crypto/Web3/Fintech) and cross-cutting regimes (Data Protection comparative matrix, Sanctions, Anti-Corruption, Arbitration).

> **Type of artifact.** Catalog/scaffold, not legal text. Every entry is a source card with: citation key, official title, type, jurisdiction, sector, effective dates, publisher, official URL, license class, key parts (chapters / articles / books to retrieve), cross-references. Designed to seed \`legal_sources\` table when the LEXAI \`src/ingest/\` pipeline runs.

> **Reliability disclaimer.** This catalog was authored from pretraining + the build prompt, not from primary-source ingestion. First verification pass (run 4 of \`verify-kb\`) confirmed **16/231 cards (≈7%) against external sources**, 23 partial, 1 mismatch caught (\`uk/ofsi\` was withdrawn 28-Jan-2026 — needs replacement). Specific article numbers, day-level effective dates, and pending-law status estimates carry **error rates of 25–40%** and must be cross-checked before any drafting use. Run \`bun run verify-kb\` to refresh per-card confidence; see \`docs/knowledge-base/.verification/report-latest.md\`.

> **License class legend.**
> - \`public_domain\` — official gazette text, free to ingest verbatim.
> - \`gov_open\` — government publication, redistribution allowed with attribution.
> - \`restricted_reference\` — copyrighted but referenceable. Store as clause-pattern templates only (AAOIFI / IFSB / FIDIC / AIPN / ISDA).
> - \`paywalled_meta_only\` — citation pointer only, no text capture.

> **Status legend.** \`in_force\` (current) · \`amended\` (current with recent amendments to track) · \`superseded\` (kept for legacy contracts) · \`draft_or_pending\` (not yet in force; do not retrieve for drafting).
`;

async function main() {
  const { values } = parseArgs({
    options: {
      "kb-dir": { type: "string", default: "docs/knowledge-base" },
      out: { type: "string", default: "/Users/emanuele/Desktop/LEXAI-Norme-Master.md" },
    },
  });
  const kbDir = resolve(process.cwd(), values["kb-dir"] as string);
  const outPath = resolve(values.out as string);

  const fileBlocks: { section: string; subSection: string; body: string }[] = [];
  for (const it of ORDER) {
    const full = resolve(kbDir, it.path);
    const exists = await Bun.file(full).exists();
    if (!exists) {
      console.warn(`  ⚠ missing: ${it.path} — skipped`);
      continue;
    }
    const raw = await Bun.file(full).text();
    fileBlocks.push({ section: it.section, subSection: it.subSection, body: stripTopH1(raw) });
  }

  // Group by section
  const sections = new Map<string, { subSection: string; body: string }[]>();
  for (const b of fileBlocks) {
    if (!sections.has(b.section)) sections.set(b.section, []);
    sections.get(b.section)!.push({ subSection: b.subSection, body: b.body });
  }

  // Build TOC
  const toc: string[] = ["", "## Table of Contents", ""];
  let i = 1;
  for (const [section, subs] of sections) {
    toc.push(`${i}. **${section}**`);
    let j = 0;
    for (const s of subs) {
      const anchor = anchorize(`${i}-${++j}-${s.subSection}`);
      toc.push(`   - [${s.subSection}](#${anchor})`);
    }
    i++;
  }
  toc.push("");

  // Build body
  const out: string[] = [FRONTMATTER, ...toc, "---", ""];
  i = 1;
  for (const [section, subs] of sections) {
    out.push(`# ${i}. ${section}`);
    out.push("");
    let j = 0;
    for (const s of subs) {
      j++;
      const anchor = anchorize(`${i}-${j}-${s.subSection}`);
      out.push(`<a id="${anchor}"></a>`);
      out.push("");
      out.push(`## ${i}.${j} ${s.subSection}`);
      out.push("");
      out.push(demoteHeadings(s.body));
      out.push("");
      out.push("---");
      out.push("");
    }
    i++;
  }

  // Footer
  out.push("");
  out.push("---");
  out.push("");
  out.push(`*Generated: ${new Date().toISOString()} · ${fileBlocks.length} source files consolidated · run \`bun src/ingest/consolidate-kb.ts\` to regenerate.*`);

  await mkdir(dirname(outPath), { recursive: true });
  const content = out.join("\n");
  await Bun.write(outPath, content);

  const cards = (content.match(/^#{4,6}\s+`?[a-z][a-z0-9/_.-]+/gm) || []).length;
  console.log(`✓ wrote ${outPath}`);
  console.log(`  ${content.split("\n").length} lines, ${(content.length / 1024).toFixed(1)} KB`);
  console.log(`  ${fileBlocks.length} files consolidated, ${cards} cards reachable`);
}

function stripTopH1(raw: string): string {
  return raw.replace(/^#\s.+\n+/, "");
}

function demoteHeadings(body: string): string {
  return body
    .split("\n")
    .map((line) => {
      if (/^#{1,6}\s/.test(line)) {
        const m = line.match(/^(#+)(\s.+)$/)!;
        return "#".repeat(Math.min(m[1].length + 2, 6)) + m[2];
      }
      return line;
    })
    .join("\n");
}

function anchorize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
