/**
 * SequencerTransitionDialog.js
 * Modal Configuration Dialog for Arbitrary 2D Compound Transition Conditions.
 * Integrates SequencerTransitionBuilder for bracketed row blocks and Boolean precedence.
 */

import { SequencerTransitionBuilder } from './SequencerTransitionBuilder.js';
import { renderPropertyForm } from '../app/propertyForm.js';

// Safety timeout: the step advances after this time even if its conditions never hold.
const TIMEOUT_FIELD = { key: 'fallbackTimeout', label: 'Safety Timeout (0 = off)', kind: 'number', min: 0, max: 120, step: 1, def: 0, unit: 's' };

export class SequencerTransitionDialog {
  constructor(engine, onTransitionSaved) {
    this.engine = engine;
    this.onTransitionSaved = onTransitionSaved;
    this.targetStepIndex = null;
    this.modalEl = null;
    this.builder = new SequencerTransitionBuilder();

    this._initDOM();
  }

  _initDOM() {
    let modal = document.getElementById('seqTransitionModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'seqTransitionModal';
      modal.className = 'modal-overlay';
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="modal-card" style="width: 580px; max-width: 95vw;">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="tool-dialog-badge" style="background:rgba(56,189,248,0.18); color:#38bdf8;">GATE</span>
              <h3 id="seqTransTitle" style="font-size:13px;">Transition</h3>
            </div>
            <button id="seqTransBtnClose" class="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body" style="padding:16px; gap:12px;">
            <div class="seq-trans-intro">
              Advance to the next step when these conditions hold. Conditions in a row are bracketed;
              click <b>&amp;</b> / <b>||</b> to switch between AND and OR.
            </div>

            <!-- 2D Grid Container -->
            <div id="seqTransGridContainer" class="seq-trans-grid-container" style="max-height:340px; overflow-y:auto; padding-right:4px;"></div>

            <div id="seqTransTimeout" class="seq-trans-timeout"></div>

            <div class="modal-actions-row" style="margin-top:8px;">
              <button id="seqTransBtnCancel" class="btn-pill btn-secondary-action">Cancel</button>
              <button id="seqTransBtnSave" class="btn-pill btn-primary-action">Apply Transition</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    this.modalEl = modal;

    // Modal action buttons
    modal.querySelector('#seqTransBtnClose')?.addEventListener('click', () => this.close());
    modal.querySelector('#seqTransBtnCancel')?.addEventListener('click', () => this.close());
    modal.querySelector('#seqTransBtnSave')?.addEventListener('click', () => this._saveTransition());
  }

  open(stepIndex) {
    this.targetStepIndex = stepIndex;
    const step = this.engine.sequencer?.steps[stepIndex];
    if (!step) return;

    const steps = this.engine.sequencer.steps;
    const title = document.getElementById('seqTransTitle');
    if (title) {
      const next = stepIndex + 1 < steps.length ? stepIndex + 1 : (this.engine.sequencer.isLooping ? 0 : -1);
      const name = (i) => `${i + 1} · ${steps[i].name}`;
      title.textContent = `${name(stepIndex)}  ➔  ${next >= 0 ? name(next) : 'End'}`;
    }

    const transition = step.transition || step.trigger || { type: 'duration', duration: 1.5 };
    this.builder.setData(transition, this.engine);
    renderPropertyForm(this.modalEl.querySelector('#seqTransTimeout'), [TIMEOUT_FIELD], this.builder.data);

    // Render 2D Grid
    const gridContainer = this.modalEl.querySelector('#seqTransGridContainer');
    if (gridContainer) {
      this.builder.render(gridContainer, this.engine);
    }

    if (this.modalEl) this.modalEl.style.display = 'flex';
  }

  _saveTransition() {
    const step = this.engine.sequencer?.steps[this.targetStepIndex];
    if (!step) return;

    const transitionData = this.builder.getData();
    transitionData.fallbackTimeout = Math.max(0, Number(transitionData.fallbackTimeout) || 0);

    step.transition = transitionData;
    step.trigger = transitionData;

    this.close();
    if (typeof this.onTransitionSaved === 'function') {
      this.onTransitionSaved(this.targetStepIndex);
    }
  }

  close() {
    if (this.modalEl) this.modalEl.style.display = 'none';
  }
}

