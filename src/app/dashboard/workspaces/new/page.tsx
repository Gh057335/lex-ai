import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { requirePermission } from '@/lib/auth';
import { JURISDICTIONS, SECTORS } from '@/lib/taxonomy';
import { createWorkspaceAction } from '@/lib/actions/workspaces';

export default async function NewWorkspacePage() {
  await requirePermission('workspace.create');

  const grouped = JURISDICTIONS.reduce<Record<string, typeof JURISDICTIONS>>((acc, j) => {
    (acc[j.region] ??= []).push(j);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/dashboard"
        className="text-sm flex items-center gap-1 mb-4"
        style={{ color: '#6b7280' }}
      >
        <ChevronLeft className="w-4 h-4" /> Back to workspaces
      </Link>

      <h1
        className="text-2xl font-semibold mb-2"
        style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
      >
        New workspace
      </h1>
      <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
        Pick the jurisdictions and sectors this workspace will operate in. You can change this later.
      </p>

      <form action={createWorkspaceAction} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm mb-1.5" style={{ color: '#6b7280' }}>
            Workspace name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. MENA operations"
            className="w-full px-3 py-2 rounded-md outline-none"
            style={{ backgroundColor: '#fafaf9', border: '1px solid #e5e5e5' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="default_jurisdiction" className="block text-sm mb-1.5" style={{ color: '#6b7280' }}>
              Default jurisdiction
            </label>
            <select
              id="default_jurisdiction"
              name="default_jurisdiction"
              required
              defaultValue="ae:difc"
              className="w-full px-3 py-2 rounded-md outline-none"
              style={{ backgroundColor: '#fafaf9', border: '1px solid #e5e5e5' }}
            >
              {JURISDICTIONS.map((j) => (
                <option key={j.key} value={j.key} style={{ color: '#ffffff' }}>{j.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="default_language" className="block text-sm mb-1.5" style={{ color: '#6b7280' }}>
              Default language
            </label>
            <select
              id="default_language"
              name="default_language"
              defaultValue="en"
              className="w-full px-3 py-2 rounded-md outline-none"
              style={{ backgroundColor: '#fafaf9', border: '1px solid #e5e5e5' }}
            >
              {['en','fr','ar','pt'].map((l) => (
                <option key={l} value={l} style={{ color: '#ffffff' }}>{l.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="text-sm mb-3" style={{ color: '#6b7280' }}>Enabled jurisdictions</legend>
          {Object.entries(grouped).map(([region, items]) => (
            <div key={region} className="mb-4">
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#111111' }}>
                {region.replace('_', ' ')}
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map((j) => (
                  <label
                    key={j.key}
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-sm cursor-pointer"
                    style={{ backgroundColor: '#fafaf9', border: '1px solid #ececec' }}
                  >
                    <input type="checkbox" name="enabled_jurisdictions" value={j.key} />
                    <span>{j.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </fieldset>

        <fieldset>
          <legend className="text-sm mb-3" style={{ color: '#6b7280' }}>Enabled sectors</legend>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((s) => (
              <label
                key={s.key}
                className="flex items-center gap-2 px-3 py-1.5 rounded text-sm cursor-pointer"
                style={{ backgroundColor: '#fafaf9', border: '1px solid #ececec' }}
                title={s.description}
              >
                <input type="checkbox" name="enabled_sectors" value={s.key} />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            className="px-5 py-2 rounded-md font-medium"
            style={{ backgroundColor: '#111111', color: '#ffffff' }}
          >
            Create workspace
          </button>
          <Link href="/dashboard" className="text-sm" style={{ color: '#6b7280' }}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
