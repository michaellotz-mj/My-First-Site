/**
 * Large, faint lifecycle ring drawn behind the page, as on lotzsolutions.com.au
 * (the website's RingMotif.astro). Fixed to the window and never takes clicks. The header
 * and <main> in Home sit one layer above it (`relative z-10`), so cards, tabs and dialogs
 * always cover it. (A negative z-index would vanish behind any page background.)
 */
export default function RingMotif() {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      data-testid="ring-motif"
      className="pointer-events-none fixed -right-32 -bottom-24 z-0 w-[22rem] sm:-right-28 sm:w-[30rem] lg:-right-16 lg:bottom-auto lg:top-1/2 lg:w-[36rem] lg:-translate-y-1/3"
    >
      <g transform="rotate(-80 50 50)">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#14284B" strokeWidth="13" strokeDasharray="49.7 10" opacity="0.06" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#1A9C8C" strokeWidth="13" strokeDasharray="49.7 189" opacity="0.22" />
      </g>
      <circle cx="50" cy="50" r="11" fill="#14284B" opacity="0.06" />
    </svg>
  );
}
