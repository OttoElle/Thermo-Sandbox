/**
 * SequencerExecutor.js
 * Applies the actions of a sequencer step to the engine (see SequencerActions).
 */
import { applyAction } from './SequencerActions.js';

export class SequencerExecutor {
  static applyStepActions(step, engine) {
    if (!step || !engine || !Array.isArray(step.actions)) return;
    for (const act of step.actions) {
      if (act && act.targetId) applyAction(act, engine);
    }
  }

  static applySingleAction(act, engine) {
    applyAction(act, engine);
  }
}
