/**
 * CycleSequencer.js
 * Precision State-Machine & Phase Sequencer for Thermodynamic Cycles
 * Coordinates Pistons, Throttle Valves, and Thermal Elements in cyclic loops.
 */

export class CycleSequencer {
  constructor() {
    this.phases = [];
    this.isEnabled = false;
    this.isLooping = true;
    this.activePhaseIndex = 0;
    this.elapsedPhaseTime = 0;
    this.currentCycleCount = 1;
    this.phaseProgress = 0; // 0.0 to 1.0 for UI progress bar
    this.onPhaseChangeCallback = null;
  }

  addPhase(options = {}) {
    const phaseNum = this.phases.length + 1;
    const phase = {
      id: options.id || 'phase_' + Math.random().toString(36).substring(2, 9),
      name: options.name || `Takt ${phaseNum}`,
      actions: options.actions || [], // [{ type: 'piston'|'valve'|'thermal', targetId: '...', ... }]
      trigger: options.trigger || {
        type: 'duration', // 'duration' | 'piston_target' | 'sensor'
        duration: 1.0,    // seconds for duration trigger
        sensorId: null,   // for sensor trigger
        sensorMetric: 'pressure', // 'pressure' | 'temperature'
        sensorOperator: '>=',     // '>=' | '<='
        sensorThreshold: 200,     // kPa or K
        fallbackTimeout: 5.0      // safety fallback timeout in seconds
      }
    };
    this.phases.push(phase);
    return phase;
  }

  removePhase(index) {
    if (index >= 0 && index < this.phases.length) {
      this.phases.splice(index, 1);
      if (this.activePhaseIndex >= this.phases.length) {
        this.activePhaseIndex = Math.max(0, this.phases.length - 1);
        this.elapsedPhaseTime = 0;
        this.phaseProgress = 0;
      }
    }
  }

  movePhase(fromIdx, toIdx) {
    if (fromIdx >= 0 && fromIdx < this.phases.length && toIdx >= 0 && toIdx < this.phases.length) {
      const [item] = this.phases.splice(fromIdx, 1);
      this.phases.splice(toIdx, 0, item);
      if (this.activePhaseIndex === fromIdx) {
        this.activePhaseIndex = toIdx;
      }
    }
  }

  duplicatePhase(index) {
    if (index >= 0 && index < this.phases.length) {
      const original = this.phases[index];
      const copy = {
        id: 'phase_' + Math.random().toString(36).substring(2, 9),
        name: `${original.name} (Kopie)`,
        actions: JSON.parse(JSON.stringify(original.actions || [])),
        trigger: JSON.parse(JSON.stringify(original.trigger || { type: 'duration', duration: 1.0 }))
      };
      this.phases.splice(index + 1, 0, copy);
      return copy;
    }
    return null;
  }

  addAction(phaseIndex, actionData) {
    if (phaseIndex >= 0 && phaseIndex < this.phases.length) {
      const action = {
        id: 'act_' + Math.random().toString(36).substring(2, 9),
        type: actionData.type || 'piston',
        targetId: actionData.targetId || null,
        ...actionData
      };
      this.phases[phaseIndex].actions.push(action);
      return action;
    }
    return null;
  }

  removeAction(phaseIndex, actionIndex) {
    if (phaseIndex >= 0 && phaseIndex < this.phases.length) {
      const actions = this.phases[phaseIndex].actions;
      if (actionIndex >= 0 && actionIndex < actions.length) {
        actions.splice(actionIndex, 1);
      }
    }
  }

  reset() {
    this.activePhaseIndex = 0;
    this.elapsedPhaseTime = 0;
    this.currentCycleCount = 1;
    this.phaseProgress = 0;
  }

  getCurrentPhase() {
    if (this.phases.length === 0) return null;
    if (this.activePhaseIndex >= this.phases.length) this.activePhaseIndex = 0;
    return this.phases[this.activePhaseIndex];
  }

  applyPhaseActions(phase, engine) {
    if (!phase || !engine) return;

    for (let i = 0; i < phase.actions.length; i++) {
      const act = phase.actions[i];
      if (!act.targetId) continue;

      if (act.type === 'piston') {
        const piston = engine.pistons.find(p => p.id === act.targetId);
        if (piston) {
          if (act.mode === 'controlled') {
            piston.mode = 'controlled';
            piston.targetPos = act.targetPos !== undefined ? act.targetPos : piston.getPos();
            piston.targetSpeed = act.targetSpeed !== undefined ? act.targetSpeed : 150;
          } else if (act.mode === 'hold') {
            piston.mode = 'hold';
            piston.velocity = 0;
          } else if (act.mode === 'free') {
            piston.mode = 'free';
          }
        }
      } else if (act.type === 'valve') {
        const valve = engine.throttleValves.find(v => v.id === act.targetId);
        if (valve) {
          const ratio = act.openRatio !== undefined ? Math.max(0, Math.min(1, act.openRatio)) : 1.0;
          valve.openRatio = ratio;
          valve._updateGeometry();
        }
      } else if (act.type === 'thermal') {
        const block = (engine.thermalBlocks || []).find(b => b.id === act.targetId) ||
                      (engine.heatExchangers || []).find(hx => hx.id === act.targetId) ||
                      (engine.reservoirs || []).find(r => r.id === act.targetId);
        if (block) {
          if (act.temperature !== undefined) block.temperature = act.temperature;
          if (act.isActive !== undefined) block.isActive = act.isActive;
        }
      }
    }
  }

  advanceToNextPhase(engine) {
    if (this.phases.length === 0) return;

    const nextIndex = this.activePhaseIndex + 1;
    if (nextIndex >= this.phases.length) {
      if (this.isLooping) {
        this.currentCycleCount++;
        this.activePhaseIndex = 0;
      } else {
        this.isEnabled = false;
        this.phaseProgress = 1.0;
        return;
      }
    } else {
      this.activePhaseIndex = nextIndex;
    }

    this.elapsedPhaseTime = 0;
    this.phaseProgress = 0;

    const newPhase = this.getCurrentPhase();
    if (newPhase) {
      this.applyPhaseActions(newPhase, engine);
    }

    if (typeof this.onPhaseChangeCallback === 'function') {
      this.onPhaseChangeCallback(this.activePhaseIndex, this.currentCycleCount);
    }
  }

  step(dt, engine) {
    if (!this.isEnabled || this.phases.length === 0 || !engine) {
      return;
    }

    const phase = this.getCurrentPhase();
    if (!phase) return;

    // Apply continuous controlled properties
    this.applyPhaseActions(phase, engine);

    this.elapsedPhaseTime += dt;
    const trig = phase.trigger || { type: 'duration', duration: 1.0 };

    let conditionMet = false;

    if (trig.type === 'duration') {
      const totalDur = Math.max(0.05, trig.duration || 1.0);
      this.phaseProgress = Math.min(1.0, this.elapsedPhaseTime / totalDur);
      if (this.elapsedPhaseTime >= totalDur) {
        conditionMet = true;
      }
    } else if (trig.type === 'piston_target') {
      // Check if all pistons controlled in this phase have reached their targets
      const controlledActions = phase.actions.filter(a => a.type === 'piston' && a.mode === 'controlled');
      if (controlledActions.length === 0) {
        conditionMet = this.elapsedPhaseTime >= 1.0;
        this.phaseProgress = Math.min(1.0, this.elapsedPhaseTime / 1.0);
      } else {
        let allReached = true;
        let totalPct = 0;

        for (let i = 0; i < controlledActions.length; i++) {
          const act = controlledActions[i];
          const piston = engine.pistons.find(p => p.id === act.targetId);
          if (piston) {
            const curPos = piston.getPos();
            const target = act.targetPos !== undefined ? act.targetPos : curPos;
            const dist = Math.abs(target - curPos);
            if (dist > 2.5) {
              allReached = false;
            }
            const stroke = Math.max(10, Math.abs(target - (act._startPos !== undefined ? act._startPos : piston.minPos)));
            const moved = Math.max(0, stroke - dist);
            totalPct += Math.min(1.0, moved / stroke);
          }
        }
        this.phaseProgress = totalPct / controlledActions.length;

        const timeout = trig.fallbackTimeout || 8.0;
        if (allReached || this.elapsedPhaseTime >= timeout) {
          conditionMet = true;
        }
      }
    } else if (trig.type === 'sensor') {
      const sensor = engine.sensors.find(s => s.id === trig.sensorId);
      const timeout = trig.fallbackTimeout || 10.0;
      if (!sensor) {
        conditionMet = this.elapsedPhaseTime >= 1.5;
        this.phaseProgress = Math.min(1.0, this.elapsedPhaseTime / 1.5);
      } else {
        const val = trig.sensorMetric === 'temperature' ? sensor.temperature : (sensor.pressure / 1000.0); // Pressure in kPa
        const thresh = trig.sensorThreshold !== undefined ? trig.sensorThreshold : 200;
        const op = trig.sensorOperator || '>=';

        if (op === '>=' && val >= thresh) conditionMet = true;
        else if (op === '<=' && val <= thresh) conditionMet = true;
        else if (op === '>' && val > thresh) conditionMet = true;
        else if (op === '<' && val < thresh) conditionMet = true;

        if (this.elapsedPhaseTime >= timeout) conditionMet = true;
        this.phaseProgress = Math.min(1.0, this.elapsedPhaseTime / timeout);
      }
    }

    if (conditionMet) {
      this.advanceToNextPhase(engine);
    }
  }

  exportState() {
    return {
      isEnabled: this.isEnabled,
      isLooping: this.isLooping,
      activePhaseIndex: this.activePhaseIndex,
      currentCycleCount: this.currentCycleCount,
      phases: JSON.parse(JSON.stringify(this.phases))
    };
  }

  importState(data) {
    if (!data) return;
    this.isEnabled = !!data.isEnabled;
    this.isLooping = data.isLooping !== undefined ? !!data.isLooping : true;
    this.activePhaseIndex = typeof data.activePhaseIndex === 'number' ? data.activePhaseIndex : 0;
    this.currentCycleCount = typeof data.currentCycleCount === 'number' ? data.currentCycleCount : 1;
    this.elapsedPhaseTime = 0;
    this.phaseProgress = 0;
    this.phases = Array.isArray(data.phases) ? JSON.parse(JSON.stringify(data.phases)) : [];
  }
}
