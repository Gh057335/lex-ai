import { requireMembership } from '@/lib/auth';
import { listEvents, computeStats } from '@/lib/events';
import { getWorkspaceJurisdictions } from '@/lib/search';
import { AlertsClient } from './AlertsClient';

export default async function AlertsPage() {
  const ctx = await requireMembership();
  const jurisdictions = await getWorkspaceJurisdictions(ctx.orgId);
  const events = await listEvents({ jurisdictions, sinceDays: 90, limit: 100 });
  const stats = computeStats(events);

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 py-6 border-b" style={{ borderColor: '#ececec' }}>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
          Regulatory alerts
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          Watched: {jurisdictions.join(' · ') || '—'}. Surfaces statute and regulator activity
          in the workspace's jurisdictions over the last 90 days.
        </p>
      </header>
      <AlertsClient events={events} stats={stats} jurisdictions={jurisdictions} />
    </div>
  );
}
