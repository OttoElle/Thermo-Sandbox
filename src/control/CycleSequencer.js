/**
 * CycleSequencer.js
 * Precision GRAFCET State-Machine Coordinator for Thermodynamic Cycle Sequencer
 * Coordinates Steps, Action Snapshots, Transitions, and Continuous Simulation Execution.
 */

import { SequencerConditions } from './SequencerConditions.js';
import { SequencerExecutor } from './SequencerExecutor.js';

export class CycleSequencer {
  constructor() {
    this.steps = [];
    this.phases = this.steps; // Compatibility alias
    this.isEnabled = false;
    this.isLooping = true;
    this.activeStepIndex = 0;
    this.activePhaseIndex = 0; // Compatibility alias
    this.elapsedStepTime = 0;
    this.elapsedPhaseTime = 0; // Compatibility alias
    this.currentCycleCount = 1;
    this.stepProgress = 0; // 0.0 to 1.0 for UI progress bar
    this.phaseProgress = 0; // Compatibility alias
    this.onStepChangeCallback = null;
    this.onPhaseChangeCallback = null; // Compatibility alias
    this.addStep({ name: 'Step 1' });
  }

  reset() {
    this.activeStepIndex = 0;
    this.activePhaseIndex = 0;
    this.elapsedStepTime = 0;
    this.elapsedPhaseTime = 0;
    this.currentCycleCount = 1;
    this.stepProgress = 0;
    this.phaseProgress = 0;
    if (this.steps.length === 0) {
      this.addStep({ name: 'Step 1' });
    }
  }

  addStep(options = {}) {
    const stepNum = this.steps.length + 1;
    const step = {
      id: options.id || 'step_' + Math.random().toString(36).substring(2, 9),
      name: options.name || `Step ${stepNum}`,
      actions: options.actions || [],
      transition: options.transition || options.trigger || {
        type: 'duration',
        duration: 1.5,
        operator: 'AND',
        conditions: [
          { type: 'duration', duration: 1.5 }
        ],
        fallbackTimeout: 10.0
      }
    };
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
      const orig = this.steps[index];
      const copy = {
        id: 'step_' + Math.random().toString(36).substring(2, 9),
        name: `${orig.name} (Copy)`,
        actions: JSON.parse(JSON.stringify(orig.actions || [])),
        transition: JSON.parse(JSON.stringify(orig.transition || orig.trigger || { type: 'duration', duration: 1.5 }))
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
        targetId: actionData.targetId || null,
        type: actionData.type || 'piston',
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

  applyStepActions(step, engine) {
    SequencerExecutor.applyStepActions(step, engine);
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

    const currentStep = this.getCurrentStep();
    if (!currentStep) return;

    // Apply continuous controlled properties
    this.applyStepActions(currentStep, engine);

    this.elapsedStepTime += dt;
    this.elapsedPhaseTime = this.elapsedStepTime;

    const transition = currentStep.transition || currentStep.trigger;
    const { met, progress } = SequencerConditions.evaluate(transition, this.elapsedStepTime, engine, currentStep);

    this.stepProgress = Math.max(0, Math.min(1.0, progress));
    this.phaseProgress = this.stepProgress;

    if (met) {
      this.advanceToNextStep(engine);
    }
  }

  exportState() {
    if (this.steps.length === 0) {
      this.addStep({ name: 'Step 1' });
    }
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
    this.steps = Array.isArray(loaded) && loaded.length > 0 ? JSON.parse(JSON.stringify(loaded)) : [];
    if (this.steps.length === 0) {
      this.addStep({ name: 'Step 1' });
    }
    this.phases = this.steps;

    for (const step of this.steps) {
      if (!step.transition && step.trigger) {
        step.transition = step.trigger;
      }
    }
  }
}
