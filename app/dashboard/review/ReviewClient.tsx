'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertOctagon, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { reviewUploadedDocumentAction } from '@/lib/actions/review';

type Stage = 'idle' | 'uploading' | 'extracting' | 'reviewing' | 'persisting' | 'done' | 'error';

export function ReviewClient() {
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.');
      setStage('error');
      return;
    }
    setFilename(file.name);
    setError(null);
    setStage('uploading');

    const form = new FormData();
    form.set('file', file);

    setTimeout(() => setStage((s) => (s === 'uploading' ? 'extracting' : s)), 800);
    setTimeout(() => setStage((s) => (s === 'extracting' ? 'reviewing' : s)), 2200);
    setTimeout(() => setStage((s) => (s === 'reviewing' ? 'persisting' : s)), 12000);

    try {
      await reviewUploadedDocumentAction(form);
      setStage('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Review failed';
      // Next.js redirect() throws a special error — surface only real failures.
      if (msg.includes('NEXT_REDIRECT')) {
        setStage('done');
        return;
      }
      setError(msg);
      setStage('error');
    }
  }

  return (
    <div className="flex-1 flex items-start justify-center px-8 py-10 overflow-y-auto">
      <div className="w-full max-w-3xl">
        {stage === 'idle' || stage === 'error' ? (
          <DropZone
            dragOver={dragOver}
            onDragEnter={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onDrop={(file) => { setDragOver(false); handleFile(file); }}
            onClick={() => inputRef.current?.click()}
          />
        ) : (
          <ProgressView stage={stage} filename={filename} />
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {error && (
          <div className="mt-6 text-sm px-4 py-3 rounded-md"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <FeatureList />
      </div>
    </div>
  );
}

function DropZone({
  dragOver, onDragEnter, onDragLeave, onDrop, onClick,
}: {
  dragOver: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (file: File) => void;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); onDragEnter(); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) onDrop(f);
      }}
      className="w-full rounded-lg py-16 text-center flex flex-col items-center gap-3 transition-all"
      style={{
        border: '1.5px dashed ' + (dragOver ? '#111111' : '#d4d4d4'),
        backgroundColor: dragOver ? 'rgba(201,168,76,0.06)' : '#fafaf9',
      }}
    >
      <UploadCloud className="w-10 h-10" style={{ color: '#111111' }} />
      <div className="text-lg" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
        Drop a contract PDF, or click to choose
      </div>
      <div className="text-xs uppercase tracking-[0.18em]" style={{ color: '#9ca3af' }}>
        PDF · up to 10 MB
      </div>
    </button>
  );
}

const STAGES: Record<Stage, { label: string; sub: string }> = {
  idle:        { label: '',                              sub: '' },
  uploading:   { label: 'Uploading',                     sub: 'Reading the file into the server.' },
  extracting:  { label: 'Extracting text',               sub: 'Parsing the PDF pages.' },
  reviewing:   { label: 'Reviewing against the corpus',  sub: 'Claude is segmenting clauses and flagging risk. This is the slow step (~10-25s).' },
  persisting:  { label: 'Saving review',                 sub: 'Writing clauses + citations + audit log.' },
  done:        { label: 'Done',                          sub: 'Redirecting to the review.' },
  error:       { label: '',                              sub: '' },
};

function ProgressView({ stage, filename }: { stage: Stage; filename: string | null }) {
  const order: Stage[] = ['uploading', 'extracting', 'reviewing', 'persisting', 'done'];
  const currentIdx = order.indexOf(stage);
  return (
    <div className="rounded-lg p-10" style={{ border: '1px solid #e5e5e5' }}>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-5 h-5" style={{ color: '#111111' }} />
        <div className="text-sm" style={{ color: '#111111' }}>{filename ?? 'document.pdf'}</div>
      </div>
      <ul className="space-y-3">
        {order.slice(0, -1).map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={s} className="flex items-start gap-3">
              <span
                className="mt-1 inline-block w-2 h-2 rounded-full"
                style={{
                  backgroundColor: done ? '#22c55e' : active ? '#111111' : '#d4d4d4',
                  boxShadow: active ? '0 0 0 4px rgba(201,168,76,0.18)' : 'none',
                }}
              />
              <div>
                <div className="text-sm" style={{ color: done || active ? '#111111' : '#9ca3af' }}>
                  {STAGES[s].label}
                  {active && <span className="ml-2 text-xs animate-pulse" style={{ color: '#111111' }}>·  ·  ·</span>}
                </div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>{STAGES[s].sub}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FeatureList() {
  const items = [
    { icon: ShieldCheck,    color: '#22c55e', title: 'Sound clauses',        body: 'Clauses that match the corpus pass through marked "ok".' },
    { icon: AlertTriangle,  color: '#f59e0b', title: 'Needs attention',      body: 'Drafting weakness or ambiguity. Not a legal risk but worth tightening.' },
    { icon: AlertOctagon,   color: '#ef4444', title: 'High / blocking',      body: 'Material gap vs the corpus or unenforceable. Comes with a suggested redline.' },
    { icon: Sparkles,       color: '#111111', title: 'Anchored to articles', body: 'Every flag cites the article in DIFC / ADGM that supports the finding.' },
  ];
  return (
    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map(({ icon: I, color, title, body }) => (
        <div key={title} className="rounded-md p-4 flex gap-3"
          style={{ border: '1px solid #ececec' }}>
          <I className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: '#111111' }}>{title}</div>
            <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
