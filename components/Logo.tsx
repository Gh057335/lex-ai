import Link from 'next/link';

export function Logo({ href = '/dashboard', size = 'md' }: { href?: string; size?: 'sm' | 'md' | 'lg' }) {
  const fontSize = size === 'sm' ? 16 : size === 'lg' ? 26 : 20;
  const barWidth = size === 'sm' ? 3 : size === 'lg' ? 5 : 4;
  const barHeight = Math.round(fontSize * 0.95);

  return (
    <Link href={href} className="flex items-center gap-2 select-none group" aria-label="Lexai">
      <span
        aria-hidden
        className="block shrink-0 transition-transform group-hover:translate-y-[-1px]"
        style={{
          width: barWidth,
          height: barHeight,
          background: '#C0673E',
          borderRadius: 0.5,
        }}
      />
      <span
        style={{
          fontSize,
          color: '#141007',
          letterSpacing: '-0.025em',
          lineHeight: 1,
          fontFamily: 'var(--font-fraunces), Georgia, serif',
          fontWeight: 500,
          fontVariationSettings: "'opsz' 24, 'SOFT' 30",
        }}
      >
        Lexai
      </span>
    </Link>
  );
}
