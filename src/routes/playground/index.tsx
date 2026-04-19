import { component$, useStore, $, useVisibleTask$, useSignal, noSerialize } from "@builder.io/qwik";
import PlaygroundCanvas from "../../components/playground-canvas/playground-canvas";

export interface Place { id: string; name: string; tokens: number; x: number; y: number; }
export interface Transition { id: string; name: string; x: number; y: number; }
export interface Arc { from: string; to: string; }

export default component$(() => {
  const playgroundState = useStore({
    places: [] as Place[],
    transitions: [] as Transition[],
    arcs: [] as Arc[],
    selectedIds: [] as string[],
    history: [] as any[],
    camera: { x: 0, y: 0, zoom: 1 },
    nextPId: 1,
    nextTId: 1,
    nextId: 1,
    isLoaded: false
  });

  const saveToLocal = $(() => {
    localStorage.setItem('petri_playground_data', JSON.stringify({
      places: playgroundState.places,
      transitions: playgroundState.transitions,
      arcs: playgroundState.arcs,
      camera: playgroundState.camera,
      nextPId: playgroundState.nextPId,
      nextTId: playgroundState.nextTId,
      nextId: playgroundState.nextId
    }));
  });

  useVisibleTask$(() => {
    const saved = localStorage.getItem('petri_playground_data');
    if (saved) {
      const data = JSON.parse(saved);
      playgroundState.places = data.places || [];
      playgroundState.transitions = data.transitions || [];
      playgroundState.arcs = data.arcs || [];
      if (data.camera) playgroundState.camera = data.camera;
      playgroundState.nextPId = data.nextPId || 1;
      playgroundState.nextTId = data.nextTId || 1;
      playgroundState.nextId = data.nextId || 1;
    }
    playgroundState.isLoaded = true;
  });

  useVisibleTask$(({ track }) => {
    track(() => playgroundState.places);
    track(() => playgroundState.transitions);
    track(() => playgroundState.arcs);
    track(() => playgroundState.camera);
    saveToLocal();
  });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a1a', color: '#eee', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>

      {/* WORKSPACE ENGINE */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <main style={{ flex: 1, background: '#111', position: 'relative' }}>
          {playgroundState.isLoaded && <PlaygroundCanvas sharedState={playgroundState} />}
        </main>
      </div>

      <div class="grain-overlay" style={{ opacity: 0.1 }}></div>
    </div>
  );
});
