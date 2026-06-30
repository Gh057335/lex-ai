'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, FileText, ScanLine, Newspaper, Globe2, Settings } from 'lucide-react';
import { Logo } from './Logo';

const NAV = [
  { href: '/dashboard',            label: 'Home',      icon: Home },
  { href: '/dashboard/assistant',  label: 'Assistant', icon: Sparkles },
  { href: '/dashboard/contracts',  label: 'Documents', icon: FileText },
  { href: '/dashboard/review',     label: 'Scan',      icon: ScanLine },
  { href: '/dashboard/alerts',     label: 'News',      icon: Newspaper },
  { href: '/dashboard/workspaces', label: 'Markets',   icon: Globe2 },
];

const FOOTER = [{ href: '/dashboard/settings', label: 'Settings', icon: Settings }];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <aside
      className="w-[224px] flex flex-col"
      style={{ backgroundColor: '#F5F2EC', borderRight: '1px solid #ECEAE3' }}
    >
      <div className="px-5 py-5">
        <Logo size="md" />
      </div>

      <nav className="px-2.5 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] mb-0.5 transition-colors relative"
              style={
                active
                  ? { backgroundColor: '#141007', color: '#FFFFFF' }
                  : { color: '#2A2418' }
              }
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute -left-1 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full"
                  style={{ backgroundColor: '#C0673E' }}
                />
              )}
              <Icon className="w-4 h-4" strokeWidth={1.7} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2.5 pb-4">
        {FOOTER.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors"
              style={active ? { backgroundColor: '#FFFFFF', color: '#141007' } : { color: '#6E6346' }}
            >
              <Icon className="w-4 h-4" strokeWidth={1.7} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
