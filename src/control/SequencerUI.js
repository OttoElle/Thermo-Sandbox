/**
 * SequencerUI.js
 * Master UI Coordinator Facade for Thermodynamic Cycle Sequencer.
 * Integrates SequencerDock, SequencerTimeline, SequencerActionDialog, and SequencerTransitionDialog.
 */

import { SequencerDock } from './SequencerDock.js';
import { SequencerTimeline } from './SequencerTimeline.js';
import { SequencerActionDialog } from './SequencerActionDialog.js';
import { SequencerTransitionDialog } from './SequencerTransitionDialog.js';

export class SequencerUI {
  constructor(engine, renderer = null) {
    this.engine = engine;
    this.renderer = renderer;
    this.sequencer = engine.sequencer;

    // 1. Action snapshot configuration modal & picker
    this.actionDialog = new SequencerActionDialog(engine, () => {
      this.render();
      this.dock.updateBadges();
    }, renderer);

    // 2. Transition gate configuration modal
    this.transitionDialog = new SequencerTransitionDialog(engine, () => {
      this.render();
    });

    // 3. Timeline track renderer
    this.timeline = new SequencerTimeline(engine, {
      onAddElement: (sIdx) => this.actionDialog.startPicking(sIdx),
      onEditAction: (item, sIdx, act, aIdx) => this.actionDialog.openForElement(item, sIdx, act, aIdx),
      onEditTransition: (sIdx) => this.transitionDialog.open(sIdx),
      onStepModified: () => {
        this.dock.updateBadges();
        this.timeline.updateActiveStep();
      }
    }, renderer);

    // 4. Bottom dock controller
    this.dock = new SequencerDock(engine, {
      onToggle: (isOpen) => {
        if (isOpen) this.render();
      },
      onAddStep: () => {
        this.sequencer.addStep();
        this.render();
        this.dock.updateBadges();
      },
      onReset: () => {
        this.timeline.updateActiveStep();
      },
      onRenderRequest: () => {
        this.render();
      }
    });

    // Wire sequencer state callbacks
    if (this.sequencer) {
      this.sequencer.onStepChangeCallback = () => {
        this.dock.updateBadges();
        this.timeline.updateActiveStep();
      };
      this.sequencer.onPhaseChangeCallback = this.sequencer.onStepChangeCallback;
    }

    this.render();
  }

  get isOpen() {
    return this.dock ? this.dock.isOpen : false;
  }

  toggleDrawer() {
    this.dock?.toggleDrawer();
  }

  openDrawer() {
    this.dock?.openDrawer();
  }

  closeDrawer() {
    this.dock?.closeDrawer();
  }

  render() {
    this.timeline?.render();
    this.dock?.updateBadges();
  }

  updateBadges() {
    this.dock?.updateBadges();
  }

  updateActiveStep() {
    this.timeline?.updateActiveStep();
  }

  updateLive() {
    if (!this.sequencer || !this.sequencer.isEnabled) return;
    this.timeline?.updateActiveStep();
  }

  handleItemPicked(item) {
    if (this.actionDialog && this.actionDialog.isPicking) {
      return this.actionDialog.handleItemPicked(item);
    }
    return false;
  }
}
