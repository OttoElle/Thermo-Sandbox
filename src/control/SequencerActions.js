/**
 * SequencerActions.js
 * Step actions on top of the element schema: which elements can be sequenced,
 * the values an action holds, translation of older saved actions, applying
 * an action to the engine and a one-line summary.
 *
 * An action is { id, targetId, type, ...values } where the values use the
 * schema field keys (plus the piston drive `command` and `targetSpeed`).
 */
import { ELEMENT_TYPES, elementTypeOf, fieldsFor, readValues, setFieldValue } from '../model/elementSchema.js';
import { SequencerConditions } from './SequencerConditions.js';

// Schema type an element is sequenced as, or null if it can't be sequenced.
export function actionTypeOf(item) {
  const type = item ? elementTypeOf(item) : null;
  if (!type || ELEMENT_TYPES[type].sequenceable === false) return null;
  return fieldsFor(type, 'sequencer').length > 0 ? type : null;
}

const LEGACY_TYPES = {
  throttle: 'throttle_valve', hx: 'heat_exchanger', regen: 'regenerator', ressavoir: 'thermal_block',
  source: 'emitter', absorber: 'sink', sink_thermal: 'reservoir'
};

const LEGACY_KEYS = {
  piston: { motorFrequency: 'frequency', motorPhase: 'phase', dampingGamma: 'dampingCoeff' },
  check_valve: { direction: 'allowedDirection' },
  relief_valve: { hysteresis: 'pressureHysteresis', direction: 'allowedDirection' },
  reservoir: { conductivity: 'conductance', thermalCoupling: 'conductance' },
  heat_exchanger: { thermalCoupling: 'conductivity' },
  regenerator: { thermalCoupling: 'conductivity', axis: 'orientation' },
  thermal_block: { thermalCoupling: 'conductivity' },
  emitter: { flowDirection: 'direction', particleMass: 'mass', capacityLimit: 'maxParticles', isActive: 'enabled' },
  sink: { thermalFilter: 'tempFilterMode', cutoffTemp: 'filterTemperature', efficiency: 'absorptionEfficiency', maxAbsorbed: 'maxParticles' },
  regulator: { maxFlowRate: 'rate' }
};

const PISTON_COMMANDS = ['drive_tdc', 'drive_bdc', 'hold', 'release'];
const RUN_MODES = ['free', 'spring', 'motorized', 'damper'];

/**
 * Translates an action (possibly saved by an older version, where the
 * sequencer used its own keys) to schema keys. `item` resolves generic types.
 */
export function normalizeAction(act, item = null) {
  if (!act) return null;
  let type = LEGACY_TYPES[act.type] || act.type;
  if ((type === 'wall' || type === 'valve' || !ELEMENT_TYPES[type]) && item) type = elementTypeOf(item) || type;

  const out = { ...act, type };
  for (const [from, to] of Object.entries(LEGACY_KEYS[type] || {})) {
    if (act[from] !== undefined && act[to] === undefined) out[to] = act[from];
    if (from !== to) delete out[from];
  }

  if (type === 'piston') {
    const cmd = act.command || act.strokeCommand || (PISTON_COMMANDS.includes(act.mode) || act.mode === 'free' ? act.mode : null);
    if (cmd === 'free') {
      out.command = 'release';
      out.mode = RUN_MODES.includes(act.motionType) ? act.motionType : 'free';
    } else {
      out.command = PISTON_COMMANDS.includes(cmd) ? cmd : 'drive_tdc';
      const mode = RUN_MODES.includes(act.mode) ? act.mode : act.motionType;
      if (RUN_MODES.includes(mode)) out.mode = mode;
      else delete out.mode;
    }
    delete out.strokeCommand;
    delete out.motionType;
  } else if (type === 'manual_valve' && act.valveState !== undefined && act.isOpen === undefined) {
    out.isOpen = act.valveState === 'open';
  } else if (type === 'check_valve' && act.flowDirection !== undefined && act.allowedDirection === undefined) {
    out.allowedDirection = act.flowDirection === 'reverse' ? -1 : 1;
  } else if (type === 'relief_valve') {
    if (out.reliefMode === '1-way' || out.reliefMode === 'oneway') out.reliefMode = 'oneway';
    else if (out.reliefMode === '2-way' || out.reliefMode === 'twoway') out.reliefMode = 'bidirectional';
  } else if (type === 'throttle_valve' && act.state !== undefined) {
    out.isActive = true;
    if (act.state === 'bypassed') out.openRatio = 1;
  } else if (type === 'emitter' && act.state !== undefined && act.enabled === undefined) {
    out.enabled = act.state !== 'paused';
  } else if (type === 'sink') {
    if (out.tempFilterMode === 'hot') out.tempFilterMode = 'above';
    if (out.tempFilterMode === 'cold') out.tempFilterMode = 'below';
  }
  for (const k of ['valveState', 'flowDirection', 'state', 'thermalCoupling', 'conductance'].filter(k => k in out)) {
    const known = fieldsFor(type, 'sequencer').some(f => f.key === k);
    if (!known) delete out[k];
  }
  return out;
}

// Form values for an action dialog: the element's current values, overridden by the action.
export function actionValues(item, act = null) {
  const type = actionTypeOf(item);
  if (!type) return {};
  const values = readValues(type, item, 'sequencer');
  if (type === 'piston') values.command = 'drive_tdc';
  if (!act) return values;
  const norm = normalizeAction(act, item);
  fieldsFor(type, 'sequencer').forEach(f => {
    if (norm[f.key] !== undefined) values[f.key] = norm[f.key];
  });
  return values;
}

export function makeAction(item, values, existing = {}) {
  return {
    id: existing.id || 'act_' + Math.random().toString(36).substring(2, 9),
    targetId: item.id,
    type: actionTypeOf(item),
    ...values
  };
}

function findElement(engine, id) {
  return (engine.elements || []).find(el => el.id === id) || null;
}

// Applies an action's values to its element; pistons then execute the drive command.
export function applyAction(act, engine) {
  const item = findElement(engine, act?.targetId);
  if (!item) return;
  const type = actionTypeOf(item);
  if (!type) return;
  const norm = normalizeAction(act, item);

  fieldsFor(type, 'sequencer').forEach(f => {
    if (f.key === 'command' || f.key === 'targetSpeed' || norm[f.key] === undefined) return;
    setFieldValue(f, item, norm[f.key], engine);
  });

  if (type === 'piston') {
    if (norm.command === 'drive_tdc' || norm.command === 'drive_bdc') {
      item.mode = 'controlled';
      item.targetPos = SequencerConditions.resolvePistonTarget(item, norm.command, !!norm.invertTdcBdc);
      item.targetSpeed = norm.targetSpeed !== undefined ? norm.targetSpeed : 160;
    } else if (norm.command === 'hold') {
      item.mode = 'hold';
      item.velocity = 0;
    } else {
      item.mode = norm.mode || 'free';
    }
  }
}

// One-line description for the timeline.
export function summarizeAction(act, item = null) {
  const a = normalizeAction(act, item);
  if (!a) return 'No action';
  const T = v => `${Math.round(v)} K`;
  switch (a.type) {
    case 'piston':
      if (a.command === 'drive_tdc') return 'Drive to TDC';
      if (a.command === 'drive_bdc') return 'Drive to BDC';
      if (a.command === 'hold') return 'Hold position';
      return `Release (${a.mode || 'free'})`;
    case 'throttle_valve': return a.isActive === false ? 'Disabled' : `Opening ${Math.round((a.openRatio ?? 0.3) * 100)}%`;
    case 'manual_valve': return a.isOpen ? 'Open' : 'Closed';
    case 'check_valve': return a.allowedDirection === -1 ? 'Reverse (←)' : 'Forward (→)';
    case 'relief_valve': return `P_max ${a.triggerPressure ?? 250} Pa`;
    case 'wall': return `κ = ${(a.conductivity ?? 0).toFixed(2)}`;
    case 'reservoir':
    case 'heat_exchanger':
    case 'regenerator':
    case 'thermal_block': return a.isActive === false ? 'Inactive' : (a.temperature !== undefined ? T(a.temperature) : 'Active');
    case 'emitter': return a.enabled === false ? 'Paused' : `${a.rate ?? 8}/s @ ${T(a.temperature ?? 300)}`;
    case 'sink': return a.isActive === false ? 'Inactive' : `${Math.round((a.absorptionEfficiency ?? 1) * 100)}% efficiency`;
    case 'regulator': return a.isActive === false ? 'Inactive' : `Target N = ${a.targetCount ?? 50}`;
    default: return 'Snapshot';
  }
}
