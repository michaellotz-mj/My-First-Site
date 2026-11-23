import type { CSSProperties } from 'react';

/**
 * Lotz Solutions logo: the "lifecycle ring" plus the "Lotz / SOLUTIONS" wordmark.
 * Same drawing and proportions as the website's Logo.astro (michaellotz-mj/Website).
 */
export default function Logo({ size = 40 }: { size?: number }) {
  const s = (factor: number) => `${size * factor}px`;
  return (
    <span className="inline-flex items-center leading-none text-navy">
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false" className="shrink-0">
        <g transform="rotate(-80 50 50)">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#14284B" strokeWidth="13" strokeDasharray="49.7 10" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#1A9C8C" strokeWidth="13" strokeDasharray="49.7 189" />
        </g>
        <circle cx="50" cy="50" r="11" fill="#14284B" />
      </svg>
      <span className="inline-flex flex-col items-stretch" style={{ marginLeft: s(0.28) }}>
        <span style={{ fontWeight: 800, fontSize: s(0.62), letterSpacing: '-0.03em', lineHeight: 0.95 }}>Lotz</span>
        <span aria-hidden="true" className="block bg-teal" style={{ height: 3, margin: `${s(0.07)} 0 ${s(0.08)}` }} />
        {/* Wide letter-spacing adds space after the last letter; the negative margin removes it. */}
        <span style={solutions(size)}>Solutions</span>
      </span>
    </span>
  );
}

const solutions = (size: number): CSSProperties => ({
  fontWeight: 500,
  fontSize: `${size * 0.235}px`,
  textTransform: 'uppercase',
  letterSpacing: '0.3em',
  marginRight: '-0.3em',
});
