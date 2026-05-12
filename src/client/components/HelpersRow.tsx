import type { Workflow } from '../../shared/types.js';

export function HelpersRow({ workflows, selectedId, onSelect }: {
  workflows: Workflow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const helpers = workflows.filter(w => w.definition.cross);
  if (helpers.length === 0) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.head}>ANYTIME · HELPERS</div>
      <div style={styles.row}>
        {helpers.map(w => {
          const status = w.status;
          const selected = selectedId === w.definition.id;
          const pillStyle = { ...styles.pill,
            ...(status === 'done' ? styles.pillDone : {}),
            ...(selected ? styles.pillSelected : {}),
          };
          const dotColor = status === 'done' ? 'var(--status-done)' : 'var(--av-grey)';
          return (
            <div
              key={w.definition.id}
              style={pillStyle}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(w.definition.id)}
              title={w.definition.description}
            >
              <span style={{ ...styles.dot, background: dotColor }} />
              <span>{w.definition.title || w.definition.id}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { marginTop: 18, marginBottom: 18 },
  head: { fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--av-grey-mid)', fontWeight: 700, marginBottom: 8 },
  row: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  pill: { display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid var(--av-border)', borderRadius: 14, padding: '5px 10px', fontSize: 11, color: 'var(--av-text)', cursor: 'pointer' },
  pillDone: { background: 'var(--status-done-bg)', borderColor: 'var(--status-done-border)', color: '#166534' },
  pillSelected: { background: '#fff7ed', borderColor: 'var(--av-orange)' },
  dot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
};
