import { requireMembership } from '@/lib/auth';
import { getWorkspaceJurisdictions } from '@/lib/search';
import { createAdminClient } from '@/lib/supabase';
import { AssistantClient } from './AssistantClient';

export default async function AssistantPage() {
  const ctx = await requireMembership();
  const jurisdictions = await getWorkspaceJurisdictions(ctx.orgId);

  const admin = createAdminClient();
  const { count } = await admin
    .from('legal_chunks')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 py-6 border-b" style={{ borderColor: '#ececec' }}>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
          AI Assistant
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          Ask anything about the corpus ({count ?? 0} passages across {jurisdictions.length}
          jurisdictions: {jurisdictions.join(', ') || '—'}). Every answer cites the source articles.
        </p>
      </header>
      <AssistantClient jurisdictions={jurisdictions} />
    </div>
  );
}
