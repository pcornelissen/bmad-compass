import type { NextStep } from '../../shared/types.js';

export function Hero({ nextStep }: { nextStep: NextStep | null }) {
  if (!nextStep) {
    return <div style={styles.hero}><span style={styles.label}>Status</span><div style={styles.title}>No next step — you're all caught up.</div></div>;
  }
  const onCopy = () => navigator.clipboard?.writeText(nextStep.command);
  return (
    <div style={styles.hero}>
      <div>
        <div style={styles.label}>▸ Nächster Schritt</div>
        <div style={styles.title}>{nextStep.title}</div>
        <div style={styles.sub}>{nextStep.reason}</div>
        <div style={styles.cmdRow}>
          <code style={styles.cmd}>{nextStep.command}</code>
          <button onClick={onCopy} style={styles.copyBtn}>📋 Copy</button>
        </div>
        <div style={styles.agent}>Agent: {nextStep.agent}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: { background: 'linear-gradient(135deg, #fff 0%, var(--av-bg-soft) 100%)', border: '1px solid var(--av-border)', borderLeft: '4px solid var(--av-orange)', padding: '14px 16px', borderRadius: 6, marginBottom: 18 },
  label: { fontSize: 10, textTransform: 'uppercase', color: 'var(--av-orange)', letterSpacing: '1.2px', fontWeight: 700 },
  title: { fontSize: 16, color: 'var(--av-darker)', fontWeight: 600, margin: '3px 0 4px' },
  sub: { fontSize: 11, color: 'var(--av-grey-mid)', marginBottom: 8 },
  cmdRow: { display: 'flex', alignItems: 'center', gap: 8 },
  cmd: { background: 'var(--av-darker)', color: '#f0c896', padding: '6px 12px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 },
  copyBtn: { background: 'var(--av-orange)', color: 'white', border: 0, padding: '6px 10px', borderRadius: 3, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' },
  agent: { fontSize: 10, color: 'var(--av-grey)', marginTop: 6, fontFamily: 'var(--font-mono)' },
};
