/**
 * SequencerConditionFields.js
 * Form fields and one-line summaries of transition conditions, rendered with
 * the shared property form (same controls as the element properties).
 */
import { elementName } from '../model/elementNames.js';
import { SENSOR_METRICS } from './SequencerConditions.js';

export const CONDITION_TYPES = [
  { value: 'duration', label: 'Time in step' },
  { value: 'piston', label: 'Piston position' },
  { value: 'sensor', label: 'Sensor measurement' }
];

const PISTON_TARGETS = [
  { value: 'step', label: 'Reaches its drive target' },
  { value: 'tdc', label: 'At TDC (min volume)' },
  { value: 'bdc', label: 'At BDC (max volume)' },
  { value: 'above', label: 'Stroke ≥ position (toward BDC)' },
  { value: 'below', label: 'Stroke ≤ position (toward TDC)' }
];

// Slider range of the threshold per sensor quantity (the number field accepts any value).
const THRESHOLD_RANGE = {
  temperature: [0, 2000, 10, 300], pressure: [0, 20000, 50, 1000], facePressure: [0, 20000, 50, 1000],
  volume: [0, 400000, 1000, 40000], count: [0, 2000, 1, 100]
};

const condNum = (key, label, min, max, step, def, unit = '', extra = {}) => ({ key, label, kind: 'number', min, max, step, def, unit, ...extra });
const condSelect = (key, label, options, extra = {}) => ({ key, label, kind: 'select', options, ...extra });

export function defaultCondition(type, engine) {
  if (type === 'piston') return { type, pistonId: '', pistonTarget: 'step', strokePos: 50 };
  if (type === 'sensor') {
    return { type, sensorId: engine?.sensors?.[0]?.id || '', sensorMetric: 'temperature', sensorOperator: '>=', sensorThreshold: 300 };
  }
  return { type: 'duration', duration: 1.5 };
}

// Fills keys the form needs (older saves, conditions switched to another type).
export function prepareCondition(cond, engine) {
  if ((cond.type === 'piston' || cond.type === 'piston_target') && cond.pistonId && cond.pistonTarget === undefined) cond.pistonTarget = 'tdc';
  const base = defaultCondition(cond.type === 'piston_target' ? 'piston' : cond.type, engine);
  for (const [k, v] of Object.entries(base)) if (cond[k] === undefined || cond[k] === null) cond[k] = v;
  if (cond.type === 'piston_target') cond.type = 'piston';
  if (cond.type === 'piston' && !cond.pistonId) cond.pistonTarget = 'step';
  if (cond.type === 'sensor' && cond.sensorMetric === 'pressure_kpa') {
    cond.sensorMetric = 'pressure';
    cond.sensorThreshold *= 1000;
  }
  return cond;
}

// Field list of a condition for renderPropertyForm (values = the condition itself).
export function conditionFields(cond, engine) {
  if (cond.type === 'piston') {
    const pistons = (engine?.pistons || []).map(p => ({ value: p.id, label: elementName(p, engine) }));
    return [
      condSelect('pistonId', 'Piston', [{ value: '', label: 'Every piston driven in this step' }, ...pistons]),
      condSelect('pistonTarget', 'Condition', PISTON_TARGETS, { visible: v => !!v.pistonId }),
      condNum('strokePos', 'Stroke Position (0 = TDC)', 0, 100, 5, 50, '%', { visible: v => !!v.pistonId && (v.pistonTarget === 'above' || v.pistonTarget === 'below') })
    ];
  }
  if (cond.type === 'sensor') {
    const sensors = (engine?.sensors || []).map(s => ({ value: s.id, label: elementName(s, engine) }));
    const metric = SENSOR_METRICS[cond.sensorMetric] ? cond.sensorMetric : 'pressure';
    const [min, max, step, def] = THRESHOLD_RANGE[metric];
    return [
      condSelect('sensorId', 'Sensor Zone', sensors.length ? sensors : [{ value: '', label: '(no sensor zones)' }]),
      condSelect('sensorMetric', 'Quantity', Object.entries(SENSOR_METRICS).map(([value, m]) => ({ value, label: m.label }))),
      { key: 'sensorOperator', label: 'Comparison', kind: 'toggle', options: [{ value: '>=', label: '≥ rises to' }, { value: '<=', label: '≤ falls to' }] },
      condNum('sensorThreshold', 'Threshold', min, max, step, def, SENSOR_METRICS[metric].unit)
    ];
  }
  return [condNum('duration', 'Time in Step', 0.1, 30, 0.1, 1.5, 's')];
}

// Keys whose change alters the field list (the form is rebuilt after them).
export const STRUCTURAL_KEYS = ['pistonId', 'pistonTarget', 'sensorMetric'];

const fmt = v => (Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}k` : `${Math.round(v * 10) / 10}`);

export function summarizeCondition(cond, engine) {
  if (!cond) return 'Immediately';
  const type = cond.type === 'piston_target' ? 'piston' : (cond.type || 'duration');
  if (type === 'duration') return `t ≥ ${(cond.duration ?? 1.5).toFixed(1)} s`;
  if (type === 'piston') {
    const p = cond.pistonId ? (engine?.pistons || []).find(x => x.id === cond.pistonId) : null;
    if (!p) return cond.pistonId ? 'Piston (deleted)' : 'Pistons at target';
    const name = elementName(p, engine);
    const t = cond.pistonTarget || 'tdc';
    if (t === 'tdc' || t === 'bdc') return `${name} at ${t.toUpperCase()}`;
    if (t === 'above' || t === 'below') return `${name} ${t === 'above' ? '≥' : '≤'} ${Math.round(cond.strokePos ?? 50)}%`;
    return `${name} at target`;
  }
  if (type === 'sensor') {
    const s = (engine?.sensors || []).find(x => x.id === cond.sensorId);
    const m = SENSOR_METRICS[cond.sensorMetric] || (cond.sensorMetric === 'pressure_kpa' ? { symbol: 'P', unit: 'kPa' } : SENSOR_METRICS.pressure);
    const op = (cond.sensorOperator || '>=').startsWith('>') ? '≥' : '≤';
    return `${s ? elementName(s, engine) + ': ' : ''}${m.symbol} ${op} ${fmt(cond.sensorThreshold ?? 200)}${m.unit ? ' ' + m.unit : ''}`;
  }
  return 'Immediately';
}
