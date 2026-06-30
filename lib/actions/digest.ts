'use server';

import type Anthropic from '@anthropic-ai/sdk';
import { requireMembership } from '@/lib/auth';
import { anthropic, MODELS } from '@/lib/ai';
import { listEvents, type RegulatoryEventRow } from '@/lib/events';
import { getWorkspaceJurisdictions } from '@/lib/search';
import { recordAudit, hashContent } from '@/lib/audit';

export interface DigestResponse {
  digest: string;
  generatedAt: string;
  eventCount: number;
}

const DIGEST_SYSTEM = `You are LEXAI's regulatory monitor.

Given a list of recent regulatory events affecting the user's workspace jurisdictions, write a tight executive briefing for a General Counsel. Output 4-7 sentences in markdown. Lead with the single most urgent item. Reference specific source titles and effective dates. End with a one-line "Action this week" if there is anything operational to do.

Format:
**What changed (last 60 days)**: <lead with most urgent — name source + effective date>. <2-4 sentences covering other material items, grouped by theme not by jurisdiction>.

**Action this week**: <one concrete next step, or "Monitoring only — no immediate action" if nothing pressing>.

Be specific. Avoid vague phrases like "various amendments". Cite source titles verbatim.`;

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

  const eventBlock = events.map((e) => formatEventForPrompt(e)).join('\n\n');

  const resp = await anthropic().messages.create({
    model: MODELS.chat,
    max_tokens: 700,
    system: [{ type: 'text', text: DIGEST_SYSTEM }],
    messages: [
      {
        role: 'user',
        content: `Workspace jurisdictions: ${jurisdictions.join(', ')}.\n\nRecent events (most recent first):\n\n${eventBlock}\n\nWrite the briefing now.`,
      },
    ],
  });

  const digest = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

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
