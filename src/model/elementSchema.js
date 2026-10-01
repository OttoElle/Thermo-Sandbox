// Single source of truth for element properties: labels, units, ranges,
// defaults (TOOL_CATALOG.md) and where each field appears. The tool dialog,
// the properties panel and the sequencer action dialog all render from this,
// and the sequencer executor applies actions through the same setters.
//
// Field: { key, label, kind: 'number' | 'toggle' | 'direction' | 'bool' | 'text' | 'color' | 'select',
//          min, max, step, unit, scale (display = value * scale), int, def, options: [{ value, label }],
//          in: { tool, inspector, sequencer } (default all true), visible(values), get(item), set(item, v, engine) }
import { Wall } from '../physics/Wall.js';
import { Piston } from '../physics/Piston.js';
import { Reservoir } from '../physics/Reservoir.js';
import { SensorZone } from '../physics/SensorZone.js';
import { Emitter } from '../physics/Emitter.js';
import { Sink } from '../physics/Sink.js';
import { ThermalBlock } from '../physics/ThermalBlock.js';
import { HeatExchanger } from '../physics/HeatExchanger.js';
import { RegeneratorMatrix } from '../physics/RegeneratorMatrix.js';
import { TextLabel } from '../physics/TextLabel.js';
import { ParticleGroup } from '../physics/ParticleGroup.js';
import { Regulator } from '../physics/Regulator.js';
import { ThrottleValve } from '../physics/ThrottleValve.js';

// ---------------------------------------------------------------------------
// Shared field builders
// ---------------------------------------------------------------------------
const num = (key, label, min, max, step, def, unit = '', extra = {}) => ({ key, label, kind: 'number', min, max, step, def, unit, ...extra });

const THICKNESS = (def) => num('thickness', 'Thickness', 2, 16, 1, def, 'px', { int: true, in: { sequencer: false } });
const CONDUCTIVITY = (def, label = 'Conductivity κ', min = 0) => num('conductivity', label, min, 1, 0.05, def);
const GAS_TEMPERATURE = (def = 300, label = 'Temperature T') => num('temperature', label, 10, 1000, 10, def, 'K');
const BODY_TEMPERATURE = (def = 300, label = 'Temperature T') => num('temperature', label, 5, 1000, 10, def, 'K');
const PARTICLE_MASS = num('mass', 'Particle Mass m', 0.2, 5, 0.2, 1.0);
const ACTIVE = (label = 'Active') => ({ key: 'isActive', label, kind: 'bool', def: true, in: { tool: false } });
const DIRECTION = (def) => ({ key: 'direction', label: 'Direction', kind: 'direction', def });
const MAX_COUNT = (label) => num('maxParticles', label, 0, 500, 10, 0, '', { int: true });

// Piston mode while running freely (the sequencer's drive commands override it).
const runMode = v => (v.command === undefined || v.command === 'release') ? v.mode : null;

const PISTON_MODES = [
  { value: 'free', label: 'Displacer' },
  { value: 'spring', label: 'Accumulator' },
  { value: 'motorized', label: 'Compressor' },
  { value: 'damper', label: 'Expander' }
];

// ---------------------------------------------------------------------------
// Element types
// ---------------------------------------------------------------------------
export const ELEMENT_TYPES = {
  wall: {
    label: 'Wall', tag: 'WALL', tool: 'wall',
    fields: [
      THICKNESS(4),
      CONDUCTIVITY(0),
      { ...BODY_TEMPERATURE(300), visible: v => v.conductivity > 0 },
      num('heatCapacity', 'Heat Capacity C', 50, 2000, 50, 400, 'J/K', { visible: v => v.conductivity > 0, in: { sequencer: false } })
    ]
  },
  manual_valve: {
    label: 'Manual Valve', tag: 'VALVE', tool: 'valve',
    fields: [
      { key: 'isOpen', label: 'State', kind: 'toggle', def: false, options: [{ value: false, label: 'Closed' }, { value: true, label: 'Open' }] },
      THICKNESS(4),
      CONDUCTIVITY(0)
    ]
  },
  check_valve: {
    label: 'Check Valve', tag: 'VALVE', tool: 'valve',
    fields: [
      { key: 'allowedDirection', label: 'Allowed Flow', kind: 'toggle', def: 1, options: [{ value: 1, label: 'Forward →' }, { value: -1, label: 'Reverse ←' }] },
      THICKNESS(4),
      CONDUCTIVITY(0)
    ]
  },
  relief_valve: {
    label: 'Relief Valve', tag: 'PRV', tool: 'valve',
    fields: [
      num('triggerPressure', 'Trigger Pressure P_max', 50, 1000, 25, 250, 'Pa'),
      num('pressureHysteresis', 'Hysteresis ΔP', 0, 100, 5, 25, 'Pa'),
      { key: 'reliefMode', label: 'Relief Mode', kind: 'toggle', def: 'oneway', options: [{ value: 'oneway', label: '1-Way' }, { value: 'bidirectional', label: '2-Way' }] },
      { key: 'allowedDirection', label: 'Relief Direction', kind: 'toggle', def: 1, options: [{ value: 1, label: 'Forward →' }, { value: -1, label: 'Reverse ←' }], visible: v => v.reliefMode === 'oneway' },
      THICKNESS(4),
      CONDUCTIVITY(0)
    ]
  },
  throttle_valve: {
    label: 'Throttle Valve', tag: 'THROTTLE', tool: 'throttle_valve',
    fields: [
      ACTIVE(),
      num('openRatio', 'Opening', 0, 100, 5, 0.3, '%', { scale: 100, set: (it, v) => it.setOpenRatio(v) }),
      { ...THICKNESS(6), set: (it, v) => { it.thickness = v; it._updateGeometry(); } },
      CONDUCTIVITY(0)
    ],
    info: it => `Gap ${Math.round(it.gapWidth || it.length * it.openRatio)} px · ΔP ${(it.deltaP || 0).toFixed(1)} Pa`
  },
  piston: {
    label: 'Piston', tag: 'PISTON', tool: 'piston',
    fields: [
      ACTIVE(),
      { key: 'command', label: 'Command', kind: 'select', def: 'drive_tdc', in: { tool: false, inspector: false },
        options: [
          { value: 'drive_tdc', label: 'Drive to TDC (min volume)' },
          { value: 'drive_bdc', label: 'Drive to BDC (max volume)' },
          { value: 'hold', label: 'Hold position' },
          { value: 'release', label: 'Release (run in mode below)' }
        ] },
      num('targetSpeed', 'Drive Speed', 20, 400, 10, 160, 'px/s', { in: { tool: false, inspector: false }, visible: v => v.command === 'drive_tdc' || v.command === 'drive_bdc' }),
      { key: 'mode', label: 'Mode', kind: 'toggle', def: 'free', options: PISTON_MODES, in: { tool: false }, visible: v => v.command === undefined || v.command === 'release' },
      num('mass', 'Mass m', 0, 150, 5, 30, 'kg'),
      CONDUCTIVITY(0.2),
      num('springK', 'Spring Constant k', 10, 500, 10, 50, 'N/m', { visible: v => runMode(v) === 'spring' }),
      num('frequency', 'Motor Frequency f', 0.1, 5, 0.1, 0.8, 'Hz', { visible: v => runMode(v) === 'motorized' }),
      num('phase', 'Phase Offset φ', -180, 180, 15, 0, '°', { visible: v => runMode(v) === 'motorized' }),
      num('dampingCoeff', 'Damping Load γ', 5, 150, 5, 25, 'Ns/m', { visible: v => runMode(v) === 'damper' })
    ],
    info: it => {
      const stroke = Math.round(Math.abs(it.maxPos - it.minPos));
      if (it.mode === 'damper') return `Work extracted ${(it.workExtracted || 0).toFixed(1)} J · ${(it.instantPower || 0).toFixed(1)} W`;
      return `Stroke ${stroke} px (drag the rail handles)`;
    }
  },
  reservoir: {
    label: 'Heat Bath', tag: 'BATH', tool: 'solid_res',
    fields: [
      ACTIVE(),
      BODY_TEMPERATURE(500, 'Constant Temperature T'),
      num('conductance', 'Thermal Coupling κ', 0.05, 1, 0.05, 0.8)
    ]
  },
  heat_exchanger: {
    label: 'Heat Exchanger', tag: 'HX', tool: 'heat_exchanger',
    fields: [
      ACTIVE(),
      BODY_TEMPERATURE(300, 'Body Temperature T'),
      CONDUCTIVITY(0.6, 'Thermal Coupling κ', 0.05)
    ]
  },
  regenerator: {
    label: 'Regenerator', tag: 'REGEN', tool: 'regenerator',
    fields: [
      ACTIVE(),
      { key: 'orientation', label: 'Flow Axis', kind: 'toggle', def: 'horizontal', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }] },
      { ...BODY_TEMPERATURE(300, 'Base Temperature T'),
        get: it => Math.round(it.getAverageTemperature()),
        set: (it, v) => {
          const diff = v - it.getAverageTemperature();
          for (let i = 0; i < it.temperatures.length; i++) it.temperatures[i] = Math.max(5, it.temperatures[i] + diff);
        } },
      num('heatCapacity', 'Heat Capacity C', 50, 1500, 50, 400, 'J/K'),
      CONDUCTIVITY(0.7, 'Thermal Coupling κ', 0.05),
      num('axialConductivity', 'Axial Heat Leakage', 0, 0.5, 0.02, 0.05)
    ],
    info: it => `Gradient ${Math.round(Math.min(...it.temperatures))} – ${Math.round(Math.max(...it.temperatures))} K`
  },
  thermal_block: {
    label: 'Thermal Mass', tag: 'MASS', tool: 'storage_block',
    fields: [
      ACTIVE(),
      BODY_TEMPERATURE(300),
      num('heatCapacity', 'Heat Capacity C', 50, 1500, 50, 300, 'J/K'),
      CONDUCTIVITY(0.6, 'Thermal Coupling κ', 0.05)
    ]
  },
  emitter: {
    label: 'Emitter', tag: 'SOURCE', tool: 'emitter',
    fields: [
      { key: 'enabled', label: 'Firing', kind: 'bool', def: true, in: { tool: false } },
      DIRECTION('right'),
      num('rate', 'Rate', 1, 60, 1, 8, '/s', { int: true }),
      GAS_TEMPERATURE(300),
      PARTICLE_MASS,
      MAX_COUNT('Max Count (0 = ∞)')
    ]
  },
  sink: {
    label: 'Absorber', tag: 'ABSORBER', tool: 'sink',
    fields: [
      ACTIVE(),
      DIRECTION('360'),
      { key: 'tempFilterMode', label: 'Temperature Filter', kind: 'toggle', def: 'all', options: [{ value: 'all', label: 'All' }, { value: 'above', label: '> T' }, { value: 'below', label: '< T' }] },
      { ...GAS_TEMPERATURE(300, 'Threshold Temperature'), key: 'filterTemperature', visible: v => v.tempFilterMode !== 'all' },
      num('absorptionEfficiency', 'Efficiency', 10, 100, 5, 1.0, '%', { scale: 100 }),
      MAX_COUNT('Max Absorbed (0 = ∞)')
    ]
  },
  regulator: {
    label: 'Regulator', tag: 'REGULATOR', tool: 'regulator',
    fields: [
      ACTIVE(),
      num('targetCount', 'Target Count N', 5, 300, 5, 50, '', { int: true }),
      num('hysteresis', 'Hysteresis ΔN', 0, 20, 1, 3, '', { int: true }),
      GAS_TEMPERATURE(300),
      PARTICLE_MASS,
      num('rate', 'Max Rate', 1, 60, 1, 15, '/s', { int: true })
    ],
    info: it => `${it.currentCount || 0} / ${it.targetCount} particles in zone`
  },
  gas: {
    label: 'Spawner', tag: 'SPAWNER', tool: 'gas', sequenceable: false,
    fields: [
      { key: 'velocityMode', label: 'Velocities', kind: 'toggle', def: 'uniform_speed', in: { inspector: false },
        options: [{ value: 'uniform_speed', label: 'Uniform' }, { value: 'maxwell', label: 'Maxwell' }] },
      num('count', 'Particle Count N', 5, 300, 5, 30, '', { int: true, in: { inspector: false } }),
      { ...GAS_TEMPERATURE(300), set: (it, v, engine) => engine.setGroupTemperature(it, v) },
      { ...PARTICLE_MASS, set: (it, v, engine) => engine.setGroupMass(it, v) }
    ],
    info: (it, engine) => `${it.getActiveCount(engine)} particles · avg ${Math.round(it.getAverageTemperature(engine))} K`
  },
  sensor: {
    label: 'Sensor', tag: 'SENSOR', tool: 'sensor', sequenceable: false,
    fields: [
      { key: 'label', label: 'Name', kind: 'text', def: 'Chamber', set: (it, v) => { it.label = v.trim() || 'Chamber'; } },
      { key: 'color', label: 'Color', kind: 'color', def: '#3987e5' }
    ],
    info: it => (it.displayDriftSpeed > 0
      ? `Drift ${it.displayDriftSpeed.toFixed(1)} px/s (${Math.round(it.driftAngle * 180 / Math.PI)}°)`
      : 'No net drift')
  },
  text: {
    label: 'Text', tag: 'NOTE', tool: 'text', sequenceable: false,
    fields: [
      { key: 'text', label: 'Text', kind: 'text', def: 'Note' },
      { ...num('fontSize', 'Font Size', 10, 48, 1, 14, 'px', { int: true }), set: (it, v) => { it.fontSize = v; it.height = v + 12; } },
      { key: 'color', label: 'Color', kind: 'color', def: '#94a3b8' }
    ]
  }
};

// Which schema type an element belongs to.
export function elementTypeOf(item) {
  if (item instanceof Wall) return ELEMENT_TYPES[item.type] ? item.type : 'wall';
  if (item instanceof ThrottleValve) return 'throttle_valve';
  if (item instanceof Piston) return 'piston';
  if (item instanceof Reservoir) return 'reservoir';
  if (item instanceof HeatExchanger) return 'heat_exchanger';
  if (item instanceof RegeneratorMatrix) return 'regenerator';
  if (item instanceof ThermalBlock) return 'thermal_block';
  if (item instanceof Emitter) return 'emitter';
  if (item instanceof Sink) return 'sink';
  if (item instanceof Regulator) return 'regulator';
  if (item instanceof ParticleGroup) return 'gas';
  if (item instanceof SensorZone) return 'sensor';
  if (item instanceof TextLabel) return 'text';
  return null;
}

// Schema type for a ribbon tool (valve sub-type from its config).
export function elementTypeOfTool(tool, toolConfig) {
  if (tool === 'valve') return toolConfig?.type || 'manual_valve';
  return Object.keys(ELEMENT_TYPES).find(t => ELEMENT_TYPES[t].tool === tool && t !== 'check_valve' && t !== 'relief_valve') || null;
}

export function fieldsFor(type, context) {
  const def = ELEMENT_TYPES[type];
  if (!def) return [];
  return def.fields.filter(f => !f.in || f.in[context] !== false);
}

export function getFieldValue(field, item) {
  return field.get ? field.get(item) : item[field.key];
}

export function setFieldValue(field, item, value, engine) {
  if (field.set) field.set(item, value, engine);
  else item[field.key] = value;
}

// Current values of an element for the given context.
export function readValues(type, item, context) {
  const values = {};
  fieldsFor(type, context).forEach(f => {
    const v = getFieldValue(f, item);
    values[f.key] = v === undefined ? f.def : v;
  });
  return values;
}

export function defaultValues(type, context) {
  const values = {};
  fieldsFor(type, context).forEach(f => { values[f.key] = f.def; });
  return values;
}
