import type { Artifact } from '../../shared/types.js';

export function ArtifactList({ artifacts, onOpen }: { artifacts: Artifact[]; onOpen: (path: string) => void }) {
  if (artifacts.length === 0) {
    return <div style={styles.empty}>No artifacts yet.</div>;
  }
  return (
    <div style={styles.list}>
      {artifacts.map(a => (
        <div key={a.path} style={styles.row} onClick={() => onOpen(a.path)} role="button" tabIndex={0}>
          <span style={styles.dot} />
          <span style={styles.name}>{a.displayName}</span>
          <span style={styles.path}>{a.path}</span>
          <span style={styles.meta}>{formatAge(a.mtime)} · {formatSize(a.sizeBytes)}</span>
        </div>
      ))}
    </div>
  );
}

function formatAge(ms: number): string {
  const delta = Date.now() - ms;
  const m = Math.floor(delta / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles: Record<string, React.CSSProperties> = {
  list: { border: '1px solid var(--av-border)', borderRadius: 6, background: 'white' },
  row: { display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--av-border)', fontSize: 11, cursor: 'pointer' },
  dot: { width: 8, height: 8, borderRadius: '50%', marginRight: 10, background: 'var(--status-done)' },
  name: { color: 'var(--av-darker)', flex: 1, fontWeight: 500 },
  path: { color: 'var(--av-grey)', fontFamily: 'var(--font-mono)', fontSize: 10, marginRight: 12 },
  meta: { color: 'var(--av-grey)', fontFamily: 'var(--font-mono)', fontSize: 10 },
  empty: { padding: 16, color: 'var(--av-grey)', textAlign: 'center', background: 'white', border: '1px solid var(--av-border)', borderRadius: 6 },
};
