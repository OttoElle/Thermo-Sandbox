/**
 * SequencerConditions.js
 * Transition conditions of the cycle sequencer: time, piston position and
 * sensor chamber measurements, combined in a 2D grid (AND/OR within a row,
 * AND/OR between rows). Also the piston stroke geometry shared with the
 * actions (TDC/BDC and stroke positions).
 *
 * Conditions:
 *   { type: 'duration', duration }
 *   { type: 'piston', pistonId, pistonTarget: 'step' | 'tdc' | 'bdc' | 'above' | 'below', strokePos }
 *     no pistonId: every piston this step drives has reached its drive target
 *   { type: 'sensor', sensorId, sensorMetric, sensorOperator: '>=' | '<=', sensorThreshold }
 */

import { normalizeAction } from './SequencerActions.js';

// A driven piston snaps onto its target, so "reached" means arrived.
const REACH_TOLERANCE = 0.5; // px

// Ends of a piston's stroke. TDC is the end with the smallest gas volume: the
// gas side comes from a sensor chamber bound to the piston (default: gas on
// the low-coordinate side, i.e. left of / above the piston).
export function strokeEnds(piston, engine) {
  const { minTravel, maxTravel } = piston.getTravelLimits();
  const gasOnMaxSide = (engine?.sensors || []).some(s => s.getPistonBindings?.().some(b =>
    b.pistonId === piston.id && (b.edge === 'left' || b.edge === 'top')));
  return gasOnMaxSide ? { tdc: maxTravel, bdc: minTravel } : { tdc: minTravel, bdc: maxTravel };
}

// Piston position as a fraction of its stroke: 0 = TDC, 1 = BDC.
export function strokeFraction(piston, engine) {
  const { tdc, bdc } = strokeEnds(piston, engine);
  return Math.abs(bdc - tdc) < 1e-6 ? 0 : (piston.getPos() - tdc) / (bdc - tdc);
}

// Position a drive command moves the piston to ('drive_tdc' | 'drive_bdc' | 'drive_to' with `strokePercent`).
export function pistonGoal(piston, command, engine, strokePercent = 50, invert = false) {
  let { tdc, bdc } = strokeEnds(piston, engine);
  if (invert) [tdc, bdc] = [bdc, tdc];
  if (command === 'drive_tdc' || command === 'tdc') return tdc;
  if (command === 'drive_bdc' || command === 'bdc') return bdc;
  const f = Math.max(0, Math.min(100, Number(strokePercent) || 0)) / 100;
  return tdc + (bdc - tdc) * f;
}

export const DRIVE_COMMANDS = ['drive_tdc', 'drive_bdc', 'drive_to'];

// Sensor quantities a condition can compare.
export const SENSOR_METRICS = {
  temperature: { label: 'Temperature T', symbol: 'T', unit: 'K', get: s => s.temperature },
  pressure: { label: 'Pressure P', symbol: 'P', unit: 'Pa', get: s => s.pressure },
  facePressure: { label: 'Piston Pressure P_piston', symbol: 'P_piston', unit: 'Pa', get: s => s.facePressure ?? s.pressure },
  volume: { label: 'Volume V', symbol: 'V', unit: 'px²', get: s => s.volume },
  count: { label: 'Particles N', symbol: 'N', unit: '', get: s => s.particleCount }
};

function sensorValue(sensor, metric) {
  if (metric === 'pressure_kpa') return sensor.pressure / 1000; // older saves
  return (SENSOR_METRICS[metric] || SENSOR_METRICS.pressure).get(sensor);
}

export class SequencerConditions {
  // Legacy entry point (TDC/BDC by the piston's own axis unless `invert`).
  static resolvePistonTarget(piston, command, invert = false, engine = null) {
    return piston?.getTravelLimits ? pistonGoal(piston, command, engine, 50, invert) : (piston ? piston.getPos() : 0);
  }

  // Pistons a piston condition watches, each with the position it must reach (or a stroke threshold).
  static _pistonGoals(cond, engine, step) {
    const pistons = engine.pistons || [];
    const goals = [];
    const driveGoal = (p, act) => {
      const a = normalizeAction(act, p);
      if (!DRIVE_COMMANDS.includes(a.command)) return null;
      return pistonGoal(p, a.command, engine, a.strokeTarget, !!a.invertTdcBdc);
    };
    const stepAction = (p) => (step?.actions || []).find(a => a.targetId === p.id && a.type === 'piston');

    if (!cond.pistonId) {
      for (const act of (step?.actions || [])) {
        const p = act.type === 'piston' ? pistons.find(x => x.id === act.targetId) : null;
        const goal = p ? driveGoal(p, act) : null;
        if (goal !== null) goals.push({ piston: p, goal });
      }
      return goals;
    }
    const p = pistons.find(x => x.id === cond.pistonId);
    if (!p) return goals;
    const target = cond.pistonTarget || 'tdc';
    if (target === 'above' || target === 'below') {
      goals.push({ piston: p, threshold: (Number(cond.strokePos) || 0) / 100, dir: target });
    } else if (target === 'step') {
      const act = stepAction(p);
      const goal = act ? driveGoal(p, act) : null;
      if (goal !== null) goals.push({ piston: p, goal });
    } else {
      goals.push({ piston: p, goal: pistonGoal(p, target, engine, 50, !!cond.invert) });
    }
    return goals;
  }

  /**
   * Evaluates an individual condition against the current simulation state.
   */
  static evaluateSingle(cond, elapsedStepTime, engine, step) {
    if (!cond) return { met: true, progress: 1.0 };
    const type = cond.type || 'duration';

    if (type === 'duration') {
      const dur = Math.max(0.05, cond.duration !== undefined ? cond.duration : 1.5);
      return { met: elapsedStepTime >= dur, progress: Math.min(1.0, elapsedStepTime / dur) };
    }

    if (type === 'piston' || type === 'piston_target') {
      const goals = this._pistonGoals(cond, engine, step);
      // Nothing to watch (no driven piston, piston deleted): never blocks the cycle for long.
      if (goals.length === 0) {
        const fallback = cond.fallbackTimeout || 1.5;
        return { met: elapsedStepTime >= fallback, progress: Math.min(1.0, elapsedStepTime / fallback) };
      }
      let allMet = true, total = 0;
      for (const g of goals) {
        if (g.dir) {
          const f = strokeFraction(g.piston, engine);
          const met = g.dir === 'above' ? f >= g.threshold - 1e-3 : f <= g.threshold + 1e-3;
          allMet = allMet && met;
          total += met ? 1 : Math.max(0, 1 - Math.abs(f - g.threshold));
        } else {
          const dist = Math.abs(g.goal - g.piston.getPos());
          allMet = allMet && dist <= REACH_TOLERANCE;
          const stroke = Math.max(10, g.piston.getTravelLimits().stroke || 100);
          total += Math.max(0, Math.min(1.0, 1.0 - dist / stroke));
        }
      }
      return { met: allMet, progress: allMet ? 1 : total / goals.length };
    }

    if (type === 'sensor') {
      const sensor = (engine.sensors || []).find(s => s.id === cond.sensorId);
      if (!sensor) return { met: false, progress: 0.0 };
      const val = sensorValue(sensor, cond.sensorMetric || 'pressure');
      const thresh = cond.sensorThreshold !== undefined ? cond.sensorThreshold : 200;
      const op = cond.sensorOperator || '>=';
      const met = op === '>=' ? val >= thresh : op === '<=' ? val <= thresh : op === '>' ? val > thresh : val < thresh;
      let progress = met ? 1 : 0;
      if (!met && thresh > 0 && val > 0) progress = op.startsWith('>') ? val / thresh : thresh / val;
      return { met, progress: Math.max(0, Math.min(1, progress)) };
    }

    return { met: true, progress: 1.0 };
  }

  /**
   * Normalizes any transition object (legacy single condition, flat array, or 2D grid)
   * into a canonical 2D compound grid structure. fallbackTimeout 0 = no timeout.
   */
  static normalizeTransition(trans) {
    const grid = (rows, rowOperators, fallbackTimeout) => ({ type: 'compound_grid', fallbackTimeout, rows, rowOperators });
    if (!trans) return grid([{ conditions: [{ type: 'duration', duration: 1.5 }], operators: [] }], [], 0);

    const timeout = trans.fallbackTimeout !== undefined ? trans.fallbackTimeout : 0;

    if (Array.isArray(trans.rows) && trans.rows.length > 0) {
      const rows = trans.rows.map(r => {
        const conds = Array.isArray(r.conditions) && r.conditions.length > 0
          ? r.conditions.map(c => ({ ...c }))
          : [{ type: 'duration', duration: 1.5 }];
        const ops = Array.isArray(r.operators) ? [...r.operators] : [];
        while (ops.length < conds.length - 1) ops.push('AND');
        return { conditions: conds, operators: ops };
      });
      const rowOps = Array.isArray(trans.rowOperators) ? [...trans.rowOperators] : [];
      while (rowOps.length < rows.length - 1) rowOps.push('OR');
      return grid(rows, rowOps, timeout);
    }

    if (Array.isArray(trans.conditions) && trans.conditions.length > 0) {
      const op = (trans.operator || 'AND').toUpperCase();
      const ops = Array(Math.max(0, trans.conditions.length - 1)).fill(op);
      return grid([{ conditions: trans.conditions.map(c => ({ ...c })), operators: ops }], [], timeout);
    }

    const singleCond = { ...trans };
    delete singleCond.fallbackTimeout;
    return grid([{ conditions: [singleCond.type ? singleCond : { type: 'duration', duration: 1.5 }], operators: [] }], [], timeout);
  }

  /**
   * Evaluates a list of results and binary operators using standard Boolean precedence (AND before OR).
   */
  static evaluateSequence(evalResults, operators = []) {
    if (!evalResults || evalResults.length === 0) return { met: true, progress: 1.0 };
    if (evalResults.length === 1) return evalResults[0];

    const orGroups = [];
    let currentAndGroup = [evalResults[0]];
    for (let i = 0; i < operators.length; i++) {
      const op = (operators[i] || 'AND').toUpperCase();
      const nextItem = evalResults[i + 1] || { met: true, progress: 1.0 };
      if (op === 'AND' || op === '&') {
        currentAndGroup.push(nextItem);
      } else {
        orGroups.push(currentAndGroup);
        currentAndGroup = [nextItem];
      }
    }
    orGroups.push(currentAndGroup);

    const groupResults = orGroups.map(group => {
      const allMet = group.every(item => item.met);
      const avgProg = group.reduce((sum, item) => sum + item.progress, 0) / group.length;
      return { met: allMet, progress: allMet ? 1.0 : avgProg };
    });
    const anyMet = groupResults.some(g => g.met);
    return { met: anyMet, progress: anyMet ? 1.0 : Math.max(...groupResults.map(g => g.progress)) };
  }

  /**
   * Evaluates 2D compound transition grid with bracketed rows and Boolean precedence.
   */
  static evaluate(transition, elapsedStepTime, engine, step) {
    if (!transition) return { met: true, progress: 1.0 };
    const norm = this.normalizeTransition(transition);
    if (norm.fallbackTimeout > 0 && elapsedStepTime >= norm.fallbackTimeout) return { met: true, progress: 1.0 };

    const rowResults = norm.rows.map(row => this.evaluateSequence(
      row.conditions.map(c => this.evaluateSingle(c, elapsedStepTime, engine, step)), row.operators));
    return this.evaluateSequence(rowResults, norm.rowOperators);
  }
}
