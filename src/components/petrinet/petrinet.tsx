import { component$, useStore, $, useVisibleTask$, useSignal } from "@builder.io/qwik";

interface Place { id: string; name: string; tokens: number; x: number; y: number; }
interface Transition { id: string; name: string; x: number; y: number; }
interface Arc { from: string; to: string; }
interface MovingToken { id: string; fromX: number; fromY: number; toX: number; toY: number; progress: number; targetPlaceId?: string; isPhaseTwo: boolean; tId: string; }

interface PetrinetProps {
  initialPlaces?: Place[];
  initialTransitions?: Transition[];
  initialArcs?: Arc[];
  label?: string;
  height?: string;
}

export default component$((props: PetrinetProps) => {
  const canvasRef = useSignal<HTMLCanvasElement>();
  
  const initialState = {
    places: props.initialPlaces || [
      { id: "p1", name: "Source", tokens: 3, x: 100, y: 150 },
      { id: "p2", name: "Buffer", tokens: 0, x: 300, y: 150 },
      { id: "p3", name: "Sink", tokens: 0, x: 500, y: 150 },
    ],
    transitions: props.initialTransitions || [
      { id: "t1", name: "Process A", x: 200, y: 150 },
      { id: "t2", name: "Process B", x: 400, y: 150 },
    ],
    arcs: props.initialArcs || [
      { from: "p1", to: "t1" },
      { from: "t1", to: "p2" },
      { from: "p2", to: "t2" },
      { from: "t2", to: "p3" },
    ],
  };

  const state = useStore({
    places: JSON.parse(JSON.stringify(initialState.places)) as Place[],
    transitions: initialState.transitions as Transition[],
    arcs: initialState.arcs as Arc[],
    history: [] as Place[][],
    shake: 0,
    triggerParticles: null as { x: number, y: number, color: string } | null,
    movingTokens: [] as MovingToken[],
    isDark: false
  });

  const getEnabledTransitions = $(() => {
    return state.transitions.filter(t => {
      const inputPlaces = state.arcs.filter(a => a.to === t.id).map(a => a.from);
      return inputPlaces.every(pId => {
        const place = state.places.find(p => p.id === pId);
        return place && place.tokens > 0;
      });
    });
  });

  const fireTransition = $((tId: string) => {
    const transition = state.transitions.find(t => t.id === tId);
    if (!transition) return;
    const transitionArcs = state.arcs.filter(a => a.to === tId || a.from === tId);
    const inputPlaceIds = transitionArcs.filter(a => a.to === tId).map(a => a.from);
    const outputPlaceIds = transitionArcs.filter(a => a.from === tId).map(a => a.to);
    const isEnabled = inputPlaceIds.every(pId => (state.places.find(p => p.id === pId)?.tokens || 0) > 0);

    if (isEnabled) {
      state.history = [...state.history, JSON.parse(JSON.stringify(state.places))];
      state.places = state.places.map(p => inputPlaceIds.includes(p.id) ? { ...p, tokens: p.tokens - 1 } : p);
      inputPlaceIds.forEach(pId => {
        const p = state.places.find(pl => pl.id === pId);
        if (p) {
          state.movingTokens = [...state.movingTokens, {
            id: Math.random().toString(),
            fromX: p.x, fromY: p.y, toX: transition.x, toY: transition.y,
            progress: 0, isPhaseTwo: false, tId: tId
          }];
        }
      });
      state.shake = 5;
    } else {
      state.shake = 5;
    }
  });

  const stepNext = $(async () => {
    const enabled = await getEnabledTransitions();
    if (enabled.length > 0) await fireTransition(enabled[Math.floor(Math.random() * enabled.length)].id);
  });

  const stepPrev = $(() => {
    if (state.history.length > 0) {
      state.places = state.history[state.history.length - 1];
      state.history = state.history.slice(0, -1);
      state.movingTokens = [];
    }
  });

  const resetNet = $(() => {
    state.places = JSON.parse(JSON.stringify(initialState.places));
    state.history = [];
    state.movingTokens = [];
  });

  useVisibleTask$(({ cleanup }) => {
    if (!canvasRef.value) return;
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles = [] as { x: number, y: number, vx: number, vy: number, life: number, color: string }[];

    // Theme Tracking
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    state.isDark = mediaQuery.matches;
    const themeListener = (e: MediaQueryListEvent) => { state.isDark = e.matches; };
    mediaQuery.addEventListener('change', themeListener);

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(rect.width / 600, rect.height / 300);

      // Theme-aware colors
      const colors = state.isDark ? {
        arc: "rgba(255,255,255,0.15)",
        nodeFill: "#111",
        nodeBorder: "#eee",
        nodeText: "#888",
        transFill: "#222",
        transEnabled: "#006c84"
      } : {
        arc: "rgba(0,0,0,0.15)",
        nodeFill: "#fff",
        nodeBorder: "#111",
        nodeText: "#666",
        transFill: "#eee",
        transEnabled: "#006c84"
      };
      
      for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.02; if (p.life <= 0) particles.splice(i, 1); }
      if (state.triggerParticles) { for (let i = 0; i < 30; i++) particles.push({ x: state.triggerParticles.x, y: state.triggerParticles.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 1.0, color: state.triggerParticles.color }); state.triggerParticles = null; }
      const finishedTokens = [] as string[];
      state.movingTokens = state.movingTokens.map(mt => { const nextProgress = mt.progress + 0.04; if (nextProgress >= 1) { finishedTokens.push(mt.id); return { ...mt, progress: 1 }; } return { ...mt, progress: nextProgress }; });
      finishedTokens.forEach(tokenId => {
        const mt = state.movingTokens.find(t => t.id === tokenId);
        if (!mt) return;
        if (!mt.isPhaseTwo) {
          state.triggerParticles = { x: mt.toX, y: mt.toY, color: '#ff4f9a' }; state.shake = 8; state.movingTokens = state.movingTokens.filter(t => t.id !== tokenId);
          const outputPlaceIds = state.arcs.filter(a => a.from === mt.tId).map(a => a.to);
          outputPlaceIds.forEach(pId => { const dest = state.places.find(pl => pl.id === pId); if (dest) state.movingTokens = [...state.movingTokens, { id: Math.random().toString(), fromX: mt.toX, fromY: mt.toY, toX: dest.x, toY: dest.y, progress: 0, isPhaseTwo: true, tId: mt.tId, targetPlaceId: pId }]; });
        } else { state.places = state.places.map(p => p.id === mt.targetPlaceId ? { ...p, tokens: p.tokens + 1 } : p); state.movingTokens = state.movingTokens.filter(t => t.id !== tokenId); }
      });
      let offsetX = 0; let offsetY = 0; if (state.shake > 0) { offsetX = (Math.random() - 0.5) * state.shake; offsetY = (Math.random() - 0.5) * state.shake; state.shake *= 0.9; if (state.shake < 0.1) state.shake = 0; }
      ctx.save(); ctx.scale(dpr, dpr); ctx.translate((rect.width - 600 * scale) / 2, (rect.height - 300 * scale) / 2); ctx.scale(scale, scale); ctx.translate(offsetX, offsetY);
      const strokeW = 2 / scale; const fontS = 8 / scale;

      // DRAW ARCS
      state.arcs.forEach(arc => {
        const from = state.places.find(p => p.id === arc.from) || state.transitions.find(t => t.id === arc.from);
        const to = state.places.find(p => p.id === arc.to) || state.transitions.find(t => t.id === arc.to);
        if (from && to) {
          ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = colors.arc; ctx.lineWidth = 1.5 / scale; ctx.stroke();
          const angle = Math.atan2(to.y - from.y, to.x - from.x); const arrowX = to.x - 20 * Math.cos(angle); const arrowY = to.y - 20 * Math.sin(angle);
          ctx.beginPath(); ctx.moveTo(arrowX, arrowY); ctx.lineTo(arrowX - 8 * Math.cos(angle - 0.5), arrowY - 8 * Math.sin(angle - 0.5)); ctx.lineTo(arrowX - 8 * Math.cos(angle + 0.5), arrowY - 8 * Math.sin(angle + 0.5));
          ctx.fillStyle = colors.arc; ctx.fill();
        }
      });
      // DRAW PLACES
      state.places.forEach(place => {
        ctx.beginPath(); ctx.arc(place.x, place.y, 20, 0, Math.PI * 2); ctx.fillStyle = colors.nodeFill; ctx.fill(); ctx.strokeStyle = colors.nodeBorder; ctx.lineWidth = strokeW; ctx.stroke();
        if (place.tokens > 0) {
          ctx.save(); ctx.globalCompositeOperation = state.isDark ? "screen" : "multiply";
          ctx.beginPath(); ctx.arc(place.x, place.y, 10, 0, Math.PI * 2); ctx.fillStyle = "#ff4f9a"; ctx.fill();
          ctx.restore();
          if (place.tokens > 1) { ctx.fillStyle = "#fff"; ctx.font = `bold ${12 / scale}px Inter`; ctx.textAlign = "center"; ctx.fillText(place.tokens.toString(), place.x, place.y + (4 / scale)); }
        }
        ctx.fillStyle = colors.nodeText; ctx.font = `${fontS}px Inter`; ctx.textAlign = "center"; ctx.fillText(place.name, place.x, place.y + (35 / scale));
      });
      // DRAW TRANSITIONS
      state.transitions.forEach(trans => {
        const isEnabled = state.arcs.filter(a => a.to === trans.id).map(a => a.from).every(pId => (state.places.find(p => p.id === pId)?.tokens || 0) > 0);
        ctx.fillStyle = isEnabled ? colors.transEnabled : colors.transFill; ctx.fillRect(trans.x - 20, trans.y - 20, 40, 40); ctx.strokeStyle = colors.nodeBorder; ctx.lineWidth = strokeW; ctx.strokeRect(trans.x - 20, trans.y - 20, 40, 40);
        ctx.fillStyle = "var(--color-riso-pink)"; ctx.font = `${fontS}px Inter`; ctx.textAlign = "center"; ctx.fillText(trans.name, trans.x, trans.y + (50 / scale));
      });
      // DRAW MOVING TOKENS
      state.movingTokens.forEach(mt => { const curX = mt.fromX + (mt.toX - mt.fromX) * mt.progress; const curY = mt.fromY + (mt.toY - mt.fromY) * mt.progress; ctx.save(); ctx.globalCompositeOperation = state.isDark ? "screen" : "multiply"; ctx.beginPath(); ctx.arc(curX, curY, 10, 0, Math.PI * 2); ctx.fillStyle = "#ff4f9a"; ctx.fill(); ctx.restore(); });
      particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 2, 2); });
      ctx.globalAlpha = 1; ctx.restore(); animationId = requestAnimationFrame(render);
    };
    render(); cleanup(() => { cancelAnimationFrame(animationId); mediaQuery.removeEventListener('change', themeListener); });
  });

  const handleCanvasClick = $((e: MouseEvent) => {
    if (!canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    const scale = Math.min(rect.width / 600, rect.height / 300);
    const cX = (rect.width - 600 * scale) / 2; const cY = (rect.height - 300 * scale) / 2;
    const x = (e.clientX - rect.left - cX) / scale; const y = (e.clientY - rect.top - cY) / scale;
    state.transitions.forEach(trans => { if (x >= trans.x - 25 && x <= trans.x + 25 && y >= trans.y - 25 && y <= trans.y + 25) fireTransition(trans.id); });
  });

  return (
    <div class="canvas-block reveal" style={{ 
      height: props.height || '400px', width: '100%', display: 'flex', flexDirection: 'column',
      border: '2px solid var(--color-ui-border)', background: 'var(--color-bg-app)', overflow: 'hidden'
    }}>
      <div class="metadata" style={{ padding: '10px', borderBottom: '1px solid var(--color-ui-border)', background: 'var(--color-bg-canvas)', color: 'var(--color-text)', opacity: 0.8 }}>
        {props.label || 'System.Architecture // Logic.Sim'}
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--color-bg-canvas)' }}>
        <canvas ref={canvasRef} onMouseDown$={handleCanvasClick} style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }} />
      </div>
      <div style={{ display: 'flex', borderTop: '2px solid var(--color-ui-border)', background: 'var(--color-bg-canvas)', height: '48px', flexShrink: 0 }}>
        <button onClick$={stepPrev} disabled={state.history.length === 0} style={{ flex: 1, padding: '10px', border: 'none', borderRight: '2px solid var(--color-ui-border)', background: 'none', cursor: 'pointer', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: 'var(--color-text)', opacity: state.history.length === 0 ? 0.2 : 0.8 }}>Previous</button>
        <button onClick$={resetNet} style={{ flex: 1, padding: '10px', border: 'none', borderRight: '2px solid var(--color-ui-border)', background: 'none', cursor: 'pointer', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: 'var(--color-text)', opacity: 0.8 }}>Reset</button>
        <button onClick$={stepNext} style={{ flex: 1, padding: '10px', border: 'none', background: 'var(--color-riso-pink)', color: 'white', cursor: 'pointer', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}>Next Step</button>
      </div>
    </div>
  );
});
