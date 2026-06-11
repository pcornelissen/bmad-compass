import { useEffect, useState } from 'react';
import { useStore } from './state.js';
import { fetchState, fetchArtifact, connectWs } from './api.js';
import { Header } from './components/Header.js';
import { Hero } from './components/Hero.js';
import { SwimlaneMap } from './components/SwimlaneMap.js';
import { HelpersRow } from './components/HelpersRow.js';
import { SprintBoard } from './components/SprintBoard.js';
import { DependencyGraph } from './components/DependencyGraph.js';
import { StepDetailPanel } from './components/StepDetailPanel.js';
import { ArtifactList } from './components/ArtifactList.js';
import { ArtifactPreview } from './components/ArtifactPreview.js';

type TabId = 'map' | 'deps' | 'board' | 'artifacts';

export function App() {
  const { data, ui, setData, selectWorkflow, openPreview, closePreview, setWsOnline } = useStore();
  const [activeTab, setActiveTab] = useState<TabId>('map');

  useEffect(() => {
    fetchState().then(setData).catch(console.error);
    const disconnect = connectWs(
      (msg) => { if (msg.type === 'state') setData(msg.payload); },
      setWsOnline,
    );
    return disconnect;
  }, [setData, setWsOnline]);

  if (!data) return <div style={{ padding: 32 }}>Loading…</div>;

  const selected = data.workflows.find(w => w.definition.id === ui.selectedWorkflowId) ?? null;
  const storyCount = data.stories.filter(s => s.kind === 'story').length;
  const hasGraph = data.workflows.some(w => !w.definition.cross);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'map', label: 'Workflow-Map' },
    ...(hasGraph ? [{ id: 'deps' as const, label: 'Abhängigkeiten' }] : []),
    ...(storyCount > 0 ? [{ id: 'board' as const, label: `Sprint-Board (${storyCount})` }] : []),
    { id: 'artifacts', label: `Artefakte (${data.artifacts.length})` },
  ];
  // Guard against an active tab that's no longer available (e.g. stories disappeared).
  const active = tabs.some(t => t.id === activeTab) ? activeTab : tabs[0].id;

  const onOpenArtifact = async (path: string) => {
    try {
      const content = await fetchArtifact(path);
      openPreview(path, content);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header projectName={data.projectName} projectRoot={data.projectRoot} phase={data.currentPhase} wsOnline={ui.wsOnline} modules={data.modules ?? []} workflowSource={data.workflowSource ?? 'fallback'} />
      <main style={{ padding: '16px 18px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <Hero nextStep={data.nextStep} />

        <div style={styles.tabBar} role="tablist">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              onClick={() => setActiveTab(t.id)}
              style={{ ...styles.tab, ...(active === t.id ? styles.tabActive : {}) }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {active === 'map' && (
          <>
            <SwimlaneMap workflows={data.workflows} selectedId={ui.selectedWorkflowId} onSelect={selectWorkflow} currentPhase={data.currentPhase} />
            <HelpersRow workflows={data.workflows} selectedId={ui.selectedWorkflowId} onSelect={selectWorkflow} />
            {selected && <StepDetailPanel workflow={selected} onClose={() => selectWorkflow(null)} />}
          </>
        )}
        {active === 'deps' && <DependencyGraph workflows={data.workflows} />}
        {active === 'board' && <SprintBoard stories={data.stories} />}
        {active === 'artifacts' && <ArtifactList artifacts={data.artifacts} onOpen={onOpenArtifact} />}
      </main>
      <ArtifactPreview path={ui.previewArtifactPath} content={ui.previewContent} onClose={closePreview} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tabBar: { display: 'flex', gap: 4, borderBottom: '1px solid var(--av-border)', margin: '4px 0 16px' },
  tab: { background: 'none', border: 'none', borderBottom: '2px solid transparent', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--av-grey-mid)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 },
  tabActive: { color: 'var(--av-orange)', borderBottomColor: 'var(--av-orange)' },
};
