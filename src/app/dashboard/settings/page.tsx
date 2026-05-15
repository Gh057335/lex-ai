import { requireMembership } from '@/lib/auth';
import { createClient } from '@/lib/supabase';

export default async function SettingsPage() {
  const ctx = await requireMembership();
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, billing_plan, created_at')
    .eq('id', ctx.orgId)
    .maybeSingle();

  const { data: members } = await supabase
    .from('memberships')
    .select('role, profiles(email, full_name)')
    .eq('org_id', ctx.orgId);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
        Settings
      </h1>

      <section className="mb-10">
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: '#111111' }}>Organisation</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt style={{ color: '#6b7280' }}>Name</dt><dd>{org?.name}</dd>
          <dt style={{ color: '#6b7280' }}>Slug</dt><dd className="font-mono">{org?.slug}</dd>
          <dt style={{ color: '#6b7280' }}>Plan</dt><dd>{org?.billing_plan}</dd>
          <dt style={{ color: '#6b7280' }}>Your role</dt><dd>{ctx.role}</dd>
        </dl>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: '#111111' }}>Team</h2>
        <div className="grid gap-2">
          {(members ?? []).map((m, i) => {
            const p = m.profiles as unknown as { email: string; full_name: string | null } | null;
            return (
              <div
                key={i}
                className="p-3 rounded border flex items-center justify-between text-sm"
                style={{ borderColor: '#ececec' }}
              >
                <div>
                  <div>{p?.full_name ?? p?.email}</div>
                  <div className="text-xs" style={{ color: '#6b7280' }}>{p?.email}</div>
                </div>
                <span style={{ color: '#111111' }}>{m.role}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
