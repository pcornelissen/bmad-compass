import type { ModuleInfo } from '../../shared/types.js';

const PHASE_NAMES: Record<number, string> = {
  1: 'Analysis', 2: 'Planning', 3: 'Solutioning', 4: 'Implementation',
};

export function Header({
  projectName, projectRoot, phase, wsOnline, modules, workflowSource,
}: {
  projectName: string;
  projectRoot: string;
  phase: 1|2|3|4;
  wsOnline: boolean;
  modules: ModuleInfo[];
  workflowSource: 'manifest' | 'fallback';
}) {
  return (
    <header style={styles.header}>
      <div style={styles.brand}>
        <div style={styles.mark}>▲</div>
        <div>
          <div style={styles.title}>BMAD COMPASS</div>
          <div style={styles.sub}>{projectRoot}</div>
        </div>
      </div>
      <div style={styles.right}>
        {workflowSource === 'manifest' && modules.length > 0 && (
          <div style={styles.modules} title="Workflows aus _bmad/-Manifesten geladen">
            {modules.map(m => m.name).join(' · ')}
          </div>
        )}
        <div style={styles.status}>
          <span style={{ ...styles.pulse, background: wsOnline ? '#22c55e' : '#ef4444' }} />
          {wsOnline ? 'live' : 'offline'}
        </div>
        <div style={styles.pill}>Phase {phase} · {PHASE_NAMES[phase]}</div>
        <div style={styles.proj}>{projectName}</div>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { background: 'var(--av-dark)', color: 'white', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  mark: { width: 24, height: 24, borderRadius: 4, background: 'var(--av-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 },
  title: { fontWeight: 700, fontSize: 14, letterSpacing: '.3px' },
  sub: { fontSize: 11, color: '#b0bcc9', fontFamily: 'var(--font-mono)' },
  right: { display: 'flex', alignItems: 'center', gap: 14 },
  modules: { fontSize: 10, color: '#b0bcc9', fontFamily: 'var(--font-mono)', cursor: 'help' },
  status: { fontSize: 10, color: '#b0bcc9', display: 'flex', alignItems: 'center', gap: 4 },
  pulse: { width: 6, height: 6, borderRadius: '50%' },
  pill: { background: 'var(--av-orange)', color: 'white', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 600 },
  proj: { fontSize: 11, color: '#b0bcc9', fontFamily: 'var(--font-mono)' },
};
