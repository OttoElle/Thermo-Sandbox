// Small preview of a saved scene state (start screen cards): walls, pistons,
// thermal zones, sensor outlines and particles coloured by speed like the canvas.
import { thermalColormap } from '../render/Colormap.js';

const THUMB = {
  bg: '#0c0e13', wall: '#cbd5e1', piston: '#94a3b8', valveOpen: '#475569',
  hot: 'rgba(239, 68, 68, 0.22)', cold: 'rgba(59, 130, 246, 0.22)', neutral: 'rgba(148, 163, 184, 0.16)',
  sensor: 'rgba(148, 163, 184, 0.55)'
};
const MAX_PARTICLES = 700;

function sceneBounds(state) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (x, y) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
  const rects = [...(state.reservoirs || []), ...(state.thermalBlocks || []), ...(state.heatExchangers || []), ...(state.regenerators || []),
    ...(state.sensors || []), ...(state.emitters || []), ...(state.sinks || []), ...(state.regulators || [])];
  [...(state.walls || []), ...(state.throttleValves || [])].forEach(w => { add(w.p1.x, w.p1.y); add(w.p2.x, w.p2.y); });
  rects.forEach(r => { add(r.x, r.y); add(r.x + r.width, r.y + r.height); });
  (state.pistons || []).forEach(p => { add(p.x - p.width / 2, p.y - p.height / 2); add(p.x + p.width / 2, p.y + p.height / 2); });
  if (!Number.isFinite(minX)) (state.particles || []).forEach(p => add(p.x, p.y));
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

const zoneFill = (T) => (T >= 400 ? THUMB.hot : T <= 250 ? THUMB.cold : THUMB.neutral);

export function drawSceneThumbnail(canvas, state) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = THUMB.bg;
  ctx.fillRect(0, 0, w, h);
  const b = state && sceneBounds(state);
  if (!b) return;

  const pad = 8;
  const s = Math.min((w - 2 * pad) / Math.max(1, b.maxX - b.minX), (h - 2 * pad) / Math.max(1, b.maxY - b.minY));
  const ox = (w - (b.maxX - b.minX) * s) / 2 - b.minX * s, oy = (h - (b.maxY - b.minY) * s) / 2 - b.minY * s;
  const X = x => ox + x * s, Y = y => oy + y * s;
  const rect = (r, fill) => { ctx.fillStyle = fill; ctx.fillRect(X(r.x), Y(r.y), r.width * s, r.height * s); };

  (state.reservoirs || []).forEach(r => rect(r, zoneFill(r.temperature)));
  (state.thermalBlocks || []).forEach(r => rect(r, zoneFill(r.temperature)));
  (state.heatExchangers || []).forEach(r => rect(r, r.isActive === false ? THUMB.neutral : zoneFill(r.temperature)));
  (state.regenerators || []).forEach(r => rect(r, THUMB.neutral));

  const particles = state.particles || [];
  const step = Math.max(1, Math.ceil(particles.length / MAX_PARTICLES));
  const r = Math.max(0.8, Math.min(2.2, 3.5 * s));
  for (let i = 0; i < particles.length; i += step) {
    const p = particles[i];
    ctx.fillStyle = thermalColormap.getColor(Math.hypot(p.vx, p.vy) / 380).rgb;
    ctx.fillRect(X(p.x) - r / 2, Y(p.y) - r / 2, r, r);
  }

  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  (state.sensors || []).forEach(z => {
    ctx.strokeStyle = z.color || THUMB.sensor;
    ctx.globalAlpha = 0.7;
    ctx.strokeRect(X(z.x) + 0.5, Y(z.y) + 0.5, z.width * s - 1, z.height * s - 1);
  });
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  ctx.lineCap = 'round';
  [...(state.walls || []), ...(state.throttleValves || [])].forEach(wl => {
    const open = wl.type === 'manual_valve' && wl.isOpen;
    ctx.strokeStyle = open ? THUMB.valveOpen : THUMB.wall;
    ctx.lineWidth = Math.max(1.2, (wl.thickness || 4) * s);
    ctx.beginPath();
    ctx.moveTo(X(wl.p1.x), Y(wl.p1.y));
    ctx.lineTo(X(wl.p2.x), Y(wl.p2.y));
    ctx.stroke();
  });
  (state.pistons || []).forEach(p => {
    ctx.fillStyle = THUMB.piston;
    ctx.fillRect(X(p.x - p.width / 2), Y(p.y - p.height / 2), Math.max(2, p.width * s), Math.max(2, p.height * s));
  });
}
