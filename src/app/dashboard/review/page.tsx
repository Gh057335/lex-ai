import { requireMembership } from '@/lib/auth';
import { getWorkspaceJurisdictions } from '@/lib/search';
import { ReviewClient } from './ReviewClient';

export default async function ReviewPage() {
  const ctx = await requireMembership();
  const jurisdictions = await getWorkspaceJurisdictions(ctx.orgId);

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 py-6 border-b" style={{ borderColor: '#ececec' }}>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
          Document review
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          Drop a contract PDF. LEXAI extracts every clause, flags risk against
          {jurisdictions.join(' + ') || 'your corpus'}, and proposes redlines anchored to the source articles.
        </p>
      </header>
      <ReviewClient />
    </div>
  );
}
