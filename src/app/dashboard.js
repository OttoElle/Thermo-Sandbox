// Right sidebar: system stats, chamber cards and custom charts.
import { ChartView } from '../analytics/ChartView.js';
import { DashboardChart } from '../analytics/DashboardChart.js';
import { openChartViewer } from './chartViewer.js';
import { btnAddCustomChart, btnChartCancel, btnChartConfirm, btnChartModalClose, chamberCardsContainer, chartModal, customChartsContainer, selectChartMetric, selectChartTarget, statE, statN, statT, statV } from './dom.js';
import { engine, tempChart, velChart } from './core.js';

export const customCharts = [];
// Open chamber cards in right sidebar
const openChamberCardIds = new Set();
const chamberCharts = new Map(); // sensor id -> ChartView

const EXPAND_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';

// Expand buttons of the fixed sidebar charts
document.getElementById('btnExpandVelChart')?.addEventListener('click', () => openChartViewer(velChart.spec));
document.getElementById('btnExpandHistoryChart')?.addEventListener('click', () => openChartViewer(tempChart.spec));

// System Stats
const gpuStatusBadge = document.getElementById('gpuStatusBadge');
export function updateSystemStats() {
  const stats = engine.stats;
  if (statN) statN.textContent = stats.particleCount;
  if (statT) statT.textContent = `${Math.round(stats.systemTemperature)} K`;
  if (statE) statE.textContent = `${(stats.totalKineticEnergy / 1000).toFixed(1)} kJ`;
  if (statV) statV.textContent = `${Math.round(stats.meanSpeed)} px/s`;

  if (gpuStatusBadge) {
    if (engine.isGPUSimulating() && engine.gpuCompute.count > 0) {
      gpuStatusBadge.textContent = `WebGPU Active (${engine.stats.particleCount.toLocaleString()})`;
      gpuStatusBadge.style.background = 'rgba(34,197,94,0.15)';
      gpuStatusBadge.style.color = '#22c55e';
      gpuStatusBadge.style.borderColor = 'rgba(34,197,94,0.3)';
    } else {
      gpuStatusBadge.textContent = 'CPU Simulation';
      gpuStatusBadge.style.background = 'rgba(245,158,11,0.15)';
      gpuStatusBadge.style.color = '#f59e0b';
      gpuStatusBadge.style.borderColor = 'rgba(245,158,11,0.3)';
    }
  }
}

// Chamber Cards (DOM Reuse / Zero-Thrashing)
let lastSensorSignature = '';

export function updateChamberCards() {
  if (!chamberCardsContainer) return;
  const sensors = engine.sensors;
  if (sensors.length === 0) {
    if (lastSensorSignature !== 'empty') {
      chamberCardsContainer.innerHTML = '<p class="empty-cell" style="padding:10px 0;">No measurement zones placed</p>';
      lastSensorSignature = 'empty';
    }
    return;
  }

  const currentSignature = sensors.map(s => `${s.id}_${s.label}`).join('|');
  const dotClasses = ['blue', 'red', 'green', 'amber'];

  if (lastSensorSignature !== currentSignature) {
    let html = '';
    for (let i = 0; i < sensors.length; i++) {
      const s = sensors[i];
      const dot = dotClasses[i % dotClasses.length];
      const isOpen = openChamberCardIds.has(s.id);
      html += `
        <div class="chamber-card-item ${isOpen ? 'open' : ''}" data-sensorid="${s.id}" id="card_${s.id}">
          <div class="chamber-card-header" data-toggle="${s.id}">
            <div class="chamber-card-title">
              <span class="dot-indicator ${dot}"></span>
              <span>${s.label}</span>
            </div>
            <div class="chamber-header-actions">
              <button class="btn-chamber-add-chart" data-addchart="${s.id}" title="Add Custom Graph for this Chamber">+ Chart</button>
              <button class="chart-expand-btn" data-expand="${s.id}" title="Open large chart">${EXPAND_ICON}</button>
              <span class="chamber-badge" id="badge_${s.id}">-</span>
            </div>
          </div>
          <div class="chamber-card-body">
            <div class="chamber-inline-metrics" id="metrics_${s.id}">
              <span>T: <b class="val-t">-</b></span>
              <span>p: <b class="val-p">-</b></span>
              <span>N: <b class="val-n">-</b></span>
            </div>
            <div class="chamber-drift-row" id="drift_row_${s.id}">
              <div class="drift-compass-wrap" title="Drift direction and speed">
                <svg class="drift-compass-svg" width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="#14171d" stroke="#2a303c" stroke-width="1.2"/>
                  <line x1="16" y1="3" x2="16" y2="5" stroke="#475569" stroke-width="1"/>
                  <line x1="16" y1="27" x2="16" y2="29" stroke="#475569" stroke-width="1"/>
                  <line x1="3" y1="16" x2="5" y2="16" stroke="#475569" stroke-width="1"/>
                  <line x1="27" y1="16" x2="29" y2="16" stroke="#475569" stroke-width="1"/>
                  <circle class="drift-eq-dot" cx="16" cy="16" r="3" fill="#64748b"/>
                  <g class="drift-arrow-group" style="transform-origin: 16px 16px; display: none;">
                    <polygon points="16,5 12,20 16,16 20,20" fill="#22c55e"/>
                  </g>
                </svg>
              </div>
              <div class="drift-info-wrap">
                <span class="drift-caption">Drift:</span>
                <span class="drift-speed-text val-drift">0.0 px/s (equilibrium)</span>
              </div>
            </div>
            <canvas class="chamber-chart-canvas" id="chart_${s.id}" width="320" height="70"></canvas>
          </div>
        </div>
      `;
    }
    chamberCardsContainer.innerHTML = html;

    chamberCardsContainer.querySelectorAll('[data-toggle]').forEach(header => {
      header.addEventListener('click', () => {
        const id = header.dataset.toggle;
        if (openChamberCardIds.has(id)) openChamberCardIds.delete(id);
        else openChamberCardIds.add(id);
        const card = document.getElementById(`card_${id}`);
        if (card) card.classList.toggle('open', openChamberCardIds.has(id));
      });
    });

    chamberCardsContainer.querySelectorAll('[data-expand]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sensor = engine.sensors.find(x => x.id === btn.dataset.expand);
        if (sensor) openChartViewer({ target: sensor, metric: 'temp' });
      });
    });

    chamberCharts.clear();
    sensors.forEach(sensor => {
      const c = document.getElementById(`chart_${sensor.id}`);
      if (c) chamberCharts.set(sensor.id, new ChartView(c, { target: sensor, metric: 'temp' }));
    });

    chamberCardsContainer.querySelectorAll('[data-addchart]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.addchart;
        openCustomChartModal(id);
      });
    });

    lastSensorSignature = currentSignature;
  }

  // Update in-place metrics
  for (let i = 0; i < sensors.length; i++) {
    const s = sensors[i];
    const pFormatted = s.pressure >= 1000 ? `${(s.pressure / 1000).toFixed(1)} kPa` : `${s.pressure.toFixed(0)} Pa`;
    const hasDrift = s.displayDriftSpeed && s.displayDriftSpeed > 0;
    const driftAngleDeg = hasDrift ? Math.round((s.driftAngle * 180) / Math.PI) + 90 : 0;
    const rawCompassDeg = (driftAngleDeg - 90 + 360) % 360;
    const driftText = hasDrift ? `${s.displayDriftSpeed.toFixed(1)} px/s (${rawCompassDeg}°)` : '0.0 px/s (equilibrium)';

    const badge = document.getElementById(`badge_${s.id}`);
    if (badge) badge.textContent = `${Math.round(s.temperature)} K | ${s.particleCount} N`;

    const metrics = document.getElementById(`metrics_${s.id}`);
    if (metrics) {
      const elT = metrics.querySelector('.val-t');
      if (elT) elT.textContent = `${Math.round(s.temperature)} K`;
      const elP = metrics.querySelector('.val-p');
      if (elP) elP.textContent = pFormatted;
      const elN = metrics.querySelector('.val-n');
      if (elN) elN.textContent = s.particleCount;
    }

    const driftRow = document.getElementById(`drift_row_${s.id}`);
    if (driftRow) {
      const eqDot = driftRow.querySelector('.drift-eq-dot');
      const arrowGroup = driftRow.querySelector('.drift-arrow-group');
      const speedText = driftRow.querySelector('.val-drift');

      if (hasDrift) {
        if (eqDot) eqDot.style.display = 'none';
        if (arrowGroup) {
          arrowGroup.style.display = 'block';
          arrowGroup.style.transform = `rotate(${driftAngleDeg}deg)`;
        }
        if (speedText) {
          speedText.textContent = driftText;
          speedText.style.color = '#22c55e';
        }
      } else {
        if (eqDot) eqDot.style.display = 'block';
        if (arrowGroup) arrowGroup.style.display = 'none';
        if (speedText) {
          speedText.textContent = '0.0 px/s (equilibrium)';
          speedText.style.color = 'var(--text-dim)';
        }
      }
    }

    if (openChamberCardIds.has(s.id)) chamberCharts.get(s.id)?.render(engine);
  }
}

// ============================================================================
// Custom Multi-Chart Dashboard Management
// ============================================================================
let customChartCounter = 1;

function openCustomChartModal(targetId = null) {
  if (!selectChartTarget) return;
  selectChartTarget.innerHTML = `
    <option value="global">Global System</option>
    ${engine.sensors.map(s => `<option value="${s.id}">${s.label || 'Chamber'}</option>`).join('')}
  `;
  if (targetId && typeof targetId === 'string') {
    selectChartTarget.value = targetId;
  }
  chartModal.style.display = 'flex';
}

function closeCustomChartModal() {
  if (chartModal) chartModal.style.display = 'none';
}

function addCustomChart(targetVal, metricVal) {
  if (!customChartsContainer) return;
  const chartId = `custom_chart_${customChartCounter++}`;
  const targetObj = targetVal === 'global' ? 'global' : (engine.sensors.find(s => s.id === targetVal) || 'global');

  const card = document.createElement('div');
  card.className = 'custom-chart-card';
  card.id = `card_${chartId}`;

  const chartObj = new DashboardChart(chartId, targetObj, metricVal, null);

  card.innerHTML = `
    <div class="custom-chart-header">
      <div class="custom-chart-title"><span>${chartObj.getTitle()}</span></div>
      <div class="custom-chart-actions">
        <button class="chart-expand-btn" data-expand="${chartId}" title="Open large chart">${EXPAND_ICON}</button>
        <button class="custom-chart-close-btn" data-remove="${chartId}" title="Remove Chart">✕</button>
      </div>
    </div>
    <canvas class="custom-chart-canvas" id="canvas_${chartId}" width="310" height="110"></canvas>
  `;

  customChartsContainer.appendChild(card);
  chartObj.attach(document.getElementById(`canvas_${chartId}`));
  customCharts.push(chartObj);

  card.querySelector(`[data-expand="${chartId}"]`)?.addEventListener('click', () => openChartViewer(chartObj.view.spec));
  card.querySelector(`[data-remove="${chartId}"]`)?.addEventListener('click', () => {
    const idx = customCharts.findIndex(c => c.id === chartId);
    if (idx !== -1) customCharts.splice(idx, 1);
    card.remove();
  });

  chartObj.render(engine);
}

btnAddCustomChart?.addEventListener('click', openCustomChartModal);
btnChartModalClose?.addEventListener('click', closeCustomChartModal);
btnChartCancel?.addEventListener('click', closeCustomChartModal);
btnChartConfirm?.addEventListener('click', () => {
  const targetVal = selectChartTarget ? selectChartTarget.value : 'global';
  const metricVal = selectChartMetric ? selectChartMetric.value : 'temp';
  addCustomChart(targetVal, metricVal);
  closeCustomChartModal();
});
window.addEventListener('click', (e) => {
  if (e.target === chartModal) closeCustomChartModal();
});
