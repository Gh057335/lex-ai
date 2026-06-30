'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, FileText, ExternalLink, Sparkles, BookOpen } from 'lucide-react';
import { askLegalAssistantAction, generateDocumentAction, type AssistantResponse } from '@/lib/actions/assistant';

type Turn =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; citations: AssistantResponse['citations']; retrievedCount: number };

interface Props {
  jurisdictions: string[];
}

export function AssistantClient({ jurisdictions }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [activeCitationIdx, setActiveCitationIdx] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, loading]);

  async function submit() {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setError(null);
    setTurns((t) => [...t, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const form = new FormData();
      form.set('question', q);
      const resp = await askLegalAssistantAction(form);
      setTurns((t) => [...t, {
        role: 'assistant',
        content: resp.answer,
        citations: resp.citations,
        retrievedCount: resp.retrievedCount,
      }]);
      setActiveCitationIdx(turns.length + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const lastAssistant = [...turns].reverse().find((t): t is Extract<Turn, { role: 'assistant' }> => t.role === 'assistant');
  const activeCitations = activeCitationIdx !== null && turns[activeCitationIdx]?.role === 'assistant'
    ? (turns[activeCitationIdx] as Extract<Turn, { role: 'assistant' }>).citations
    : (lastAssistant?.citations ?? []);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Chat column */}
      <div className="flex-1 flex flex-col">
        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-8 py-6">
          {turns.length === 0 && !loading && (
            <Welcome onPick={(q) => setInput(q)} />
          )}
          {turns.map((t, i) => (
            <div key={i} className="mb-6">
              {t.role === 'user' ? (
                <UserBubble text={t.content} />
              ) : (
                <AssistantBubble
                  text={t.content}
                  citations={t.citations}
                  retrievedCount={t.retrievedCount}
                  onCitationClick={() => setActiveCitationIdx(i)}
                />
              )}
            </div>
          ))}
          {loading && <ThinkingIndicator />}
          {error && (
            <div className="text-sm px-4 py-3 rounded-md mt-4"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              {error}
            </div>
          )}
        </div>
        <div className="px-8 py-4 border-t" style={{ borderColor: '#ececec' }}>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setDraftOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs uppercase tracking-[0.18em]"
              style={{ border: '1px solid #111111', color: '#111111' }}
            >
              <FileText className="w-3.5 h-3.5" />
              Generate document
            </button>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            className="flex gap-2 items-end"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder="Ask about contracts, data protection, employment, arbitration… (Enter to send, Shift+Enter for newline)"
              className="flex-1 px-4 py-3 rounded-md text-sm outline-none resize-none"
              style={{
                backgroundColor: '#fafaf9',
                border: '1px solid #ececec',
                color: '#111111',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 rounded-md font-medium disabled:opacity-50"
              style={{ backgroundColor: '#111111', color: '#ffffff' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Citation sidebar */}
      <aside
        className="w-[380px] border-l overflow-y-auto"
        style={{ borderColor: '#ececec', backgroundColor: '#fafaf9' }}
      >
        <div className="px-6 py-5 border-b" style={{ borderColor: '#ececec' }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: '#9ca3af' }}>
            <BookOpen className="w-3.5 h-3.5" />
            Cited sources
          </div>
        </div>
        <div className="px-6 py-4">
          {activeCitations.length === 0 ? (
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              Ask a question. The articles the AI relies on will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {activeCitations.map((c, i) => (
                <CitationCard key={c.chunkId} idx={i + 1} citation={c} />
              ))}
            </div>
          )}
        </div>
      </aside>

      {draftOpen && (
        <DraftModal
          jurisdictions={jurisdictions}
          onClose={() => setDraftOpen(false)}
        />
      )}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm"
        style={{ backgroundColor: 'rgba(201,168,76,0.10)', color: '#111111', border: '1px solid rgba(201,168,76,0.18)' }}>
        {text}
      </div>
    </div>
  );
}

function AssistantBubble({
  text, citations, retrievedCount, onCitationClick,
}: {
  text: string; citations: AssistantResponse['citations']; retrievedCount: number; onCitationClick: () => void;
}) {
  return (
    <div className="max-w-[85%]">
      <div className="text-[10px] uppercase tracking-[0.22em] mb-2 flex items-center gap-1.5"
        style={{ color: '#111111' }}>
        <Sparkles className="w-3 h-3" /> LEXAI
      </div>
      <div className="text-sm leading-[1.7] whitespace-pre-wrap" style={{ color: '#111111' }}>
        {renderInlineCitations(text, citations)}
      </div>
      <button
        onClick={onCitationClick}
        className="mt-2 text-[11px] uppercase tracking-[0.18em] underline-offset-4 hover:underline"
        style={{ color: '#9ca3af' }}
      >
        {citations.length} cited / {retrievedCount} retrieved →
      </button>
    </div>
  );
}

function renderInlineCitations(text: string, citations: AssistantResponse['citations']) {
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  const re = /\[C(\d+)\]/g;
  let match;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    parts.push(text.slice(lastIdx, match.index));
    const n = Number(match[1]);
    const c = citations[n - 1];
    parts.push(
      <span
        key={`cit-${key++}`}
        title={c ? `${c.sourceTitle}${c.locator ? ' — ' + c.locator : ''}` : `[C${n}]`}
        className="inline-flex items-center px-1.5 mx-0.5 rounded text-[10px] align-middle"
        style={{ backgroundColor: 'rgba(201,168,76,0.18)', color: '#111111', border: '1px solid rgba(201,168,76,0.3)' }}
      >
        C{n}
      </span>
    );
    lastIdx = match.index + match[0].length;
  }
  parts.push(text.slice(lastIdx));
  return parts;
}

function ThinkingIndicator() {
  return (
    <div className="text-[11px] uppercase tracking-[0.22em] flex items-center gap-2"
      style={{ color: '#111111' }}>
      <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#111111' }} />
      Retrieving and reasoning over the corpus…
    </div>
  );
}

function CitationCard({ idx, citation }: { idx: number; citation: AssistantResponse['citations'][number] }) {
  return (
    <div className="rounded-md p-3" style={{ border: '1px solid #e5e5e5' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-[10px] px-1.5 rounded font-mono"
          style={{ backgroundColor: 'rgba(201,168,76,0.18)', color: '#111111' }}>
          C{idx}
        </div>
        {citation.officialUrl && (
          <a href={citation.officialUrl} target="_blank" rel="noreferrer"
            className="text-[10px] uppercase tracking-[0.16em] flex items-center gap-1"
            style={{ color: '#9ca3af' }}>
            Source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="text-xs font-semibold" style={{ color: '#111111' }}>{citation.sourceTitle}</div>
      <div className="text-[11px] mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: '#6b7280' }}>
        {citation.locator && <span>{citation.locator}</span>}
        <span style={{ color: '#9ca3af' }}>·</span>
        <span style={{ color: '#9ca3af' }}>{citation.jurisdiction}</span>
        {citation.effectiveFrom && (
          <>
            <span style={{ color: '#9ca3af' }}>·</span>
            <span style={{ color: '#9ca3af' }}>eff. {citation.effectiveFrom}</span>
          </>
        )}
      </div>
      <p className="text-[12px] mt-2 leading-[1.55]" style={{ color: '#6b7280' }}>
        {citation.snippet}{citation.snippet.length >= 280 ? '…' : ''}
      </p>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (q: string) => void }) {
  const samples = [
    'What are the directors\' duties under DIFC Companies Law?',
    'When does an employer in DIFC have to issue a written employment contract?',
    'Summarise the 72-hour breach notification rules across DIFC and ADGM.',
    'Draft a confidentiality clause governed by DIFC law.',
  ];
  return (
    <div className="max-w-2xl mx-auto mt-12">
      <h2 className="text-xl mb-2" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
        Ask LEXAI
      </h2>
      <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
        Every answer is grounded in passages from your workspace corpus, with article-level citations.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {samples.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left text-sm px-4 py-3 rounded-md hover:opacity-90"
            style={{ border: '1px solid #e5e5e5', color: '#6b7280' }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function DraftModal({ jurisdictions, onClose }: { jurisdictions: string[]; onClose: () => void }) {
  const [pending, setPending] = useState(false);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(6,13,26,0.85)' }}
      onClick={onClose}>
      <form
        action={async (formData) => {
          setPending(true);
          try {
            await generateDocumentAction(formData);
          } catch (err) {
            setPending(false);
            alert(err instanceof Error ? err.message : 'Generation failed');
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-lg p-6"
        style={{ backgroundColor: '#ffffff', border: '1px solid #ececec' }}
      >
        <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
          Generate document
        </h3>
        <p className="text-xs mb-5" style={{ color: '#6b7280' }}>
          LEXAI will draft this directly from the cited corpus.
        </p>
        <div className="space-y-3">
          <Field label="Document type">
            <select name="documentType" required
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{ backgroundColor: '#fafaf9', border: '1px solid #ececec', color: '#111111' }}>
              <option value="Mutual NDA">Mutual NDA</option>
              <option value="Employment Contract">Employment Contract</option>
              <option value="Services Agreement">Services Agreement</option>
              <option value="Data Processing Agreement">Data Processing Agreement</option>
              <option value="Shareholders Agreement">Shareholders Agreement</option>
              <option value="Arbitration Clause">Arbitration Clause</option>
            </select>
          </Field>
          <Field label="Governing jurisdiction">
            <select name="jurisdiction" required
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{ backgroundColor: '#fafaf9', border: '1px solid #ececec', color: '#111111' }}>
              {jurisdictions.length === 0 && <option value="ae-difc">ae-difc</option>}
              {jurisdictions.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </Field>
          <Field label="Parties (one line each)">
            <textarea name="parties" required rows={2}
              placeholder={'e.g. Acme DIFC Ltd (Disclosing) — Beta Holdings Ltd (Receiving)'}
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{ backgroundColor: '#fafaf9', border: '1px solid #ececec', color: '#111111' }} />
          </Field>
          <Field label="Context (optional)">
            <textarea name="context" rows={2}
              placeholder="e.g. cross-border data sharing for a 6-month pilot"
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{ backgroundColor: '#fafaf9', border: '1px solid #ececec', color: '#111111' }} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-md text-sm"
            style={{ color: '#6b7280' }}>
            Cancel
          </button>
          <button type="submit" disabled={pending}
            className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#111111', color: '#ffffff' }}>
            {pending ? 'Drafting…' : 'Generate'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.18em] mb-1" style={{ color: '#9ca3af' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
