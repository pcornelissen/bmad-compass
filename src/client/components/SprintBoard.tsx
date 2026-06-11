import { useState } from 'react';
import type { SprintStory, StoryStatus } from '../../shared/types.js';

const COLUMNS: { status: StoryStatus; label: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'ready-for-dev', label: 'Ready' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'done', label: 'Done' },
];

const ACCENT: Partial<Record<StoryStatus, string>> = {
  'in-progress': 'var(--av-orange)',
  review: 'var(--av-orange-bright)',
  done: 'var(--status-done)',
  blocked: 'var(--status-blocked)',
};

const COLLAPSED_TRACK = '34px';

export function SprintBoard({ stories }: { stories: SprintStory[] }) {
  const all = stories.filter(s => s.kind === 'story');
  // Done is the longest, least actionable column — collapse it by default to free horizontal space.
  const [doneCollapsed, setDoneCollapsed] = useState(true);
  if (all.length === 0) return null;

  const hasBlocked = all.some(s => s.status === 'blocked');
  const columns = hasBlocked
    ? [{ status: 'blocked' as StoryStatus, label: 'Blocked' }, ...COLUMNS]
    : COLUMNS;

  const cardsFor = (status: StoryStatus) =>
    all.filter(s => s.status === status).sort((a, b) => storySortKey(a.id) - storySortKey(b.id));

  // Done is always the last column. When collapsed it shrinks to a narrow track so the rest grow.
  const gridTemplateColumns = doneCollapsed
    ? `repeat(${columns.length - 1}, minmax(0, 1fr)) ${COLLAPSED_TRACK}`
    : `repeat(${columns.length}, minmax(0, 1fr))`;

  return (
    <div style={{ ...styles.grid, gridTemplateColumns }} data-testid="sprint-board">
      {columns.map(col => {
        const cards = cardsFor(col.status);

        if (col.status === 'done' && doneCollapsed) {
          return (
            <div key="done" data-testid="column-done">
              <div
                style={styles.collapsedStrip}
                data-testid="done-toggle"
                role="button"
                tabIndex={0}
                aria-expanded={false}
                onClick={() => setDoneCollapsed(false)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDoneCollapsed(false); } }}
                title={`Done (${cards.length}) — aufklappen`}
              >
                <span style={styles.stripInner}>
                  <span style={styles.chevron}>▸</span>
                  <span>Done</span>
                  <span style={styles.count}>{cards.length}</span>
                </span>
              </div>
            </div>
          );
        }

        const collapsible = col.status === 'done';
        return (
          <div key={col.status} style={styles.col} data-testid={`column-${col.status}`}>
            <div
              style={collapsible ? styles.headToggle : styles.head}
              data-testid={collapsible ? 'done-toggle' : `column-header-${col.status}`}
              {...(collapsible
                ? {
                    role: 'button',
                    tabIndex: 0,
                    'aria-expanded': true,
                    onClick: () => setDoneCollapsed(true),
                    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDoneCollapsed(true); } },
                  }
                : {})}
            >
              {collapsible && <span style={styles.chevron}>▾</span>}
              <span>{col.label}</span>
              <span style={styles.count}>{cards.length}</span>
            </div>
            <div style={styles.body} data-testid={`column-body-${col.status}`}>
              {cards.map(s => (
                <div
                  key={s.id}
                  style={{ ...styles.card, borderLeft: `3px solid ${ACCENT[s.status] ?? 'var(--av-border)'}` }}
                  data-testid="story-card"
                  data-story-id={s.id}
                  title={s.title}
                >
                  <span style={styles.cardId}>{s.id}</span>
                  <span style={styles.cardEpic}>{s.epicId}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function storySortKey(id: string): number {
  const m = id.match(/^(\d+)-(\d+)/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return parseInt(m[1], 10) * 1000 + parseInt(m[2], 10);
}

const styles: Record<string, React.CSSProperties> = {
  grid: { display: 'grid', gap: 8, marginBottom: 18, alignItems: 'start' },
  col: { background: 'var(--av-bg-soft)', borderRadius: 6, padding: 8, border: '1px solid var(--av-border)', alignSelf: 'start' },
  head: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--av-grey-mid)', fontWeight: 700, padding: '2px' },
  headToggle: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--av-grey-mid)', fontWeight: 700, padding: '2px', cursor: 'pointer', userSelect: 'none', borderRadius: 4 },
  chevron: { fontSize: 8, color: 'var(--av-grey)', width: 8 },
  count: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--av-grey)', background: 'white', borderRadius: 8, padding: '1px 6px', border: '1px solid var(--av-border)', marginLeft: 'auto' },
  body: { marginTop: 8, maxHeight: 360, overflowY: 'auto' },
  card: { background: 'white', borderRadius: 4, padding: '6px 8px', marginBottom: 5, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 2 },
  cardId: { fontSize: 11, fontWeight: 600, color: 'var(--av-text)' },
  cardEpic: { fontSize: 9, color: 'var(--av-grey)', fontFamily: 'var(--font-mono)' },
  collapsedStrip: { background: 'var(--status-done-bg)', border: '1px solid var(--status-done-border)', borderRadius: 6, padding: 6, cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'center', alignSelf: 'stretch', minHeight: 80 },
  stripInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#166534', fontWeight: 700 },
};
