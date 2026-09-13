/**
 * SequencerTransitionDialog.js
 * Modal Configuration Dialog for Arbitrary 2D Compound Transition Conditions.
 * Integrates SequencerTransitionBuilder for bracketed row blocks and Boolean precedence.
 */

import { SequencerTransitionBuilder } from './SequencerTransitionBuilder.js';

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
              <h3 id="seqTransTitle" style="font-size:13px;">Configure Transition Conditions</h3>
            </div>
            <button id="seqTransBtnClose" class="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body" style="padding:16px; gap:12px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:2px;">
              <span style="font-size:10px; font-weight:700; letter-spacing:0.5px; color:var(--text-muted); text-transform:uppercase;">
                Compound Conditions (Brackets &amp; Logic)
              </span>
              <span style="font-size:10px; color:var(--text-dim); font-style:italic;">
                Row: ( &amp; / || ) • Vertical: &amp; / ||
              </span>
            </div>

            <!-- 2D Grid Container -->
            <div id="seqTransGridContainer" class="seq-trans-grid-container" style="max-height:340px; overflow-y:auto; padding-right:4px;"></div>

            <!-- Fallback Safety Timeout -->
            <div class="field-row" style="margin-top:6px; padding-top:10px; border-top:1px solid var(--border-subtle);">
              <div class="field-label"><span>Fallback Safety Timeout</span><span class="field-num" id="lbl_seqTrans_timeout">10.0 s</span></div>
              <input type="range" id="seqTrans_timeout" min="1" max="60" step="0.5" value="10" class="styled-slider">
            </div>

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

    // Timeout slider readout
    const timeoutSlider = modal.querySelector('#seqTrans_timeout');
    const timeoutLbl = modal.querySelector('#lbl_seqTrans_timeout');
    timeoutSlider?.addEventListener('input', () => {
      if (timeoutLbl) timeoutLbl.textContent = `${parseFloat(timeoutSlider.value).toFixed(1)} s`;
    });

    // Modal action buttons
    modal.querySelector('#seqTransBtnClose')?.addEventListener('click', () => this.close());
    modal.querySelector('#seqTransBtnCancel')?.addEventListener('click', () => this.close());
    modal.querySelector('#seqTransBtnSave')?.addEventListener('click', () => this._saveTransition());
  }

  open(stepIndex) {
    this.targetStepIndex = stepIndex;
    const step = this.engine.sequencer?.steps[stepIndex];
    if (!step) return;

    const title = document.getElementById('seqTransTitle');
    if (title) {
      const nextStepNum = stepIndex + 2 <= this.engine.sequencer.steps.length ? stepIndex + 2 : (this.engine.sequencer.isLooping ? '1' : 'End');
      title.textContent = `Transition Gate: ${step.name} ➔ Step ${nextStepNum}`;
    }

    const transition = step.transition || step.trigger || { type: 'duration', duration: 1.5 };
    this.builder.setData(transition, this.engine);

    // Set fallback timeout
    const timeoutSlider = this.modalEl.querySelector('#seqTrans_timeout');
    const timeoutLbl = this.modalEl.querySelector('#lbl_seqTrans_timeout');
    const timeoutVal = this.builder.data.fallbackTimeout !== undefined ? this.builder.data.fallbackTimeout : 10.0;
    if (timeoutSlider) timeoutSlider.value = timeoutVal;
    if (timeoutLbl) timeoutLbl.textContent = `${timeoutVal.toFixed(1)} s`;

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
    const timeout = parseFloat(this.modalEl.querySelector('#seqTrans_timeout')?.value || '10');
    transitionData.fallbackTimeout = timeout;

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

