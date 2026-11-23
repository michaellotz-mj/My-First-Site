import { BookOpen } from 'lucide-react';
import { Link } from 'wouter';
import Logo from './Logo';
import { VERSION } from '../version';

/**
 * Very light teal header with the ring logo, as on lotzsolutions.com.au, and a teal line underneath
 * (the same 3px teal rule as under "Lotz" in the logo). Shared by the board and the user guide.
 * The title links back to the list; "Guide" opens the user guide.
 */
export default function AppHeader({ page }: { page: 'list' | 'guide' }) {
  return (
    <header className="relative z-10 border-b-[3px] border-teal bg-teal-mist">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/" aria-label="To Do List: back to your list" className="flex min-w-0 items-center gap-3">
          <Logo size={38} />
          <span aria-hidden="true" className="h-9 w-px shrink-0 bg-navy/15" />
          <h1 className="truncate text-xl font-extrabold tracking-tight text-navy">To Do List</h1>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/guide"
            aria-current={page === 'guide' ? 'page' : undefined}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-teal-text ring-1 ring-teal-text/30 hover:bg-white ${
              page === 'guide' ? 'bg-white' : ''
            }`}
          >
            <BookOpen size={16} aria-hidden="true" />
            Guide
          </Link>
          {/* No room on phones; the guide shows the version at the bottom instead. */}
          <span className="hidden rounded bg-white px-2 py-0.5 text-xs text-muted ring-1 ring-navy/10 sm:inline">
            v{VERSION}
          </span>
        </div>
      </div>
    </header>
  );
}
