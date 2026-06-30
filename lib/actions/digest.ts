'use server';

import { requireMembership } from '@/lib/auth';
import { generateDigestSummary } from '@/lib/ai';
import { listEvents, type RegulatoryEventRow } from '@/lib/events';
import { getWorkspaceJurisdictions } from '@/lib/search';
import { recordAudit, hashContent } from '@/lib/audit';

export interface DigestResponse {
  digest: string;
  generatedAt: string;
  eventCount: number;
}

export async function generateDigestAction(): Promise<DigestResponse> {
  const ctx = await requireMembership();
  const jurisdictions = await getWorkspaceJurisdictions(ctx.orgId);
  const events = await listEvents({ jurisdictions, sinceDays: 60, limit: 30 });

  if (events.length === 0) {
    return {
      digest: '**What changed (last 60 days)**: No regulatory events recorded for your workspace jurisdictions. The monitor is active — alerts will appear here when published.\n\n**Action this week**: Monitoring only.',
      generatedAt: new Date().toISOString(),
      eventCount: 0,
    };
  }

  const eventBlock = events.map(formatEventForPrompt).join('\n\n');
  const digest = await generateDigestSummary(jurisdictions, eventBlock);

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'regulatory.digest',
    promptHash: hashContent(eventBlock),
    outputHash: hashContent(digest),
    metadata: { jurisdictions, eventCount: events.length },
  });

  return {
    digest,
    generatedAt: new Date().toISOString(),
    eventCount: events.length,
  };
}

function formatEventForPrompt(e: RegulatoryEventRow): string {
  const head = [
    `[${e.changeType.toUpperCase()}]`,
    e.source.title,
    `— detected ${e.detectedAt.slice(0, 10)}`,
    e.effectiveAt ? `effective ${e.effectiveAt}` : '(effective date not set)',
    `severity: ${e.severity}`,
  ].join(' ');
  const action = e.action ? `\nAction note: ${e.action}` : '';
  return `${head}\n${e.summary}${action}`;
}
