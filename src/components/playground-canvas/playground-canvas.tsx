import { component$, useStore, $, useVisibleTask$, useSignal } from "@builder.io/qwik";
import { Place, Transition, Arc } from "../../routes/playground/index";

interface MovingToken { id: string; fromX: number; fromY: number; toX: number; toY: number; progress: number; targetPlaceId?: string; isPhaseTwo: boolean; tId: string; }

export default component$((props: { sharedState: any }) => {
  const canvasRef = useSignal<HTMLCanvasElement>();
  const state = useStore({
    shake: 0,
    triggerParticles: null as { x: number, y: number, color: string } | null,
    movingTokens: [] as MovingToken[],
    mode: 'select' as 'place' | 'transition' | 'arc' | 'token' | 'select' | 'delete' | 'pan',
    isPanning: false,
    isSimulating: false,
    dragStartMouse: { x: 0, y: 0 },
    dragStartNodes: [] as { id: string, x: number, y: number, type: 'place' | 'transition' }[],
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
    currentMouseWorld: { x: 0, y: 0 },
    arcStartId: null as string | null,
    marqueeStart: null as { x: number, y: number } | null,
    marqueeEnd: null as { x: number, y: number } | null,
    nodeScales: {} as Record<string, number>,
    time: 0,
    hoveredTool: null as string | null,
    tokenInterval: null as any,
    tokenTimeout: null as any,
    alignmentGuides: { x: [] as number[], y: [] as number[] },
    clipboard: null as { places: Place[], transitions: Transition[], arcs: Arc[] } | null,
    isRecording: false,
    recorder: null as any,
    chunks: [] as Blob[],
    showExportMenu: false,
    isDark: false
  });

  const ss = props.sharedState;

  const getEnabledTransitions = $(() => {
    return ss.transitions.filter((t: Transition) => {
      const inputArcs = ss.arcs.filter((a: Arc) => a.to === t.id);
      if (inputArcs.length === 0) return false;
      return inputArcs.every((a: Arc) => (ss.places.find((p: Place) => p.id === a.from)?.tokens || 0) > 0);
    });
  });

  const fireTransition = $((tId: string) => {
    const t = ss.transitions.find((tr: Transition) => tr.id === tId);
    if (!t) return;
    const inputArcs = ss.arcs.filter((a: Arc) => a.to === tId);
    if (inputArcs.length > 0 && inputArcs.every((a: Arc) => (ss.places.find((p: Place) => p.id === a.from)?.tokens || 0) > 0)) {
      inputArcs.forEach((a: Arc) => {
        ss.places = ss.places.map((p: Place) => p.id === a.from ? { ...p, tokens: p.tokens - 1 } : p);
        const p = ss.places.find((pl: Place) => pl.id === a.from);
        if (p) state.movingTokens = [...state.movingTokens, { id: Math.random().toString(), fromX: p.x, fromY: p.y, toX: t.x, toY: t.y, progress: 0, isPhaseTwo: false, tId: tId }];
      });
      state.nodeScales[tId] = 1.3;
    }
  });

  const startRecording = $(() => {
    if (!canvasRef.value) return;
    const stream = canvasRef.value.captureStream(60);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    state.chunks = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) state.chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(state.chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `petri_sim_${Date.now()}.webm`; a.click();
      URL.revokeObjectURL(url);
    };
    mediaRecorder.start();
    state.recorder = mediaRecorder; state.isRecording = true; state.isSimulating = true; state.showExportMenu = false;
  });

  const stopRecording = $(() => { if (state.recorder) { state.recorder.stop(); state.isRecording = false; } });

  const handleMouseDown = $((e: MouseEvent) => {
    if (!canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    const mX = e.clientX - rect.left; const mY = e.clientY - rect.top;
    const wX = (mX - rect.width / 2 - ss.camera.x) / ss.camera.zoom;
    const wY = (mY - rect.height / 2 - ss.camera.y) / ss.camera.zoom;
    state.lastMouse = { x: mX, y: mY };
    if (e.button === 1 || state.mode === 'pan' || (state.mode === 'select' && e.altKey)) { state.isPanning = true; return; }
    const clickedP = ss.places.find((p: Place) => {
      const sX = p.x * ss.camera.zoom + ss.camera.x + rect.width / 2;
      const sY = p.y * ss.camera.zoom + ss.camera.y + rect.height / 2;
      return Math.sqrt((sX - mX)**2 + (sY - mY)**2) < 25;
    });
    const clickedT = ss.transitions.find((t: Transition) => {
      const sX = t.x * ss.camera.zoom + ss.camera.x + rect.width / 2;
      const sY = t.y * ss.camera.zoom + ss.camera.y + rect.height / 2;
      return Math.abs(sX - mX) < 25 && Math.abs(sY - mY) < 25;
    });
    if (state.mode === 'delete' && (clickedP || clickedT)) {
      if (clickedP) { ss.places = ss.places.filter((p: Place) => p.id !== clickedP.id); ss.arcs = ss.arcs.filter((a: Arc) => a.from !== clickedP.id && a.to !== clickedP.id); }
      else { ss.transitions = ss.transitions.filter((t: Transition) => t.id !== clickedT.id); ss.arcs = ss.arcs.filter((a: Arc) => a.from !== clickedT.id && a.to !== clickedT.id); }
      return;
    }
    if (state.mode === 'place' && !clickedP && !clickedT) {
      const id = `p${ss.nextPId++}`;
      ss.places = [...ss.places, { id, name: id, tokens: 0, x: Math.round(wX/10)*10, y: Math.round(wY/10)*10 }];
      state.nodeScales[id] = 0;
    } else if (state.mode === 'transition' && !clickedP && !clickedT) {
      const id = `t${ss.nextTId++}`;
      ss.transitions = [...ss.transitions, { id, name: id, x: Math.round(wX/10)*10, y: Math.round(wY/10)*10 }];
      state.nodeScales[id] = 0;
    } else if (state.mode === 'token' && clickedP) {
      const delta = (e.ctrlKey || e.metaKey) ? -1 : 1;
      const updateTokens = () => { ss.places = ss.places.map((p: Place) => p.id === clickedP.id ? { ...p, tokens: Math.max(0, p.tokens + delta) } : p); state.nodeScales[clickedP.id] = delta > 0 ? 1.2 : 0.8; };
      updateTokens();
      state.tokenTimeout = setTimeout(() => { state.tokenInterval = setInterval(updateTokens, 100); }, 400);
    } else if (state.mode === 'arc') {
      const cid = clickedP?.id || clickedT?.id;
      if (cid) {
        if (!state.arcStartId) state.arcStartId = cid;
        else {
          const sIsP = ss.places.some((p: Place) => p.id === state.arcStartId);
          const eIsP = ss.places.some((p: Place) => p.id === cid);
          if (sIsP !== eIsP && state.arcStartId !== cid) { if (!ss.arcs.some((a: Arc) => a.from === state.arcStartId && a.to === cid)) ss.arcs = [...ss.arcs, { from: state.arcStartId!, to: cid }]; }
          state.arcStartId = null;
        }
      } else { state.arcStartId = null; }
    } else if (state.mode === 'select') {
      const node = clickedP || clickedT;
      if (node) {
        if (!ss.selectedIds.includes(node.id)) ss.selectedIds = [node.id];
        state.isDragging = true; state.dragStartMouse = { x: wX, y: wY };
        state.dragStartNodes = ss.selectedIds.map((id: string) => {
          const p = ss.places.find((pl: Place) => pl.id === id);
          if (p) return { id: p.id, x: p.x, y: p.y, type: 'place' as const };
          const t = ss.transitions.find((tr: Transition) => tr.id === id);
          return { id: t!.id, x: t!.x, y: t!.y, type: 'transition' as const };
        });
      } else {
        let hitArc = null;
        for (const arc of ss.arcs) {
          const from = ss.places.find((p: Place) => p.id === arc.from) || ss.transitions.find((t: Transition) => t.id === arc.from);
          const to = ss.places.find((p: Place) => p.id === arc.to) || ss.transitions.find((t: Transition) => t.id === arc.to);
          if (from && to) {
             const dx = to.x - from.x; const dy = to.y - from.y; const len2 = dx*dx + dy*dy; const t = Math.max(0, Math.min(1, ((wX - from.x) * dx + (wY - from.y) * dy) / len2));
             const pX = from.x + t * dx; const pY = from.y + t * dy; const dist = Math.sqrt((wX - pX)**2 + (wY - pY)**2);
             if (dist < 10 / ss.camera.zoom) { hitArc = `arc_${arc.from}_${arc.to}`; break; }
          }
        }
        if (hitArc) ss.selectedIds = [hitArc]; else { ss.selectedIds = []; state.marqueeStart = { x: wX, y: wY }; state.marqueeEnd = { x: wX, y: wY }; }
      }
    }
  });

  const handleMouseMove = $((e: MouseEvent) => {
    if (!canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    const mX = e.clientX - rect.left; const mY = e.clientY - rect.top;
    const wX = (mX - rect.width / 2 - ss.camera.x) / ss.camera.zoom;
    const wY = (mY - rect.height / 2 - ss.camera.y) / ss.camera.zoom;
    state.currentMouseWorld = { x: wX, y: wY };
    const dx = mX - state.lastMouse.x; const dy = mY - state.lastMouse.y;
    if (state.isPanning) { ss.camera.x += dx; ss.camera.y += dy; }
    else if (state.isDragging) {
      const dWX = wX - state.dragStartMouse.x; const dWY = wY - state.dragStartMouse.y;
      state.alignmentGuides = { x: [], y: [] };
      state.dragStartNodes.forEach(dn => {
        const nX = Math.round((dn.x + dWX) / 10) * 10; const nY = Math.round((dn.y + dWY) / 10) * 10;
        [...ss.places, ...ss.transitions].forEach(other => {
          if (ss.selectedIds.includes(other.id)) return;
          if (nX === other.x) if (!state.alignmentGuides.x.includes(nX)) state.alignmentGuides.x.push(nX);
          if (nY === other.y) if (!state.alignmentGuides.y.includes(nY)) state.alignmentGuides.y.push(nY);
        });
        if (dn.type === 'place') ss.places = ss.places.map((p: Place) => p.id === dn.id ? { ...p, x: nX, y: nY } : p);
        else ss.transitions = ss.transitions.map((t: Transition) => t.id === dn.id ? { ...t, x: nX, y: nY } : t);
      });
    } else if (state.marqueeStart) state.marqueeEnd = { x: wX, y: wY };
    state.lastMouse = { x: mX, y: mY };
  });

  const handleMouseUp = $(() => {
    if (state.tokenTimeout) { clearTimeout(state.tokenTimeout); state.tokenTimeout = null; }
    if (state.tokenInterval) { clearInterval(state.tokenInterval); state.tokenInterval = null; }
    state.alignmentGuides = { x: [], y: [] };
    if (state.marqueeStart && state.marqueeEnd) {
      const minX = Math.min(state.marqueeStart.x, state.marqueeEnd.x); const maxX = Math.max(state.marqueeStart.x, state.marqueeEnd.x);
      const minY = Math.min(state.marqueeStart.y, state.marqueeEnd.y); const maxY = Math.max(state.marqueeStart.y, state.marqueeEnd.y);
      const selected: string[] = [];
      ss.places.forEach((p: Place) => { if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) selected.push(p.id); });
      ss.transitions.forEach((t: Transition) => { if (t.x >= minX && t.x <= maxX && t.y >= minY && t.y <= maxY) selected.push(t.id); });
      if (selected.length > 0) ss.selectedIds = selected;
    }
    state.isPanning = false; state.isDragging = false; state.marqueeStart = null; state.marqueeEnd = null;
  });

  const handleWheel = $((e: WheelEvent) => {
    e.preventDefault(); if (!canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    const mX = e.clientX - rect.left; const mY = e.clientY - rect.top;
    const wX = (mX - rect.width / 2 - ss.camera.x) / ss.camera.zoom;
    const wY = (mY - rect.height / 2 - ss.camera.y) / ss.camera.zoom;
    const factor = Math.pow(1.1, -e.deltaY / 100);
    const newZoom = Math.max(0.1, Math.min(10, ss.camera.zoom * factor));
    ss.camera.x = mX - rect.width / 2 - wX * newZoom; ss.camera.y = mY - rect.height / 2 - wY * newZoom; ss.camera.zoom = newZoom;
  });

  useVisibleTask$(({ cleanup }) => {
    if (!canvasRef.value) return;
    const canvas = canvasRef.value; const ctx = canvas.getContext('2d'); if (!ctx) return;
    let animationId: number; const particles = [] as any[];
    
    // Theme Tracking
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    state.isDark = mediaQuery.matches;
    const themeListener = (e: MediaQueryListEvent) => { state.isDark = e.matches; };
    mediaQuery.addEventListener('change', themeListener);

    const simInterval = setInterval(async () => { if (!state.isSimulating) return; const enabled = await getEnabledTransitions(); if (enabled.length > 0) { enabled.forEach((t: Transition) => fireTransition(t.id)); } }, 400);
    
    (window as any).dispatchExport = () => { state.showExportMenu = !state.showExportMenu; };

    const copyToClipboard = () => {
      const selPlaces = ss.places.filter((p: Place) => ss.selectedIds.includes(p.id));
      const selTransitions = ss.transitions.filter((t: Transition) => ss.selectedIds.includes(t.id));
      const selArcs = ss.arcs.filter((a: Arc) => ss.selectedIds.includes(a.from) && ss.selectedIds.includes(a.to));
      if (selPlaces.length > 0 || selTransitions.length > 0) {
        state.clipboard = JSON.parse(JSON.stringify({ places: selPlaces, transitions: selTransitions, arcs: selArcs }));
      }
    };

    const pasteFromClipboard = () => {
      if (!state.clipboard) return;
      const idMap: Record<string, string> = {};
      const newPlaces = state.clipboard.places.map((p: Place) => {
        const newId = `p${ss.nextPId++}`; idMap[p.id] = newId;
        return { ...p, id: newId, name: newId, x: p.x + 40, y: p.y + 40 };
      });
      const newTransitions = state.clipboard.transitions.map((t: Transition) => {
        const newId = `t${ss.nextTId++}`; idMap[t.id] = newId;
        return { ...t, id: newId, name: newId, x: t.x + 40, y: t.y + 40 };
      });
      const newArcs = state.clipboard.arcs.map((a: Arc) => ({ from: idMap[a.from], to: idMap[a.to] }));
      ss.places = [...ss.places, ...newPlaces]; ss.transitions = [...ss.transitions, ...newTransitions]; ss.arcs = [...ss.arcs, ...newArcs];
      ss.selectedIds = [...newPlaces.map(p => p.id), ...newTransitions.map(t => t.id)];
    };

    const handleKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (k === 'c') { e.preventDefault(); copyToClipboard(); }
        else if (k === 'v') { e.preventDefault(); pasteFromClipboard(); }
        else if (k === 'x') { e.preventDefault(); copyToClipboard(); ss.places = ss.places.filter((p: Place) => !ss.selectedIds.includes(p.id)); ss.transitions = ss.transitions.filter((t: Transition) => !ss.selectedIds.includes(t.id)); ss.arcs = ss.arcs.filter((a: Arc) => !ss.selectedIds.includes(a.from) && !ss.selectedIds.includes(a.to)); ss.selectedIds = []; }
        return;
      }
      if (k === 'v' || k === 'escape') { state.mode = 'select'; state.arcStartId = null; } else if (k === 'h') state.mode = 'pan'; else if (k === 'o' || k === 'p') state.mode = 'place';
      else if (k === 'r' || k === 't') state.mode = 'transition'; else if (k === 'l' || k === 'a') state.mode = 'arc'; else if (k === 'k') state.mode = 'token';
      else if (k === 'backspace' || k === 'delete') {
        if (ss.selectedIds.length > 0) {
          ss.places = ss.places.filter((p: Place) => !ss.selectedIds.includes(p.id)); ss.transitions = ss.transitions.filter((t: Transition) => !ss.selectedIds.includes(t.id));
          ss.arcs = ss.arcs.filter((a: Arc) => { const arcId = `arc_${a.from}_${a.to}`; return !ss.selectedIds.includes(arcId) && !ss.selectedIds.includes(a.from) && !ss.selectedIds.includes(a.to); });
          ss.selectedIds = [];
        }
      } else if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k) && ss.selectedIds.length > 0) {
        e.preventDefault(); const step = e.shiftKey ? 50 : 10; const dx = k === 'arrowleft' ? -step : k === 'arrowright' ? step : 0; const dy = k === 'arrowup' ? -step : k === 'arrowdown' ? step : 0;
        ss.places = ss.places.map((p: Place) => ss.selectedIds.includes(p.id) ? { ...p, x: p.x + dx, y: p.y + dy } : p);
        ss.transitions = ss.transitions.map((t: Transition) => ss.selectedIds.includes(t.id) ? { ...t, x: t.x + dx, y: t.y + dy } : t);
      }
    };
    window.addEventListener('keydown', handleKey);

    const render = () => {
      const dpr = window.devicePixelRatio || 1; const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) { canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; }
      ctx.clearRect(0, 0, canvas.width, canvas.height); state.time += 0.016;

      // Theme-aware colors
      const colors = state.isDark ? {
        grid: "#252525",
        arc: "rgba(255,255,255,0.15)",
        nodeFill: "#111",
        nodeBorder: "#eee",
        nodeText: "#888",
        transFill: "#222",
        transEnabled: "#006c84",
        tokenCountText: "#fff"
      } : {
        grid: "#e5e5e5",
        arc: "rgba(0,0,0,0.15)",
        nodeFill: "#fff",
        nodeBorder: "#111",
        nodeText: "#666",
        transFill: "#eee",
        transEnabled: "#006c84",
        tokenCountText: "#111"
      };

      [...ss.places, ...ss.transitions].forEach(node => { if (state.nodeScales[node.id] === undefined) state.nodeScales[node.id] = 1; state.nodeScales[node.id] += (1 - state.nodeScales[node.id]) * 0.15; });
      for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.02; if (p.life <= 0) particles.splice(i, 1); }
      if (state.triggerParticles) { for (let i = 0; i < 30; i++) particles.push({ x: state.triggerParticles.x, y: state.triggerParticles.y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 1.0, color: state.triggerParticles.color }); state.triggerParticles = null; }
      state.movingTokens = state.movingTokens.map(mt => { const next = mt.progress + 0.04; return { ...mt, progress: next >= 1 ? 1 : next }; });
      state.movingTokens.filter(t => t.progress >= 1).forEach(mt => {
        if (!mt.isPhaseTwo) {
          state.triggerParticles = { x: mt.toX, y: mt.toY, color: '#ff4f9a' }; state.movingTokens = state.movingTokens.filter(t => t.id !== mt.id);
          ss.arcs.filter((a: Arc) => a.from === mt.tId).forEach((a: Arc) => { const dest = ss.places.find((pl: Place) => pl.id === a.to); if (dest) state.movingTokens = [...state.movingTokens, { id: Math.random().toString(), fromX: mt.toX, fromY: mt.toY, toX: dest.x, toY: dest.y, progress: 0, isPhaseTwo: true, tId: mt.tId, targetPlaceId: dest.id }]; });
        } else { ss.places = ss.places.map((p: Place) => p.id === mt.targetPlaceId ? { ...p, tokens: p.tokens + 1 } : p); state.nodeScales[mt.targetPlaceId!] = 1.2; state.movingTokens = state.movingTokens.filter(t => t.id !== mt.id); }
      });
      ctx.save(); ctx.scale(dpr, dpr); ctx.translate(rect.width / 2 + ss.camera.x, rect.height / 2 + ss.camera.y); ctx.scale(ss.camera.zoom, ss.camera.zoom);
      const zoom = ss.camera.zoom; const gridSize = 100;
      const vL = (-rect.width/2 - ss.camera.x) / zoom; const vR = (rect.width/2 - ss.camera.x) / zoom; const vT = (-rect.height/2 - ss.camera.y) / zoom; const vB = (rect.height/2 - ss.camera.y) / zoom;
      ctx.beginPath(); ctx.strokeStyle = colors.grid; ctx.lineWidth = 0.5 / zoom;
      for (let x = Math.floor(vL / gridSize) * gridSize; x <= vR; x += gridSize) { ctx.moveTo(x, vT); ctx.lineTo(x, vB); }
      for (let y = Math.floor(vT / gridSize) * gridSize; y <= vB; y += gridSize) { ctx.moveTo(vL, y); ctx.lineTo(vR, y); } ctx.stroke();
      ctx.beginPath(); ctx.strokeStyle = "rgba(255, 79, 154, 0.4)"; ctx.lineWidth = 1/zoom; ctx.setLineDash([5/zoom, 5/zoom]);
      state.alignmentGuides.x.forEach(x => { ctx.moveTo(x, vT); ctx.lineTo(x, vB); });
      state.alignmentGuides.y.forEach(y => { ctx.moveTo(vL, y); ctx.lineTo(vR, y); });
      ctx.stroke(); ctx.setLineDash([]);
      ss.arcs.forEach((arc: Arc) => {
        const arcId = `arc_${arc.from}_${arc.to}`; const isSelected = ss.selectedIds.includes(arcId); const from = ss.places.find((p: Place) => p.id === arc.from) || ss.transitions.find((t: Transition) => t.id === arc.from); const to = ss.places.find((p: Place) => p.id === arc.to) || ss.transitions.find((t: Transition) => t.id === arc.to);
        if (from && to) {
          if (isSelected) { ctx.strokeStyle = "rgba(255, 79, 154, 0.3)"; ctx.lineWidth = 6/zoom; ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); }
          ctx.strokeStyle = isSelected ? "var(--color-riso-pink)" : colors.arc; ctx.lineWidth = (isSelected ? 3 : 2)/zoom; const dx = to.x - from.x; const dy = to.y - from.y; const angle = Math.atan2(dy, dx); ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
          const aX = to.x - 22 * Math.cos(angle); const aY = to.y - 22 * Math.sin(angle); ctx.save(); ctx.translate(aX, aY); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10 / zoom, -5 / zoom); ctx.lineTo(-10 / zoom, 5 / zoom); ctx.closePath(); ctx.fillStyle = isSelected ? "var(--color-riso-pink)" : colors.arc; if (isSelected) { ctx.strokeStyle = "rgba(255, 79, 154, 0.5)"; ctx.lineWidth = 1/zoom; ctx.stroke(); } ctx.fill(); ctx.restore();
        }
      });
      if (state.mode === 'arc' && state.arcStartId) { const from = ss.places.find((p: Place) => p.id === state.arcStartId) || ss.transitions.find((t: Transition) => t.id === state.arcStartId); if (from) { ctx.setLineDash([5/zoom, 5/zoom]); ctx.strokeStyle = "var(--color-riso-pink)"; ctx.lineWidth = 1.5/zoom; ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(state.currentMouseWorld.x, state.currentMouseWorld.y); ctx.stroke(); ctx.setLineDash([]); } }
      ss.places.forEach((p: Place) => {
        const isSelected = ss.selectedIds.includes(p.id); const isStart = state.arcStartId === p.id; const scale = (state.nodeScales[p.id] || 1); ctx.save(); ctx.translate(p.x, p.y); ctx.scale(scale, scale);
        if (isSelected || isStart) { ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fillStyle = "rgba(255, 79, 154, 0.15)"; ctx.fill(); ctx.strokeStyle = isStart ? "var(--color-riso-pink)" : "rgba(255, 79, 154, 0.3)"; ctx.lineWidth = isStart ? 2/zoom : 1/zoom; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fillStyle = colors.nodeFill; ctx.fill(); ctx.strokeStyle = isSelected ? "var(--color-riso-pink)" : colors.nodeBorder; ctx.lineWidth = (isSelected ? 3 : 2)/zoom; ctx.stroke();
        if (p.tokens > 0) { ctx.beginPath(); ctx.arc(0, 0, 10 + Math.sin(state.time * 5) * 1, 0, Math.PI * 2); ctx.fillStyle = "var(--color-riso-pink)"; ctx.fill(); ctx.fillStyle = colors.tokenCountText; ctx.font = `bold ${10/zoom}px 'Inter'`; ctx.textAlign = "center"; ctx.fillText(p.tokens.toString(), 0, 4/zoom); }
        ctx.restore(); ctx.fillStyle = (isSelected || isStart) ? "var(--color-riso-pink)" : colors.nodeText; ctx.font = `italic ${Math.max(6/zoom, 9/zoom)}px 'Playfair Display'`; ctx.textAlign = "center"; ctx.fillText(p.name, p.x, p.y + (38/zoom));
      });
      ss.transitions.forEach((t: Transition) => {
        const isSelected = ss.selectedIds.includes(t.id); const isStart = state.arcStartId === t.id; const scale = (state.nodeScales[t.id] || 1); const isEnabled = ss.arcs.filter((a: Arc) => a.to === t.id).every((a: Arc) => (ss.places.find((p: Place) => p.id === a.from)?.tokens || 0) > 0); ctx.save(); ctx.translate(t.x, t.y); ctx.scale(scale, scale);
        if (isSelected || isStart) { ctx.fillStyle = "rgba(255, 79, 154, 0.15)"; ctx.fillRect(-26, -26, 52, 52); ctx.strokeStyle = isStart ? "var(--color-riso-pink)" : "rgba(255, 79, 154, 0.3)"; ctx.lineWidth = isStart ? 2/zoom : 1/zoom; ctx.strokeRect(-26, -26, 52, 52); }
        ctx.fillStyle = isEnabled ? colors.transEnabled : colors.transFill; ctx.fillRect(-20, -20, 40, 40); ctx.strokeStyle = isSelected ? "var(--color-riso-pink)" : colors.nodeBorder; ctx.lineWidth = (isSelected ? 3 : 2)/zoom; ctx.strokeRect(-20, -20, 40, 40);
        ctx.restore(); ctx.fillStyle = (isSelected || isStart) ? "var(--color-riso-pink)" : colors.nodeText; ctx.font = `bold ${Math.max(6/zoom, 9/zoom)}px 'Inter'`; ctx.textAlign = "center"; ctx.fillText(t.name, t.x, t.y + (50/zoom));
      });
      state.movingTokens.forEach(mt => { const x = mt.fromX + (mt.toX-mt.fromX)*mt.progress; const y = mt.fromY + (mt.toY-mt.fromY)*mt.progress; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI*2); ctx.fillStyle = "var(--color-riso-pink)"; ctx.fill(); });
      if (state.marqueeStart && state.marqueeEnd) { ctx.fillStyle = "rgba(255, 79, 154, 0.05)"; ctx.fillRect(Math.min(state.marqueeStart.x, state.marqueeEnd.x), Math.min(state.marqueeStart.y, state.marqueeEnd.y), Math.abs(state.marqueeEnd.x-state.marqueeStart.x), Math.abs(state.marqueeEnd.y-state.marqueeStart.y)); ctx.strokeStyle = "rgba(255, 79, 154, 0.4)"; ctx.lineWidth = 1/zoom; ctx.strokeRect(Math.min(state.marqueeStart.x, state.marqueeEnd.x), Math.min(state.marqueeStart.y, state.marqueeEnd.y), Math.abs(state.marqueeEnd.x-state.marqueeStart.x), Math.abs(state.marqueeEnd.y-state.marqueeStart.y)); }
      ctx.restore(); animationId = requestAnimationFrame(render);
    };
    render(); cleanup(() => { clearInterval(simInterval); cancelAnimationFrame(animationId); window.removeEventListener('keydown', handleKey); mediaQuery.removeEventListener('change', themeListener); });
  });

  const tools = [
    { id: 'select', name: 'Select (V)', path: 'M15.011 20.818l-5.197-13.903L22 12.182l-5.861 1.751 4.3 8.325-1.962 1.013-4.305-8.332-4.161 5.879z' },
    { id: 'pan', name: 'Hand (H)', path: 'M7 11.5V5a2 2 0 114 0v6.5m0 0V4a2 2 0 114 0v7.5m0 0V5a2 2 0 114 0v7M7 11.5v-3a2 2 0 114 0m-4 3H5.5A2.5 2.5 0 003 14c0 3.037 2.463 5.5 5.5 5.5h6.5c2.485 0 4.5-2.015 4.5-4.5V13a2 2 0 114 0m-4-1.5v-3a2 2 0 114 0' },
    { id: 'place', name: 'Place (P)', path: 'M12 21a9 9 0 100-18 9 9 0 000 18z' },
    { id: 'transition', name: 'Transition (T)', path: 'M4 4h16v16H4z' },
    { id: 'arc', name: 'Link (A)', path: 'M17 3l4 4-4 4M3 20c1.5-4.5 4-8 9-8s7.5 3.5 9 8' },
    { id: 'token', name: 'Token (K)', path: 'M12 6v12M6 12h12' }
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      
      {state.showExportMenu && (
        <div style={{ position: 'absolute', top: '50px', right: '12px', background: 'var(--color-ui-bg)', backdropFilter: 'blur(20px)', borderRadius: '12px', border: '1px solid var(--color-ui-border)', padding: '16px', zIndex: 2000, minWidth: '220px', boxShadow: '0 16px 64px rgba(0,0,0,0.4)', animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
           <h3 style={{ margin: '0 0 12px 0', fontSize: '10px', letterSpacing: '2px', color: '#888', fontWeight: 900 }}>SYSTEM EXPORT</h3>
           <button onClick$={startRecording} style={{ width: '100%', padding: '12px', background: 'none', border: '2px solid var(--color-riso-pink)', color: 'var(--color-text)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s', fontWeight: 700 }} onMouseEnter$={(e: any) => e.target.style.background = 'rgba(255, 79, 154, 0.1)'} onMouseLeave$={(e: any) => e.target.style.background = 'none'}>
              <div style={{ width: '10px', height: '10px', borderRadius: '5px', background: 'red', boxShadow: '0 0 8px red' }}></div>
              RECORD VIDEO SIMULATION
           </button>
           <p style={{ margin: '12px 0 0 0', fontSize: '8px', color: '#666', fontStyle: 'italic', lineHeight: '1.4' }}>Captures high-fidelity canvas stream in WebM format. Simulation will auto-start.</p>
        </div>
      )}

      {state.isRecording && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,0,0,0.1)', border: '1px solid red', padding: '4px 12px', borderRadius: '20px', zIndex: 2000 }}>
           <div style={{ width: '10px', height: '10px', borderRadius: '5px', background: 'red', animation: 'pulseRed 1s infinite' }}></div>
           <span style={{ color: 'red', fontSize: '10px', fontWeight: 900, letterSpacing: '1px' }}>RECORDING SYSTEM DYNAMICS...</span>
           <button onClick$={stopRecording} style={{ background: 'red', border: 'none', color: 'white', fontSize: '8px', fontWeight: 900, padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>STOP & DOWNLOAD</button>
        </div>
      )}

      <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-ui-bg)', backdropFilter: 'blur(10px)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', padding: '6px', gap: '6px', zIndex: 100, border: '1px solid var(--color-ui-border)' }}>
        {tools.map(t => (
          <div key={t.id} style={{ position: 'relative' }}>
             {state.hoveredTool === t.id && ( <div style={{ position: 'absolute', bottom: '-42px', left: '50%', transform: 'translateX(-50%)', background: '#000', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '9px', fontWeight: 800, whiteSpace: 'nowrap', border: '1px solid #444', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', pointerEvents: 'none', animation: 'tooltipInBottom 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>{t.name}<div style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '8px', height: '8px', background: '#000', borderLeft: '1px solid #444', borderTop: '1px solid #444' }}></div></div> )}
             <button onClick$={() => state.mode = t.id as any} onMouseEnter$={() => state.hoveredTool = t.id} onMouseLeave$={() => state.hoveredTool = null} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: state.mode === t.id ? 'var(--color-riso-pink)' : 'none', color: state.mode === t.id ? 'white' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d={t.path} /></svg> </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes tooltipInBottom { from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.9); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulseRed { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
      <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 100 }}>
         <button onClick$={() => state.isSimulating = !state.isSimulating} style={{ background: state.isSimulating ? '#ff4f9a' : 'var(--color-ui-bg)', backdropFilter: 'blur(10px)', color: state.isSimulating ? 'white' : 'var(--color-riso-pink)', border: '2px solid var(--color-riso-pink)', width: '56px', height: '56px', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: state.isSimulating ? '0 0 32px rgba(255, 79, 154, 0.6)' : '0 8px 24px rgba(0,0,0,0.5)', transition: '0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: state.isSimulating ? 'scale(1.1)' : 'scale(1)' }} > {state.isSimulating ? ( <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg> ) : ( <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '3px' }}><path d="M5 3l14 9-14 9V3z"/></svg> )} </button>
      </div>
      <canvas ref={canvasRef} onMouseDown$={handleMouseDown} onMouseMove$={handleMouseMove} onMouseUp$={handleMouseUp} onWheel$={handleWheel} style={{ width: '100%', height: '100%', background: 'var(--color-bg-canvas)', cursor: state.isPanning ? 'grabbing' : state.mode === 'pan' ? 'grab' : state.mode === 'select' ? 'default' : state.mode === 'place' ? `url('data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="6" stroke="white" stroke-width="2" fill="black" fill-opacity="0.2"/></svg>') 12 12, crosshair` : state.mode === 'transition' ? `url('data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="12" height="12" stroke="white" stroke-width="2" fill="black" fill-opacity="0.2"/></svg>') 12 12, crosshair` : state.mode === 'token' ? `url('data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="%23ff4f9a" stroke="white" stroke-width="1.5"/></svg>') 12 12, crosshair` : 'crosshair' }} />
    </div>
  );
});
