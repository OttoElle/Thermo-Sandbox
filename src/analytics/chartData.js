// Series for the charts: which history array a metric reads, its label/unit,
// and the series of a target ('global', a sensor zone, or 'sensors' = every
// sensor zone, falling back to the global system when there is none).
import { PRESSURE_SCALE } from '../physics/Constants.js';

// Categorical series colors for the dark chart surface, in fixed order
// (validated: lightness band, CVD separation >= 8.4, contrast >= 3:1 on #12141a).
export const CHART_PALETTE = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

// Default color of the n-th sensor zone (color follows the entity).
export function sensorColor(index) {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

export const TIME_METRICS = {
  temp: { label: 'Temperature', symbol: 'T', unit: 'K', key: 'historyTemp', color: CHART_PALETTE[0] },
  pressure: { label: 'Pressure', symbol: 'P', unit: 'Pa', key: 'historyPressure', color: CHART_PALETTE[1] },
  // Momentum flux on the faces of the pistons a sensor zone is bound to (dynamic pressure, includes shocks)
  facePressure: { label: 'Piston Pressure', symbol: 'P_piston', unit: 'Pa', key: 'historyFacePressure', color: CHART_PALETTE[7], bound: true },
  volume: { label: 'Volume', symbol: 'V', unit: 'px²', key: 'historyVolume', color: CHART_PALETTE[2] },
  count: { label: 'Particles', symbol: 'N', unit: '', key: 'historyCount', color: CHART_PALETTE[6] },
  kinetic: { label: 'Kinetic Energy', symbol: 'E_kin', unit: 'J', key: 'historyKineticEnergy', color: CHART_PALETTE[4] },
  drift: { label: 'Drift Speed', symbol: '|v_drift|', unit: 'px/s', key: 'historyDrift', color: CHART_PALETTE[3] }
};

// State diagrams: x / y metric; 'entropy' is s = ln T + ln(V/N) per particle (2D ideal gas, in k_B).
export const XY_METRICS = {
  pv: { label: 'P-V Diagram', x: 'volume', y: 'pressure' },
  pv_piston: { label: 'P-V Diagram (piston)', x: 'volume', y: 'facePressure' },
  pt: { label: 'P-T Diagram', x: 'temp', y: 'pressure' },
  ts: { label: 'T-s Diagram', x: 'entropy', y: 'temp' }
};

export const AXIS = {
  ...TIME_METRICS,
  entropy: { label: 'Entropy', symbol: 's', unit: 'k_B' },
  time: { label: 'Time', symbol: 't', unit: 's' },
  speed: { label: 'Speed', symbol: 'v', unit: 'px/s' }
};

export function metricKind(metric) {
  if (metric === 'hist') return 'hist';
  return XY_METRICS[metric] ? 'xy' : 'time';
}

export function metricTitle(metric) {
  if (metric === 'hist') return 'Velocity Distribution';
  if (XY_METRICS[metric]) return XY_METRICS[metric].label;
  const m = TIME_METRICS[metric];
  return m ? `${m.label} ${m.symbol}(t)` : metric;
}

function targetsOf(engine, target) {
  if (target === 'sensors') return engine.sensors.length > 0 ? engine.sensors : ['global'];
  if (target === 'global' || !target) return ['global'];
  return engine.sensors.includes(target) ? [target] : [];
}

// Piston pressure only exists for sensor zones bound to a piston.
const isBound = src => src !== 'global' && (src.getPistonBindings?.().length || 0) > 0;
const needsBinding = (...metrics) => metrics.some(m => TIME_METRICS[m]?.bound);

// Drops samples without a value (piston pressure before the first measurement).
function finiteOnly(series, keys) {
  const n = series.t.length;
  let ok = true;
  for (let i = 0; i < n && ok; i++) ok = keys.every(k => Number.isFinite(series[k][i]));
  if (ok) return series;
  const idx = [];
  for (let i = 0; i < n; i++) if (keys.every(k => Number.isFinite(series[k][i]))) idx.push(i);
  const out = { ...series };
  for (const k of ['t', 'x', 'y', 'cycle', 'step']) if (series[k]) out[k] = idx.map(i => series[k][i]);
  return out;
}

// Names of the sequencer steps (index -> name) for phase markers.
export function stepNames(engine) {
  return (engine.sequencer?.steps || []).map((s, i) => s.name || `Step ${i + 1}`);
}

function sourceName(src) {
  return src === 'global' ? 'System' : (src.label || 'Sensor');
}

function sourceColor(src, metric) {
  return src === 'global' ? (TIME_METRICS[metric]?.color || CHART_PALETTE[0]) : (src.color || CHART_PALETTE[0]);
}

function seriesArray(src, engine, metric) {
  const h = src === 'global' ? engine : src;
  if (metric === 'entropy') {
    const T = h.historyTemp || [], V = h.historyVolume || [], N = h.historyCount || [];
    return T.map((t, i) => Math.log(Math.max(1e-6, t)) + Math.log(Math.max(1e-6, (V[i] || 1) / Math.max(1, N[i] || 1))));
  }
  return h[TIME_METRICS[metric].key] || [];
}

// Time series: [{ name, color, t, y, cycle }]
export function timeSeries(engine, target, metric) {
  const bound = needsBinding(metric);
  return targetsOf(engine, target).filter(src => !bound || isBound(src)).map(src => {
    const h = src === 'global' ? engine : src;
    const s = { name: sourceName(src), color: sourceColor(src, metric), t: h.historyTime || [], y: seriesArray(src, engine, metric), cycle: h.historyCycle || [], step: h.historyStep || [] };
    return bound ? finiteOnly(s, ['y']) : s;
  });
}

// State diagram series: [{ name, color, t, x, y, cycle }]
export function xySeries(engine, target, metric) {
  const def = XY_METRICS[metric];
  // The whole world has constant volume: a global P-V or T-s diagram is degenerate.
  const bound = needsBinding(def.x, def.y);
  const usable = targetsOf(engine, target).filter(src => (src !== 'global' || def.x !== 'volume') && (!bound || isBound(src)));
  return usable.map(src => {
    const h = src === 'global' ? engine : src;
    const s = {
      name: sourceName(src), color: sourceColor(src, def.y),
      t: h.historyTime || [], x: seriesArray(src, engine, def.x), y: seriesArray(src, engine, def.y), cycle: h.historyCycle || [], step: h.historyStep || []
    };
    return bound ? finiteOnly(s, ['x', 'y']) : s;
  });
}

// Speed samples for the velocity histogram.
export function speedSamples(engine, target) {
  const src = targetsOf(engine, target)[0];
  if (src === 'global' || !src) {
    if (engine.latestSpeedSamples?.length) return engine.latestSpeedSamples;
    return (engine.particles || []).slice(0, 1000).map(p => p.getSpeed());
  }
  return src.speedSamples || [];
}

// Work done by the gas, W = ∮P dV / PRESSURE_SCALE (same energy units as E_kin),
// per sequencer cycle. Returns [{ cycle, work, complete }].
export function cycleWork(series) {
  const out = [];
  let cur = null;
  for (let i = 1; i < series.x.length; i++) {
    const c = series.cycle[i] || 0;
    if (!cur || cur.cycle !== c) {
      if (cur) cur.complete = true;
      cur = { cycle: c, work: 0, complete: false };
      out.push(cur);
    }
    cur.work += 0.5 * (series.y[i] + series.y[i - 1]) * (series.x[i] - series.x[i - 1]) / PRESSURE_SCALE;
  }
  return out;
}

export function formatValue(v, unit = '') {
  if (!Number.isFinite(v)) return '–';
  const a = Math.abs(v);
  let s;
  if (a >= 1e6) s = `${(v / 1e6).toFixed(2)}M`;
  else if (a >= 1e4) s = `${(v / 1e3).toFixed(1)}k`;
  else if (a >= 100) s = `${Math.round(v)}`;
  else if (a >= 10) s = v.toFixed(1);
  else s = v.toFixed(2);
  return unit ? `${s} ${unit}` : s;
}

// Long-format CSV of every recorded series (one row per sample and source).
export function historyCSV(engine) {
  const rows = ['source,time_s,temperature_K,pressure_Pa,piston_pressure_Pa,volume_px2,particles,kinetic_energy_J,drift_px_s,cycle,step'];
  const num = v => (Number.isFinite(v) ? v : '');
  const add = (name, h) => {
    const n = (h.historyTime || []).length;
    for (let i = 0; i < n; i++) {
      rows.push([
        `"${name.replace(/"/g, '""')}"`, h.historyTime[i].toFixed(4), h.historyTemp[i], h.historyPressure[i], num((h.historyFacePressure || [])[i]),
        h.historyVolume[i], h.historyCount[i], h.historyKineticEnergy[i], h.historyDrift[i], (h.historyCycle || [])[i] ?? 0,
        ((h.historyStep || [])[i] ?? -1) + 1
      ].join(','));
    }
  };
  add('System', engine);
  engine.sensors.forEach(s => add(s.label || 'Sensor', s));
  return rows.join('\n');
}
