import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ArtifactPreview({ path, content, onClose }: {
  path: string | null; content: string | null; onClose: () => void;
}) {
  if (!path) return null;
  const filename = path.split('/').pop();
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.drawer} onClick={e => e.stopPropagation()}>
        <div style={styles.head}>
          <span style={styles.filename}>{filename}</span>
          <button onClick={onClose} aria-label="close" style={styles.close}>✕</button>
        </div>
        <div style={styles.body}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content ?? ''}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(48,62,79,.5)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 },
  drawer: { background: 'white', width: 'min(640px, 100%)', height: '100%', display: 'flex', flexDirection: 'column' },
  head: { background: 'var(--av-dark)', color: 'white', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  filename: { fontFamily: 'var(--font-mono)', fontSize: 12 },
  close: { background: 'transparent', border: 0, color: 'white', fontSize: 16 },
  body: { padding: '14px 16px', fontSize: 13, color: 'var(--av-text)', overflowY: 'auto', flex: 1 },
};
