// Large chart dialog: any metric of any target, time range (all / last N s /
// zoomed), wheel zoom and drag pan on the time axis, PNG and CSV export.
import { ChartView } from '../analytics/ChartView.js';
import { metricKind, metricTitle } from '../analytics/chartData.js';
import { engine } from './core.js';
import { app } from './state.js';
import { downloadBlob, safeFileName } from './menus.js';

const overlay = document.getElementById('chartViewer');
const viewerCanvas = document.getElementById('chartViewerCanvas');
const viewerTitleEl = document.getElementById('chartViewerTitle');
const metricSel = document.getElementById('chartViewerMetric');
const targetSel = document.getElementById('chartViewerTarget');
const rangeGroup = document.getElementById('chartViewerRange');

const METRICS = ['temp', 'pressure', 'volume', 'count', 'kinetic', 'drift', 'pv', 'pt', 'ts', 'hist'];
const viewerChart = viewerCanvas ? new ChartView(viewerCanvas, {}, { large: true }) : null;
let drag = null; // { x, window } while panning

export function isChartViewerOpen() {
  return overlay && overlay.style.display !== 'none';
}

function targetValue(target) {
  return typeof target === 'string' ? target : target.id;
}

function resolveTarget(value) {
  if (value === 'global' || value === 'sensors') return value;
  return engine.sensors.find(s => s.id === value) || 'global';
}

function fillSelectors() {
  metricSel.innerHTML = METRICS.map(m => `<option value="${m}">${metricTitle(m)}</option>`).join('');
  targetSel.innerHTML = [
    '<option value="global">System</option>',
    engine.sensors.length > 1 ? '<option value="sensors">All sensors</option>' : '',
    ...engine.sensors.map(s => `<option value="${s.id}">${s.label}</option>`)
  ].join('');
}

function syncControls() {
  metricSel.value = viewerChart.spec.metric;
  targetSel.value = targetValue(viewerChart.spec.target);
  if (![...targetSel.options].some(o => o.value === targetSel.value)) targetSel.value = 'global';
  const mode = viewerChart.view.mode === 'last' ? String(viewerChart.view.span) : viewerChart.view.mode;
  rangeGroup.querySelectorAll('[data-range]').forEach(b => b.classList.toggle('active', b.dataset.range === mode));
  rangeGroup.style.visibility = metricKind(viewerChart.spec.metric) === 'hist' ? 'hidden' : 'visible';
  viewerTitleEl.textContent = viewerChart.title();
}

export function openChartViewer(spec) {
  if (!viewerChart) return;
  fillSelectors();
  viewerChart.spec = { target: 'global', metric: 'temp', ...spec };
  viewerChart.view = { mode: 'all' };
  overlay.style.display = 'flex';
  syncControls();
  viewerChart.render(engine);
}

export function closeChartViewer() {
  if (overlay) overlay.style.display = 'none';
}

export function renderChartViewer() {
  if (isChartViewerOpen() && !drag) viewerChart.render(engine);
}

if (viewerChart) {
  metricSel.addEventListener('change', () => { viewerChart.spec.metric = metricSel.value; syncControls(); viewerChart.render(engine); });
  targetSel.addEventListener('change', () => { viewerChart.spec.target = resolveTarget(targetSel.value); syncControls(); viewerChart.render(engine); });
  rangeGroup.querySelectorAll('[data-range]').forEach(btn => btn.addEventListener('click', () => {
    viewerChart.view = btn.dataset.range === 'all' ? { mode: 'all' } : { mode: 'last', span: parseFloat(btn.dataset.range) };
    syncControls();
    viewerChart.render(engine);
  }));
  document.getElementById('chartViewerClose').addEventListener('click', closeChartViewer);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeChartViewer(); });

  document.getElementById('chartViewerCSV').addEventListener('click', () => {
    downloadBlob(new Blob([viewerChart.toCSV(engine)], { type: 'text/csv' }), `${safeFileName(app.currentProjectName)}_${viewerChart.spec.metric}.csv`);
  });
  document.getElementById('chartViewerPNG').addEventListener('click', () => {
    // Chart plus its title strip
    const dpr = window.devicePixelRatio || 1;
    const head = Math.round(32 * dpr);
    const out = document.createElement('viewerCanvas');
    out.width = viewerCanvas.width;
    out.height = viewerCanvas.height + head;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#12141a';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = `600 ${14 * dpr}px Inter, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(`${viewerChart.title()} — ${app.currentProjectName}`, 16 * dpr, head / 2 + 2 * dpr);
    ctx.drawImage(viewerCanvas, 0, head);
    out.toBlob(b => { if (b) downloadBlob(b, `${safeFileName(app.currentProjectName)}_${viewerChart.spec.metric}.png`); });
  });

  // Zoom (wheel) and pan (drag) on the time window; double-click shows everything.
  viewerCanvas.addEventListener('wheel', (e) => {
    if (!viewerChart.lastWindow || metricKind(viewerChart.spec.metric) === 'hist') return;
    e.preventDefault();
    const [t0, t1] = viewerChart.lastWindow;
    const p = viewerChart.lastPlot;
    const r = viewerCanvas.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - r.left - p.x0) / (p.x1 - p.x0)));
    const anchor = t0 + frac * (t1 - t0);
    const span = Math.max(0.5, (t1 - t0) * (e.deltaY < 0 ? 0.8 : 1.25));
    viewerChart.view = { mode: 'range', t0: anchor - frac * span, t1: anchor + (1 - frac) * span };
    syncControls();
    viewerChart.render(engine);
  }, { passive: false });
  viewerCanvas.addEventListener('mousedown', (e) => {
    if (!viewerChart.lastWindow || metricKind(viewerChart.spec.metric) === 'hist') return;
    drag = { x: e.clientX, window: [...viewerChart.lastWindow] };
  });
  window.addEventListener('mousemove', (e) => {
    if (!drag) return;
    const p = viewerChart.lastPlot;
    const [t0, t1] = drag.window;
    const dt = (e.clientX - drag.x) / (p.x1 - p.x0) * (t1 - t0);
    viewerChart.view = { mode: 'range', t0: t0 - dt, t1: t1 - dt };
    syncControls();
    viewerChart.render(engine);
  });
  window.addEventListener('mouseup', () => { drag = null; });
  viewerCanvas.addEventListener('dblclick', () => { viewerChart.view = { mode: 'all' }; syncControls(); viewerChart.render(engine); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isChartViewerOpen()) closeChartViewer(); });
}

