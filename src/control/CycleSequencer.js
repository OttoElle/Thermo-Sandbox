/**
 * CycleSequencer.js
 * Precision GRAFCET State-Machine & Sequence Controller for Thermodynamic Cycles
 * Coordinates Pistons (TDC/BDC strokes), Throttle Valves, and Thermal Elements.
 */

export class CycleSequencer {
  constructor() {
    this.steps = [];
    this.phases = this.steps; // Backward compatibility alias
    this.isEnabled = false;
    this.isLooping = true;
    this.activeStepIndex = 0;
    this.activePhaseIndex = 0; // Alias
    this.elapsedStepTime = 0;
    this.elapsedPhaseTime = 0; // Alias
    this.currentCycleCount = 1;
    this.stepProgress = 0; // 0.0 to 1.0 for UI progress bar
    this.phaseProgress = 0; // Alias
    this.onStepChangeCallback = null;
    this.onPhaseChangeCallback = null; // Alias
  }

  addStep(options = {}) {
    const stepNum = this.steps.length + 1;
    const step = {
      id: options.id || 'step_' + Math.random().toString(36).substring(2, 9),
      name: options.name || `Step ${stepNum}`,
      actions: options.actions || [], // [{ type: 'piston'|'valve'|'thermal', targetId: '...', ... }]
      transition: options.transition || options.trigger || {
        type: 'duration', // 'duration' | 'piston_target' | 'sensor'
        duration: 1.5,    // seconds for duration trigger
        pistonId: null,   // specific piston target, or null for all controlled pistons
        pistonTarget: 'tdc', // 'tdc' | 'bdc'
        sensorId: null,   // for sensor trigger
        sensorMetric: 'pressure', // 'pressure' | 'temperature'
        sensorOperator: '>=',     // '>=' | '<='
        sensorThreshold: 200,     // kPa or K
        fallbackTimeout: 6.0      // safety fallback timeout in seconds
      }
    };
    // Ensure transition property is mirrored to trigger for compatibility
    step.trigger = step.transition;
    this.steps.push(step);
    return step;
  }

  addPhase(options = {}) {
    return this.addStep(options);
  }

  removeStep(index) {
    if (index >= 0 && index < this.steps.length) {
      this.steps.splice(index, 1);
      if (this.activeStepIndex >= this.steps.length) {
        this.activeStepIndex = Math.max(0, this.steps.length - 1);
        this.activePhaseIndex = this.activeStepIndex;
        this.elapsedStepTime = 0;
        this.elapsedPhaseTime = 0;
        this.stepProgress = 0;
        this.phaseProgress = 0;
      }
    }
  }

  removePhase(index) {
    return this.removeStep(index);
  }

  moveStep(fromIdx, toIdx) {
    if (fromIdx >= 0 && fromIdx < this.steps.length && toIdx >= 0 && toIdx < this.steps.length) {
      const [item] = this.steps.splice(fromIdx, 1);
      this.steps.splice(toIdx, 0, item);
      if (this.activeStepIndex === fromIdx) {
        this.activeStepIndex = toIdx;
        this.activePhaseIndex = toIdx;
      }
    }
  }

  movePhase(fromIdx, toIdx) {
    return this.moveStep(fromIdx, toIdx);
  }

  duplicateStep(index) {
    if (index >= 0 && index < this.steps.length) {
      const original = this.steps[index];
      const copy = {
        id: 'step_' + Math.random().toString(36).substring(2, 9),
        name: `${original.name} (Copy)`,
        actions: JSON.parse(JSON.stringify(original.actions || [])),
        transition: JSON.parse(JSON.stringify(original.transition || original.trigger || { type: 'duration', duration: 1.5 }))
      };
      copy.trigger = copy.transition;
      this.steps.splice(index + 1, 0, copy);
      return copy;
    }
    return null;
  }

  duplicatePhase(index) {
    return this.duplicateStep(index);
  }

  addAction(stepIndex, actionData) {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      const action = {
        id: 'act_' + Math.random().toString(36).substring(2, 9),
        type: actionData.type || 'piston',
        targetId: actionData.targetId || null,
        ...actionData
      };
      this.steps[stepIndex].actions.push(action);
      return action;
    }
    return null;
  }

  removeAction(stepIndex, actionIndex) {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      const actions = this.steps[stepIndex].actions;
      if (actionIndex >= 0 && actionIndex < actions.length) {
        actions.splice(actionIndex, 1);
      }
    }
  }

  reset() {
    this.activeStepIndex = 0;
    this.activePhaseIndex = 0;
    this.elapsedStepTime = 0;
    this.elapsedPhaseTime = 0;
    this.currentCycleCount = 1;
    this.stepProgress = 0;
    this.phaseProgress = 0;
  }

  getCurrentStep() {
    if (this.steps.length === 0) return null;
    if (this.activeStepIndex >= this.steps.length) {
      this.activeStepIndex = 0;
      this.activePhaseIndex = 0;
    }
    return this.steps[this.activeStepIndex];
  }

  getCurrentPhase() {
    return this.getCurrentStep();
  }

  /**
   * Helper to resolve target position for a piston given a command:
   * 'drive_tdc': Top Dead Center (minimum chamber volume / min travel)
   * 'drive_bdc': Bottom Dead Center (maximum chamber volume / max travel)
   */
  resolvePistonTarget(piston, command, invert = false) {
    if (!piston || typeof piston.getTravelLimits !== 'function') return piston ? piston.getPos() : 0;
    const limits = piston.getTravelLimits();
    const isTdc = command === 'drive_tdc' || command === 'tdc';
    if (!invert) {
      return isTdc ? limits.minTravel : limits.maxTravel;
    } else {
      return isTdc ? limits.maxTravel : limits.minTravel;
    }
  }

  applyStepActions(step, engine) {
    if (!step || !engine) return;

    for (let i = 0; i < step.actions.length; i++) {
      const act = step.actions[i];
      if (!act.targetId) continue;

      if (act.type === 'piston') {
        const piston = engine.pistons.find(p => p.id === act.targetId);
        if (piston) {
          const mode = act.mode || 'drive_tdc';
          if (mode === 'drive_tdc' || mode === 'drive_bdc') {
            piston.mode = 'controlled';
            piston.targetPos = this.resolvePistonTarget(piston, mode, !!act.invertTdcBdc);
            piston.targetSpeed = act.targetSpeed !== undefined ? act.targetSpeed : 160;
          } else if (mode === 'controlled') {
            piston.mode = 'controlled';
            piston.targetPos = act.targetPos !== undefined ? act.targetPos : piston.getPos();
            piston.targetSpeed = act.targetSpeed !== undefined ? act.targetSpeed : 160;
          } else if (mode === 'hold') {
            piston.mode = 'hold';
            piston.velocity = 0;
          } else if (mode === 'free') {
            piston.mode = 'free';
          }
        }
      } else if (act.type === 'valve') {
        const valve = engine.throttleValves.find(v => v.id === act.targetId);
        if (valve) {
          if (act.state === 'closed') {
            valve.openRatio = 0.0;
          } else if (act.state === 'open') {
            valve.openRatio = 1.0;
          } else if (act.openRatio !== undefined) {
            valve.openRatio = Math.max(0, Math.min(1, act.openRatio));
          }
          valve._updateGeometry();
        }
      } else if (act.type === 'thermal') {
        const block = (engine.thermalBlocks || []).find(b => b.id === act.targetId) ||
                      (engine.heatExchangers || []).find(hx => hx.id === act.targetId) ||
                      (engine.reservoirs || []).find(r => r.id === act.targetId);
        if (block) {
          if (act.state === 'insulated' || act.isActive === false) {
            block.isActive = false;
          } else {
            block.isActive = true;
          }
          if (act.temperature !== undefined) {
            block.temperature = act.temperature;
          }
        }
      }
    }
  }

  applyPhaseActions(phase, engine) {
    return this.applyStepActions(phase, engine);
  }

  advanceToNextStep(engine) {
    if (this.steps.length === 0) return;

    const nextIndex = this.activeStepIndex + 1;
    if (nextIndex >= this.steps.length) {
      if (this.isLooping) {
        this.currentCycleCount++;
        this.activeStepIndex = 0;
        this.activePhaseIndex = 0;
      } else {
        this.isEnabled = false;
        this.stepProgress = 1.0;
        this.phaseProgress = 1.0;
        return;
      }
    } else {
      this.activeStepIndex = nextIndex;
      this.activePhaseIndex = nextIndex;
    }

    this.elapsedStepTime = 0;
    this.elapsedPhaseTime = 0;
    this.stepProgress = 0;
    this.phaseProgress = 0;

    const newStep = this.getCurrentStep();
    if (newStep) {
      this.applyStepActions(newStep, engine);
    }

    if (typeof this.onStepChangeCallback === 'function') {
      this.onStepChangeCallback(this.activeStepIndex, this.currentCycleCount);
    }
    if (typeof this.onPhaseChangeCallback === 'function') {
      this.onPhaseChangeCallback(this.activePhaseIndex, this.currentCycleCount);
    }
  }

  advanceToNextPhase(engine) {
    return this.advanceToNextStep(engine);
  }

  step(dt, engine) {
    if (!this.isEnabled || this.steps.length === 0 || !engine) {
      return;
    }

    const step = this.getCurrentStep();
    if (!step) return;

    // Apply continuous controlled properties
    this.applyStepActions(step, engine);

    this.elapsedStepTime += dt;
    this.elapsedPhaseTime = this.elapsedStepTime;

    const transition = step.transition || step.trigger || { type: 'duration', duration: 1.5 };
    let conditionMet = false;

    if (transition.type === 'duration') {
      const totalDur = Math.max(0.05, transition.duration || 1.5);
      this.stepProgress = Math.min(1.0, this.elapsedStepTime / totalDur);
      this.phaseProgress = this.stepProgress;
      if (this.elapsedStepTime >= totalDur) {
        conditionMet = true;
      }
    } else if (transition.type === 'piston_target') {
      // Evaluate piston position: check specified piston or all driving pistons in this step
      let targetPistons = [];
      if (transition.pistonId) {
        const p = engine.pistons.find(item => item.id === transition.pistonId);
        if (p) targetPistons.push({ piston: p, target: transition.pistonTarget || 'tdc' });
      } else {
        // Collect all pistons commanded in this step
        const drivingActs = step.actions.filter(a => a.type === 'piston' && (a.mode === 'drive_tdc' || a.mode === 'drive_bdc' || a.mode === 'controlled'));
        for (const act of drivingActs) {
          const p = engine.pistons.find(item => item.id === act.targetId);
          if (p) {
            const tgt = (act.mode === 'drive_tdc' || act.mode === 'drive_bdc') ? act.mode.replace('drive_', '') : 'pos';
            targetPistons.push({ piston: p, target: tgt, targetPos: act.targetPos, invert: !!act.invertTdcBdc });
          }
        }
      }

      if (targetPistons.length === 0) {
        // Fallback to 1.5s if no pistons are active
        const fallback = transition.fallbackTimeout || 1.5;
        this.stepProgress = Math.min(1.0, this.elapsedStepTime / fallback);
        this.phaseProgress = this.stepProgress;
        if (this.elapsedStepTime >= fallback) conditionMet = true;
      } else {
        let allReached = true;
        let totalPct = 0;

        for (let i = 0; i < targetPistons.length; i++) {
          const item = targetPistons[i];
          const piston = item.piston;
          let goalPos = 0;
          if (item.target === 'tdc' || item.target === 'bdc') {
            goalPos = this.resolvePistonTarget(piston, item.target, !!item.invert);
          } else {
            goalPos = item.targetPos !== undefined ? item.targetPos : piston.getPos();
          }

          const curPos = piston.getPos();
          const dist = Math.abs(goalPos - curPos);
          if (dist > 3.0) {
            allReached = false;
          }

          const limits = piston.getTravelLimits();
          const stroke = Math.max(10, limits.stroke);
          const fraction = Math.max(0, Math.min(1, 1.0 - (dist / stroke)));
          totalPct += fraction;
        }

        this.stepProgress = totalPct / targetPistons.length;
        this.phaseProgress = this.stepProgress;

        const timeout = transition.fallbackTimeout || 8.0;
        if (allReached || this.elapsedStepTime >= timeout) {
          conditionMet = true;
        }
      }
    } else if (transition.type === 'sensor') {
      const sensor = engine.sensors.find(s => s.id === transition.sensorId);
      const timeout = transition.fallbackTimeout || 10.0;
      if (!sensor) {
        conditionMet = this.elapsedStepTime >= 1.5;
        this.stepProgress = Math.min(1.0, this.elapsedStepTime / 1.5);
        this.phaseProgress = this.stepProgress;
      } else {
        const val = transition.sensorMetric === 'temperature' ? sensor.temperature : (sensor.pressure / 1000.0); // kPa
        const thresh = transition.sensorThreshold !== undefined ? transition.sensorThreshold : 200;
        const op = transition.sensorOperator || '>=';

        if (op === '>=' && val >= thresh) conditionMet = true;
        else if (op === '<=' && val <= thresh) conditionMet = true;
        else if (op === '>' && val > thresh) conditionMet = true;
        else if (op === '<' && val < thresh) conditionMet = true;

        if (this.elapsedStepTime >= timeout) conditionMet = true;
        this.stepProgress = Math.min(1.0, this.elapsedStepTime / timeout);
        this.phaseProgress = this.stepProgress;
      }
    }

    if (conditionMet) {
      this.advanceToNextStep(engine);
    }
  }

  exportState() {
    return {
      isEnabled: this.isEnabled,
      isLooping: this.isLooping,
      activeStepIndex: this.activeStepIndex,
      activePhaseIndex: this.activeStepIndex,
      currentCycleCount: this.currentCycleCount,
      steps: JSON.parse(JSON.stringify(this.steps)),
      phases: JSON.parse(JSON.stringify(this.steps))
    };
  }

  importState(data) {
    if (!data) return;
    this.isEnabled = !!data.isEnabled;
    this.isLooping = data.isLooping !== undefined ? !!data.isLooping : true;
    this.activeStepIndex = typeof data.activeStepIndex === 'number' ? data.activeStepIndex : (typeof data.activePhaseIndex === 'number' ? data.activePhaseIndex : 0);
    this.activePhaseIndex = this.activeStepIndex;
    this.currentCycleCount = typeof data.currentCycleCount === 'number' ? data.currentCycleCount : 1;
    this.elapsedStepTime = 0;
    this.elapsedPhaseTime = 0;
    this.stepProgress = 0;
    this.phaseProgress = 0;
    
    const loaded = data.steps || data.phases;
    this.steps = Array.isArray(loaded) ? JSON.parse(JSON.stringify(loaded)) : [];
    this.phases = this.steps;

    // Ensure transition property is properly initialized for each step
    for (const step of this.steps) {
      if (!step.transition && step.trigger) {
        step.transition = step.trigger;
      }
    }
  }
}
