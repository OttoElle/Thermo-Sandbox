/**
 * SequencerConditions.js
 * Compound Transition Condition Evaluator for Thermodynamic Cycle Sequencer
 * Evaluates Time, Piston Position, and Sensor Metrics with AND/OR Logic.
 */

export class SequencerConditions {
  /**
   * Helper to resolve target position for a piston given a command:
   * 'tdc': Top Dead Center (minimum chamber volume / min travel)
   * 'bdc': Bottom Dead Center (maximum chamber volume / max travel)
   */
  static resolvePistonTarget(piston, command, invert = false) {
    if (!piston || typeof piston.getTravelLimits !== 'function') {
      return piston ? piston.getPos() : 0;
    }
    const limits = piston.getTravelLimits();
    const isTdc = command === 'tdc' || command === 'drive_tdc';
    if (!invert) {
      return isTdc ? limits.minTravel : limits.maxTravel;
    } else {
      return isTdc ? limits.maxTravel : limits.minTravel;
    }
  }

  /**
   * Evaluates an individual condition against the current simulation state.
   */
  static evaluateSingle(cond, elapsedStepTime, engine, step) {
    if (!cond) return { met: true, progress: 1.0 };
    const type = cond.type || 'duration';

    if (type === 'duration') {
      const dur = Math.max(0.05, cond.duration !== undefined ? cond.duration : 1.5);
      const met = elapsedStepTime >= dur;
      const progress = Math.min(1.0, elapsedStepTime / dur);
      return { met, progress };
    }

    if (type === 'piston' || type === 'piston_target') {
      let targetPistons = [];
      if (cond.pistonId) {
        const p = (engine.pistons || []).find(item => item.id === cond.pistonId);
        if (p) {
          targetPistons.push({
            piston: p,
            target: cond.pistonTarget || 'tdc',
            targetPos: cond.targetPos,
            invert: !!cond.invert
          });
        }
      } else if (step && Array.isArray(step.actions)) {
        // Collect all pistons commanded in this step if no specific piston is set
        const driving = step.actions.filter(a => a.type === 'piston' && a.targetId);
        for (const act of driving) {
          const p = (engine.pistons || []).find(item => item.id === act.targetId);
          if (p) {
            const tgt = (act.mode === 'drive_tdc' || act.mode === 'drive_bdc') ? act.mode.replace('drive_', '') : (act.mode === 'controlled' ? 'custom' : 'tdc');
            targetPistons.push({
              piston: p,
              target: tgt,
              targetPos: act.targetPos,
              invert: !!act.invertTdcBdc
            });
          }
        }
      }

      if (targetPistons.length === 0) {
        const fallback = cond.fallbackTimeout || 1.5;
        const met = elapsedStepTime >= fallback;
        return { met, progress: Math.min(1.0, elapsedStepTime / fallback) };
      }

      let allReached = true;
      let totalFraction = 0;

      for (let i = 0; i < targetPistons.length; i++) {
        const item = targetPistons[i];
        const p = item.piston;
        let goal = 0;

        if (item.target === 'tdc' || item.target === 'bdc') {
          goal = this.resolvePistonTarget(p, item.target, !!item.invert);
        } else if (item.targetPos !== undefined) {
          goal = item.targetPos;
        } else {
          goal = p.getPos();
        }

        const dist = Math.abs(goal - p.getPos());
        if (dist > 3.5) {
          allReached = false;
        }

        const limits = p.getTravelLimits ? p.getTravelLimits() : { stroke: 100 };
        const stroke = Math.max(10, limits.stroke || 100);
        totalFraction += Math.max(0, Math.min(1.0, 1.0 - (dist / stroke)));
      }

      const progress = totalFraction / targetPistons.length;
      return { met: allReached, progress };
    }

    if (type === 'sensor') {
      const sensor = (engine.sensors || []).find(s => s.id === cond.sensorId);
      if (!sensor) {
        return { met: false, progress: 0.0 };
      }

      const metric = cond.sensorMetric || 'pressure';
      // Sensor pressure is stored in Pa, metric can be Pa or kPa
      let val = metric === 'temperature' ? sensor.temperature : sensor.pressure;
      if (metric === 'pressure_kpa') {
        val = sensor.pressure / 1000.0;
      }

      const thresh = cond.sensorThreshold !== undefined ? cond.sensorThreshold : 200;
      const op = cond.sensorOperator || '>=';
      let met = false;

      if (op === '>=' && val >= thresh) met = true;
      else if (op === '<=' && val <= thresh) met = true;
      else if (op === '>' && val > thresh) met = true;
      else if (op === '<' && val < thresh) met = true;

      // Approximate progress based on threshold comparison
      let progress = 0;
      if (thresh !== 0) {
        progress = Math.max(0, Math.min(1.0, val / thresh));
        if (met) progress = 1.0;
      } else {
        progress = met ? 1.0 : 0.0;
      }

      return { met, progress };
    }

    return { met: true, progress: 1.0 };
  }

  /**
   * Normalizes any transition object (legacy single condition, flat array, or 2D grid)
   * into a canonical 2D compound grid structure.
   */
  static normalizeTransition(trans) {
    if (!trans) {
      return {
        type: 'compound_grid',
        fallbackTimeout: 10.0,
        rows: [{ conditions: [{ type: 'duration', duration: 1.5 }], operators: [] }],
        rowOperators: []
      };
    }

    const timeout = trans.fallbackTimeout !== undefined ? trans.fallbackTimeout : 10.0;

    if (Array.isArray(trans.rows) && trans.rows.length > 0) {
      const rows = trans.rows.map(r => {
        const conds = Array.isArray(r.conditions) && r.conditions.length > 0
          ? r.conditions.map(c => ({ ...c }))
          : [{ type: 'duration', duration: 1.5 }];
        const ops = Array.isArray(r.operators) ? [...r.operators] : [];
        while (ops.length < conds.length - 1) {
          ops.push('AND');
        }
        return { conditions: conds, operators: ops };
      });
      const rowOps = Array.isArray(trans.rowOperators) ? [...trans.rowOperators] : [];
      while (rowOps.length < rows.length - 1) {
        rowOps.push('OR');
      }
      return {
        type: 'compound_grid',
        fallbackTimeout: timeout,
        rows,
        rowOperators: rowOps
      };
    }

    if (Array.isArray(trans.conditions) && trans.conditions.length > 0) {
      const op = (trans.operator || 'AND').toUpperCase();
      const ops = Array(Math.max(0, trans.conditions.length - 1)).fill(op);
      return {
        type: 'compound_grid',
        fallbackTimeout: timeout,
        rows: [{
          conditions: trans.conditions.map(c => ({ ...c })),
          operators: ops
        }],
        rowOperators: []
      };
    }

    const singleCond = { ...trans };
    delete singleCond.fallbackTimeout;
    return {
      type: 'compound_grid',
      fallbackTimeout: timeout,
      rows: [{
        conditions: [singleCond.type ? singleCond : { type: 'duration', duration: 1.5 }],
        operators: []
      }],
      rowOperators: []
    };
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
      const sumProg = group.reduce((sum, item) => sum + item.progress, 0);
      const avgProg = sumProg / group.length;
      return { met: allMet, progress: allMet ? 1.0 : avgProg };
    });

    const anyMet = groupResults.some(g => g.met);
    const maxProg = Math.max(...groupResults.map(g => g.progress));
    return { met: anyMet, progress: anyMet ? 1.0 : maxProg };
  }

  /**
   * Evaluates 2D compound transition grid with bracketed rows and Boolean precedence.
   */
  static evaluate(transition, elapsedStepTime, engine, step) {
    if (!transition) {
      return { met: true, progress: 1.0 };
    }

    const norm = this.normalizeTransition(transition);

    const timeout = norm.fallbackTimeout;
    if (timeout > 0 && elapsedStepTime >= timeout) {
      return { met: true, progress: 1.0 };
    }

    const rowResults = norm.rows.map(row => {
      const condResults = row.conditions.map(c =>
        this.evaluateSingle(c, elapsedStepTime, engine, step)
      );
      return this.evaluateSequence(condResults, row.operators);
    });

    return this.evaluateSequence(rowResults, norm.rowOperators);
  }
}
