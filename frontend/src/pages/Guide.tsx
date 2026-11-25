import type { ReactNode } from 'react';
import { ArrowLeft, ChevronDown, EyeOff, GripVertical, ListPlus, Pencil, StickyNote, Sun, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import AppHeader from '../components/AppHeader';
import RingMotif from '../components/RingMotif';
import { URGENCY_COLOURS, URGENCY_LABELS } from '../components/UrgencyBadge';
import { VERSION } from '../version';

/** An icon shown inline in the text, the same one the app uses, so it is easy to spot on screen. */
function Icon({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="mx-0.5 inline-flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white align-middle text-slate-500"
    >
      {children}
    </span>
  );
}

/** A small number badge, coloured like the urgency badges on the cards. */
function Badge({ n }: { n: 1 | 2 | 3 }) {
  return (
    <span
      aria-hidden="true"
      className={`mx-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full align-middle text-xs font-semibold ring-1 ${URGENCY_COLOURS[n]}`}
    >
      {n}
    </span>
  );
}

/** The on-screen name of a button or box, written the way it appears in the app. */
const Ui = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-navy">{children}</strong>;

const SECTIONS: { id: string; title: string; body: ReactNode }[] = [
  {
    id: 'how-it-works',
    title: 'How your list is organised',
    body: (
      <>
        <p>Everything sits in three levels:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            <Ui>Categories</Ui>: three fixed groups, Work, Business and Other. You can rename them, but there are always
            exactly three.
          </li>
          <li>
            <Ui>Sub-categories</Ui>: the projects or topics inside a category, for example "Screening V2 config". Each
            one is a white card.
          </li>
          <li>
            <Ui>Activities</Ui>: the individual things to do inside a sub-category, each with its own tick box.
          </li>
        </ol>
        <p>Everything saves automatically as you go. There is no Save button for your list.</p>
      </>
    ),
  },
  {
    id: 'tabs',
    title: 'The tabs at the top',
    body: (
      <>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Ui>Today</Ui>: your short list for today, picked from any category (see "Planning your day").
          </li>
          <li>
            <Ui>All</Ui>: every category on one page.
          </li>
          <li>
            <Ui>Work</Ui>, <Ui>Business</Ui>, <Ui>Other</Ui> (or the names you gave them): one category at a time.
          </li>
        </ul>
        <p>
          The numbers under each tab, like <Ui>1/4</Ui>, mean "1 of 4 sub-categories finished". The app remembers which
          tab you were on.
        </p>
      </>
    ),
  },
  {
    id: 'adding',
    title: 'Adding things',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <Ui>A sub-category</Ui>: type its name in the <Ui>New Work sub-category</Ui> box at the bottom of a category
          and press Enter (or tap <Ui>+</Ui>).
        </li>
        <li>
          <Ui>An activity</Ui>: type it in the <Ui>New activity</Ui> box inside a sub-category card and press Enter (or
          tap <Ui>+</Ui>). It is added at the end of the activities still to do, above any ticked ones.
        </li>
        <li>
          Tap the arrow <Icon label="arrow">
            <ChevronDown size={14} />
          </Icon>{' '}
          on the left of a card to fold its activities away, and again to open it.
        </li>
      </ul>
    ),
  },
  {
    id: 'ticking',
    title: 'Ticking things off',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Tick an activity's box when it is done. It is crossed out, the card's progress bar fills up, and it moves down
          to sit just below the activities still to do (above anything you ticked earlier), so what's left is always at
          the top.
        </li>
        <li>
          When every activity in a sub-category is ticked, the whole sub-category is crossed out and moves to the{' '}
          <Ui>Completed</Ui> section at the bottom of the page.
        </li>
        <li>
          A sub-category with no activities has its own tick box, before the number badge, so you can tick it off
          directly. If you later add an activity to it, it opens again.
        </li>
        <li>Untick something to bring it back. An unticked activity goes to the end of the still-to-do ones.</li>
        <li>
          The <Ui>Completed</Ui> section: tap its heading to open or fold it. <Ui>Hide</Ui>{' '}
          <Icon label="hide">
            <EyeOff size={14} />
          </Icon>{' '}
          hides it completely; <Ui>Show completed</Ui> brings it back.
        </li>
      </ul>
    ),
  },
  {
    id: 'urgency',
    title: 'How urgent is it? (1, 2, 3)',
    body: (
      <>
        <p>Each sub-category has a small number badge before its name:</p>
        <ul className="space-y-1 pl-1">
          {([1, 2, 3] as const).map((n) => (
            <li key={n}>
              <Badge n={n} /> <Ui>{URGENCY_LABELS[n]}</Ui>
              {n === 2 && ' (new sub-categories start here)'}
            </li>
          ))}
        </ul>
        <p>
          Tap the badge to change it. The sub-category moves automatically: a 1 goes to the top, a 2 goes just below the
          1s, and a 3 goes just below the 2s. After that you can still drag it wherever you like.
        </p>
      </>
    ),
  },
  {
    id: 'today',
    title: 'Planning your day (the Today tab)',
    body: (
      <>
        <p>Today is a short list of the sub-categories you want to focus on, from any category. Three ways to add one:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Tap the sun{' '}
            <Icon label="sun">
              <Sun size={14} />
            </Icon>{' '}
            on any card. It turns orange when the card is on Today; tap it again to take it off.
          </li>
          <li>
            On the Today tab, tap{' '}
            <Ui>
              <ListPlus size={14} className="inline align-[-2px]" aria-hidden="true" /> Add from your lists
            </Ui>{' '}
            and pick from each category. You can also create a brand-new sub-category there.
          </li>
          <li>
            Use the <Ui>New task for today</Ui> box at the bottom of Today: choose the category, type the name, press
            Enter.
          </li>
        </ul>
        <p>
          It is the same card as in its category, not a copy, so ticking it on Today ticks it everywhere. Today has its
          own order: drag cards to arrange your day.
        </p>
        <p>
          <Ui>Clear finished from Today</Ui> takes finished cards off Today (they stay in their category). You rarely
          need it: each morning, anything finished on an earlier day is cleared off Today automatically. Unfinished cards
          stay until you remove them.
        </p>
      </>
    ),
  },
  {
    id: 'notes',
    title: 'Notes',
    body: (
      <p>
        Tap the notes icon{' '}
        <Icon label="notes">
          <StickyNote size={14} />
        </Icon>{' '}
        on a sub-category to keep links, contacts or decisions with it. Tap <Ui>Save</Ui> to keep your changes, or{' '}
        <Ui>Cancel</Ui> (or tap outside the box) to discard them. The icon is filled in when a card has notes.
      </p>
    ),
  },
  {
    id: 'renaming',
    title: 'Renaming',
    body: (
      <>
        <p>
          Tap the pencil{' '}
          <Icon label="pencil">
            <Pencil size={14} />
          </Icon>
          , type the new name, then press Enter or tap the tick. Press Escape or tap the cross to cancel.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Ui>Categories</Ui>: pencil on the right of the heading. Names can be up to 20 characters. Today and All
            can't be renamed.
          </li>
          <li>
            <Ui>Sub-categories</Ui>: pencil next to the notes icon.
          </li>
          <li>
            <Ui>Activities</Ui>: pencil next to the bin.
          </li>
          <li>On a computer, sub-category and activity pencils appear when you move the mouse over the row.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'reordering',
    title: 'Changing the order',
    body: (
      <p>
        Press and hold the dotted handle{' '}
        <Icon label="drag handle">
          <GripVertical size={14} />
        </Icon>{' '}
        on the left of a card or activity, then drag it up or down. It works with a finger, a mouse, or the keyboard
        (Space to pick up, arrow keys to move, Space to drop, Escape to cancel). Things can be reordered within their
        own list only, not moved to another category or sub-category.
      </p>
    ),
  },
  {
    id: 'deleting',
    title: 'Deleting',
    body: (
      <p>
        Tap the bin{' '}
        <Icon label="bin">
          <Trash2 size={14} />
        </Icon>
        . The app asks <Ui>Delete? Yes / No</Ui> first. Deleting a sub-category also deletes all its activities, and it
        can't be undone.
      </p>
    ),
  },
  {
    id: 'good-to-know',
    title: 'Good to know',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>It works on a phone, iPad or computer, and shows the same list everywhere.</li>
        <li>
          To open it like an app on an iPad or iPhone: in Safari, tap <Ui>Share</Ui>, then <Ui>Add to Home Screen</Ui>.
        </li>
        <li>If something looks out of date, refresh the page.</li>
        <li>There is no login yet, so anyone who has the web address can see and change the list. Keep it private.</li>
      </ul>
    ),
  },
];

/** Plain-English user guide, linked from the header. */
export default function Guide() {
  return (
    <>
      <RingMotif />
      <AppHeader page="guide" />
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-6 text-navy">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-text hover:underline">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to your list
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight">User guide</h2>
        <p className="mt-1 text-slate-600">Everything your To Do List can do, in a few minutes' reading.</p>

        <nav aria-label="Guide contents" className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Contents</p>
          <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                {/* Buttons, not #links: the hosted preview uses the # part of the address for its pages. */}
                <button
                  type="button"
                  onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-left text-teal-text hover:underline"
                >
                  {i + 1}. {s.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-6 space-y-4">
          {SECTIONS.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              aria-labelledby={`${s.id}-title`}
              className="scroll-mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 id={`${s.id}-title`} className="text-lg font-bold tracking-tight">
                {i + 1}. {s.title}
              </h3>
              <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-slate-700">{s.body}</div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/" className="inline-flex items-center gap-1 font-semibold text-teal-text hover:underline">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to your list
          </Link>
          <span className="text-slate-500">Version {VERSION}</span>
        </div>
      </main>
    </>
  );
}
