import type { Workflow } from '../../shared/types.js';

export function StepDetailPanel({ workflow, onClose }: { workflow: Workflow; onClose: () => void }) {
  const w = workflow.definition;
  const onCopy = () => navigator.clipboard?.writeText(w.command);

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
      <div style={styles.cmdRow}>
        <code style={styles.cmd}>{w.command}</code>
        <button onClick={onCopy} style={styles.copyBtn}>📋 Copy</button>
      </div>
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
};
