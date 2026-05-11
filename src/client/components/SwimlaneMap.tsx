import type { Workflow, Phase } from '../../shared/types.js';

const PHASE_LABELS: Record<Phase, { name: string; sub?: string }> = {
  1: { name: 'Analysis', sub: 'optional' },
  2: { name: 'Planning' },
  3: { name: 'Solutioning' },
  4: { name: 'Implementation' },
};

const MAP_IDS = new Set([
  'brainstorming','market-research','domain-research','technical-research','product-brief','prfaq',
  'create-prd','create-ux-design',
  'create-architecture','create-epics-and-stories','check-implementation-readiness',
  'sprint-planning','create-story','dev-story','code-review','retrospective',
]);

export function SwimlaneMap({ workflows, selectedId, onSelect, currentPhase }: {
  workflows: Workflow[]; selectedId: string | null; onSelect: (id: string) => void; currentPhase: Phase;
}) {
  const byPhase: Record<Phase, Workflow[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const w of workflows) {
    if (MAP_IDS.has(w.definition.id)) byPhase[w.definition.phase].push(w);
  }

  return (
    <div style={styles.grid}>
      {([1,2,3,4] as Phase[]).map(phase => {
        const isActive = phase === currentPhase;
        return (
          <div key={phase} style={{ ...styles.col, ...(isActive ? styles.colActive : {}) }}>
            <div style={{ ...styles.head, ...(isActive ? styles.headActive : {}) }}>
              {isActive ? '▸ ' : ''}Phase {phase}{PHASE_LABELS[phase].sub ? ` — ${PHASE_LABELS[phase].sub}` : ''}
            </div>
            <div style={styles.title}>{PHASE_LABELS[phase].name}</div>
            {byPhase[phase].map(w => (
              <Step key={w.definition.id} workflow={w} selected={selectedId === w.definition.id} onClick={() => onSelect(w.definition.id)} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Step({ workflow, selected, onClick }: { workflow: Workflow; selected: boolean; onClick: () => void }) {
  const { status } = workflow;
  const stepStyle = { ...styles.step,
    ...(status === 'done' ? styles.stepDone : {}),
    ...(status === 'in-progress' ? styles.stepNext : {}),
    ...(selected ? styles.stepSelected : {}),
  };
  const dotStyle = { ...styles.dot,
    background: status === 'done' ? 'var(--status-done)'
      : status === 'in-progress' ? 'var(--av-orange)'
      : 'var(--status-pending)',
    animation: status === 'in-progress' ? 'pulse 1.6s infinite' : undefined,
  };
  const doneCount = (workflow.subSteps ?? []).filter(s => s.status === 'done').length;
  return (
    <div onClick={onClick} style={stepStyle} role="button" tabIndex={0}>
      <span style={dotStyle} />
      <span>{workflow.definition.id}</span>
      {doneCount > 0 && <span style={styles.counter}>({doneCount})</span>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 },
  col: { background: 'var(--av-bg-soft)', borderRadius: 6, padding: 10, minHeight: 220, border: '1px solid var(--av-border)' },
  colActive: { background: 'white', borderColor: 'var(--av-orange)', boxShadow: '0 0 0 2px rgba(238,100,25,.12)' },
  head: { fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--av-grey)', fontWeight: 600 },
  headActive: { color: 'var(--av-orange)' },
  title: { fontSize: 13, fontWeight: 700, color: 'var(--av-darker)', margin: '2px 0 10px' },
  step: { background: 'white', border: '1px solid var(--av-border)', borderRadius: 4, padding: '7px 9px', fontSize: 11, color: 'var(--av-text)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' },
  stepDone: { background: 'var(--status-done-bg)', borderColor: 'var(--status-done-border)', color: '#166534' },
  stepNext: { background: 'white', borderColor: 'var(--av-orange)', boxShadow: '0 0 0 1.5px var(--av-orange)', color: 'var(--av-darker)', fontWeight: 600 },
  stepSelected: { background: '#fff7ed' },
  dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  counter: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--av-grey)', marginLeft: 'auto' },
};
