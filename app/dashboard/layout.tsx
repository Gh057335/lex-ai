import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { getDemoContext } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getDemoContext();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar orgName={ctx.orgName} role={ctx.role} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
