import type { Workflow, WorkflowStatus } from '../../shared/types.js';

const COL_W = 180;
const ROW_H = 58;
const NODE_W = 150;
const NODE_H = 38;
const PAD = 16;

interface Node { id: string; x: number; y: number; status: WorkflowStatus }
interface Edge { from: string; to: string }

function layout(workflows: Workflow[]): { nodes: Node[]; edges: Edge[]; width: number; height: number } {
  const graphWfs = workflows.filter(w => !w.definition.cross);
  const phases = [...new Set(graphWfs.map(w => w.definition.phase))].sort((a, b) => a - b);
  const colByPhase = new Map(phases.map((p, i) => [p, i]));

  const rowCursor = new Map<number, number>();
  const nodes: Node[] = [];
  const pos = new Map<string, Node>();
  for (const w of graphWfs) {
    const col = colByPhase.get(w.definition.phase)!;
    const row = rowCursor.get(col) ?? 0;
    rowCursor.set(col, row + 1);
    const node: Node = {
      id: w.definition.id,
      x: col * COL_W + PAD,
      y: row * ROW_H + PAD,
      status: w.status,
    };
    nodes.push(node);
    pos.set(node.id, node);
  }

  const edges: Edge[] = [];
  for (const w of graphWfs) {
    for (const req of w.definition.requires) {
      if (pos.has(req)) edges.push({ from: req, to: w.definition.id });
    }
  }

  const maxRows = Math.max(0, ...rowCursor.values());
  const width = phases.length * COL_W + BULGE;
  const height = maxRows * ROW_H + PAD;
  return { nodes, edges, width, height };
}

/** How far same-column edges bulge into the right gutter to route around the boxes. */
const BULGE = 18;

/** Forward edge between columns: a gentle S-curve from source right edge to target left edge. */
function routeAcross(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

/** Same-column edge: bulge out into the right gutter and back, so it wraps around the boxes. */
function routeAround(rightX: number, y1: number, y2: number): string {
  const bx = rightX + BULGE;
  return `M ${rightX} ${y1} C ${bx} ${y1}, ${bx} ${y2}, ${rightX} ${y2}`;
}

const FILL: Record<string, { fill: string; stroke: string; text: string }> = {
  done: { fill: 'var(--status-done-bg)', stroke: 'var(--status-done-border)', text: '#166534' },
  'in-progress': { fill: '#fff7ed', stroke: 'var(--av-orange)', text: 'var(--av-darker)' },
};
const DEFAULT_FILL = { fill: 'white', stroke: 'var(--av-border)', text: 'var(--av-text)' };

export function DependencyGraph({ workflows }: { workflows: Workflow[] }) {
  const { nodes, edges, width, height } = layout(workflows);
  if (nodes.length === 0) return null;
  const byId = new Map(nodes.map(n => [n.id, n]));

  return (
    <div style={{ width: '100%', overflowX: 'auto', marginBottom: 18 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ maxWidth: '100%', height: 'auto', minWidth: Math.min(width, 560) }}
        role="img"
        aria-label="Workflow dependency graph"
      >
        <defs>
          <marker id="dep-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L8,4 L0,8 z" fill="var(--av-grey)" />
          </marker>
        </defs>
        {edges.map(e => {
          const a = byId.get(e.from)!;
          const b = byId.get(e.to)!;
          const sameColumn = a.x === b.x;
          // Same-column (vertically stacked) deps would otherwise cut straight through the
          // boxes; route them out through the right gutter so they curve around instead.
          const d = sameColumn
            ? routeAround(a.x + NODE_W, a.y + NODE_H / 2, b.y + NODE_H / 2)
            : routeAcross(a.x + NODE_W, a.y + NODE_H / 2, b.x, b.y + NODE_H / 2);
          return (
            <path
              key={`${e.from}->${e.to}`}
              data-testid="dep-edge"
              data-from={e.from}
              data-to={e.to}
              d={d}
              fill="none"
              stroke="var(--av-grey)"
              strokeWidth={1.2}
              markerEnd="url(#dep-arrow)"
              opacity={0.6}
            />
          );
        })}
        {nodes.map(n => {
          const c = FILL[n.status] ?? DEFAULT_FILL;
          return (
            <g key={n.id} data-testid="dep-node" data-id={n.id} transform={`translate(${n.x},${n.y})`}>
              <rect width={NODE_W} height={NODE_H} rx={4} fill={c.fill} stroke={c.stroke} strokeWidth={n.status === 'in-progress' ? 1.6 : 1} />
              <text x={NODE_W / 2} y={NODE_H / 2} dominantBaseline="middle" textAnchor="middle" fontSize={10.5} fill={c.text} fontFamily="var(--font-sans)">
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
