import Link from 'next/link';
import { Sparkles, FileText, ScanLine, Newspaper, Globe2, ArrowUpRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { requireMembership } from '@/lib/auth';
import { getDemoContext } from '@/lib/demo';

const SERVICES = [
  { href: '/dashboard/assistant',  icon: Sparkles,  title: 'AI Assistant',     desc: 'Ask anything about your matters, statutes or contracts. Citation-grounded answers.' },
  { href: '/dashboard/contracts',  icon: FileText,  title: 'Draft a document', desc: 'Generate contracts, NDAs, opinions and notices from jurisdiction-aware templates.' },
  { href: '/dashboard/review',     icon: ScanLine,  title: 'Scan & review',    desc: 'Upload a PDF or DOCX and get clause-level risks, redlines and counter-proposals.' },
  { href: '/dashboard/alerts',     icon: Newspaper, title: 'Regulatory news',  desc: 'Daily digest of statutes, regulators and case law across your active markets.' },
  { href: '/dashboard/workspaces', icon: Globe2,    title: 'Markets',          desc: 'Switch between Africa, GCC and sector verticals — Oil & Gas, Renewables, Mining, Crypto.' },
];

const SERIF = 'var(--font-fraunces), Georgia, serif';
const MONO = 'var(--font-geist-mono), ui-monospace, monospace';

export default async function DashboardHome() {
  const ctx = await requireMembership();
  const demo = await getDemoContext();
  const supabase = await createClient();

  const [{ count: matterCount }, { count: contractCount }, { data: recentContracts }] = await Promise.all([
    supabase.from('matters').select('*', { count: 'exact', head: true }).eq('org_id', ctx.orgId),
    supabase.from('contracts').select('*', { count: 'exact', head: true }),
    supabase.from('contracts').select('id, title, updated_at').order('updated_at', { ascending: false }).limit(4),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <div className="mb-10">
        <div className="text-[11px] uppercase mb-3" style={{ color: '#C0673E', fontFamily: MONO, letterSpacing: '0.22em' }}>
          Workspace · {demo.orgName}
        </div>
        <h1 className="text-[40px] leading-[1.05]" style={{
          color: '#141007', fontFamily: SERIF, fontWeight: 400, letterSpacing: '-0.025em',
          fontVariationSettings: "'opsz' 72, 'SOFT' 30",
        }}>
          Good to see you.
        </h1>
        <p className="text-[15px] mt-3" style={{ color: '#6E6346' }}>What would you like to work on today?</p>
      </div>

      <Link
        href="/dashboard/assistant"
        className="block mb-4 rounded-xl px-5 py-4 transition-all hover:translate-y-[-1px]"
        style={{ backgroundColor: '#141007', color: '#FFFFFF' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: '#C0673E' }}>
              <Sparkles className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[14px] font-medium">Ask the assistant</div>
              <div className="text-[12.5px] mt-0.5" style={{ color: '#B5A988' }}>
                e.g. &ldquo;Summarise our exposure under the Nigerian PIA 2021&rdquo;
              </div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
        {SERVICES.slice(1).map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href} href={href}
            className="group block rounded-xl px-5 py-4 transition-all hover:translate-y-[-1px]"
            style={{ border: '1px solid #ECEAE3', backgroundColor: '#FFFFFF' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#F2DDC8]" style={{ backgroundColor: '#F5F2EC' }}>
                <Icon className="w-4 h-4 transition-colors group-hover:text-[#C0673E]" strokeWidth={1.75} style={{ color: '#141007' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-medium" style={{ color: '#141007' }}>{title}</div>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#C0673E' }} />
                </div>
                <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: '#6E6346' }}>{desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-xl p-6" style={{ border: '1px solid #ECEAE3', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] uppercase" style={{ color: '#908569', fontFamily: MONO, letterSpacing: '0.2em' }}>Recent documents</div>
            <Link href="/dashboard/contracts" className="text-[12px] transition-colors hover:text-[#C0673E]" style={{ color: '#6E6346' }}>View all →</Link>
          </div>
          {recentContracts && recentContracts.length > 0 ? (
            <ul className="divide-y" style={{ borderColor: '#F5F2EC' }}>
              {recentContracts.map((c) => (
                <li key={c.id}>
                  <Link href={`/dashboard/contracts/${c.id}`} className="flex items-center justify-between py-2.5 text-[13.5px] transition-colors hover:text-[#C0673E]" style={{ color: '#2A2418' }}>
                    <span className="truncate">{c.title}</span>
                    <span className="text-[11px] shrink-0 ml-3" style={{ color: '#908569', fontFamily: MONO, letterSpacing: '0.06em' }}>
                      {new Date(c.updated_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] py-4" style={{ color: '#908569' }}>No documents yet. Start with the Draft a document service above.</p>
          )}
        </div>

        <div className="rounded-xl p-6" style={{ border: '1px solid #ECEAE3', backgroundColor: '#F5F2EC' }}>
          <div className="text-[11px] uppercase mb-4" style={{ color: '#908569', fontFamily: MONO, letterSpacing: '0.2em' }}>At a glance</div>
          <dl className="space-y-4">
            <div className="flex items-baseline justify-between">
              <dt className="text-[12.5px]" style={{ color: '#6E6346' }}>Matters</dt>
              <dd className="text-[26px] tabular-nums" style={{
                color: '#141007', fontFamily: SERIF, fontWeight: 400, letterSpacing: '-0.02em',
                fontVariationSettings: "'opsz' 32, 'SOFT' 30",
              }}>{matterCount ?? 0}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-[12.5px]" style={{ color: '#6E6346' }}>Documents</dt>
              <dd className="text-[26px] tabular-nums" style={{
                color: '#141007', fontFamily: SERIF, fontWeight: 400, letterSpacing: '-0.02em',
                fontVariationSettings: "'opsz' 32, 'SOFT' 30",
              }}>{contractCount ?? 0}</dd>
            </div>
            <div className="flex items-baseline justify-between pt-3" style={{ borderTop: '1px solid #ECEAE3' }}>
              <dt className="text-[12px]" style={{ color: '#6E6346' }}>Edition</dt>
              <dd className="text-[12px]" style={{ color: '#141007', fontWeight: 500 }}>{demo.orgName}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
