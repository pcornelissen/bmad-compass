import type { SubStep, Workflow } from '../../shared/types.js';

export function StepDetailPanel({ workflow, onClose }: { workflow: Workflow; onClose: () => void }) {
  const w = workflow.definition;
  const onCopy = () => navigator.clipboard?.writeText(w.command);

  const done = (workflow.subSteps ?? []).filter(s => s.status === 'done');
  const hinted = (workflow.subSteps ?? []).filter(s => s.status === 'hinted');

  return (
    <div style={styles.panel}>
      <div style={styles.head}>
        <div>
          <div style={styles.title}>{w.title}</div>
          <div style={styles.sub}>Phase {w.phase} · Agent: {w.agent}</div>
        </div>
        <button onClick={onClose} aria-label="close" style={styles.close}>✕</button>
      </div>

      <div style={styles.grid}>
        <div>
          <div style={styles.label}>Was passiert</div>
          <div>{w.description}</div>
        </div>
        <div>
          <div style={styles.label}>Voraussetzungen</div>
          {w.requires.length === 0 ? '—' : w.requires.map(r => <div key={r}>✓ {r}</div>)}
        </div>
        <div>
          <div style={styles.label}>Produziert</div>
          {w.produces.length === 0 ? '— (kein Artefakt)' : w.produces.map(p => <code key={p} style={styles.path}>{p}</code>)}
        </div>
        <div>
          <div style={styles.label}>Doku</div>
          <a href={w.docsUrl} target="_blank" rel="noreferrer" style={styles.link}>docs</a>
        </div>
      </div>

      {(done.length > 0 || hinted.length > 0) && (
        <div style={styles.progress}>
          {done.length > 0 && (
            <div style={styles.progressBlock}>
              <div style={styles.progressHead}>
                <span style={styles.label}>FORTSCHRITT</span>
                <span style={styles.counter}>{done.length}</span>
              </div>
              {done.map(s => <SubStepRow key={s.id} step={s} />)}
            </div>
          )}
          {hinted.length > 0 && (
            <div style={{ ...styles.progressBlock, marginTop: 10, borderTop: '1px dashed var(--av-border)', paddingTop: 8 }}>
              <div style={styles.progressHead}>
                <span style={styles.label}>VIELLEICHT ALS NÄCHSTES</span>
                <span style={styles.counter}>{hinted.length} vorgeschlagen</span>
              </div>
              {hinted.map(s => <SubStepRow key={s.id} step={s} />)}
            </div>
          )}
        </div>
      )}

      <div style={styles.cmdRow}>
        <code style={styles.cmd}>{w.command}</code>
        <button onClick={onCopy} style={styles.copyBtn}>📋 Copy</button>
      </div>
    </div>
  );
}

function SubStepRow({ step }: { step: SubStep }) {
  const isDone = step.status === 'done';
  return (
    <div style={{ ...styles.subStepRow, ...(isDone ? {} : styles.subStepHinted) }}>
      <span style={isDone ? styles.subStepCheck : styles.subStepArrow}>{isDone ? '✓' : '↪'}</span>
      <span>{step.label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: { background: 'white', border: '1px solid var(--av-orange)', borderRadius: 6, padding: '14px 16px', marginBottom: 18, boxShadow: '0 4px 12px rgba(238,100,25,.1)' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--av-border)' },
  title: { fontSize: 14, fontWeight: 700, color: 'var(--av-darker)' },
  sub: { fontSize: 11, color: 'var(--av-grey-mid)', marginTop: 2 },
  close: { background: 'transparent', border: 0, color: 'var(--av-grey)', fontSize: 16, padding: '0 4px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 11 },
  label: { fontSize: 9, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--av-grey)', fontWeight: 700, marginBottom: 4 },
  path: { display: 'block', background: 'var(--av-bg-soft)', padding: '2px 4px', borderRadius: 2, marginTop: 2 },
  link: { color: 'var(--av-orange)' },
  cmdRow: { marginTop: 10 },
  cmd: { background: 'var(--av-darker)', color: '#f0c896', padding: '6px 12px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12, marginRight: 8 },
  copyBtn: { background: 'var(--av-orange)', color: 'white', border: 0, padding: '6px 10px', borderRadius: 3, fontSize: 10, fontWeight: 600 },
  progress: { marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--av-border)' },
  progressBlock: { marginBottom: 4 },
  progressHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  counter: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--av-grey)' },
  subStepRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, padding: '3px 0', color: 'var(--av-text)' },
  subStepHinted: { color: 'var(--av-grey-mid)', fontStyle: 'italic' },
  subStepCheck: { color: 'var(--status-done)', fontWeight: 700 },
  subStepArrow: { color: 'var(--av-grey-mid)' },
};
