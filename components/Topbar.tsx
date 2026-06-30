interface Props {
  orgName: string;
  role: string;
}

export function Topbar({ orgName, role }: Props) {
  return (
    <header
      className="h-14 px-6 flex items-center justify-between"
      style={{ borderBottom: '1px solid #ECEAE3', backgroundColor: '#FFFFFF' }}
    >
      <div className="text-[13px] flex items-center gap-2">
        <span style={{ color: '#141007', fontWeight: 500 }}>{orgName}</span>
        <span style={{ color: '#B5A988' }}>/</span>
        <span style={{ color: '#6E6346' }}>{role}</span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="text-[10px] uppercase px-2 py-0.5 rounded-full"
          style={{
            color: '#9A4F2D',
            backgroundColor: '#F2DDC8',
            border: '1px solid #DBB89B',
            letterSpacing: '0.18em',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
        >
          Demo
        </span>
      </div>
    </header>
  );
}
