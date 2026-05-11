import { useEffect } from 'react';
import { useStore } from './state.js';
import { fetchState, fetchArtifact, connectWs } from './api.js';
import { Header } from './components/Header.js';
import { Hero } from './components/Hero.js';
import { SwimlaneMap } from './components/SwimlaneMap.js';
import { StepDetailPanel } from './components/StepDetailPanel.js';
import { ArtifactList } from './components/ArtifactList.js';
import { ArtifactPreview } from './components/ArtifactPreview.js';

export function App() {
  const { data, ui, setData, selectWorkflow, openPreview, closePreview, setWsOnline } = useStore();

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
      <Header projectName={data.projectName} projectRoot={data.projectRoot} phase={data.currentPhase} wsOnline={ui.wsOnline} />
      <main style={{ padding: '16px 18px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <Hero nextStep={data.nextStep} />
        <SectionLabel>Workflow-Map</SectionLabel>
        <SwimlaneMap workflows={data.workflows} selectedId={ui.selectedWorkflowId} onSelect={selectWorkflow} currentPhase={data.currentPhase} />
        {selected && <StepDetailPanel workflow={selected} onClose={() => selectWorkflow(null)} />}
        <SectionLabel>Artefakte <span style={{ color: 'var(--av-grey)', fontWeight: 400 }}>({data.artifacts.length})</span></SectionLabel>
        <ArtifactList artifacts={data.artifacts} onOpen={onOpenArtifact} />
      </main>
      <ArtifactPreview path={ui.previewArtifactPath} content={ui.previewContent} onClose={closePreview} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--av-grey-mid)', fontWeight: 700, marginBottom: 8 }}>{children}</div>;
}
