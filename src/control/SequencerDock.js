/**
 * SequencerDock.js
 * Unified Bottom Dock Controller & Expansion Shell for Cycle Sequencer.
 */

export class SequencerDock {
  constructor(engine, callbacks = {}) {
    this.engine = engine;
    this.callbacks = callbacks; // { onToggle, onAddStep, onReset, onRenderRequest }
    this.isOpen = false;

    // DOM Elements
    this.drawerEl = document.getElementById('cycleSequencerDrawer');
    this.btnToggleSequencer = document.getElementById('btnToggleSequencer');
    this.chevronBtn = document.getElementById('seqDrawerChevron');
    this.headerEl = document.getElementById('seqDrawerHeader');
    this.btnActive = document.getElementById('seqBtnActive');
    this.btnLoop = document.getElementById('seqBtnLoop');
    this.cycleBadge = document.getElementById('seqCycleBadge');
    this.btnAddStep = document.getElementById('seqBtnAddStep');
    this.btnReset = document.getElementById('seqBtnReset');

    this._bindEvents();
    this.updateBadges();
  }

  _bindEvents() {
    // 1. Bottom Dock Toggle Button [⏱ Sequencer]
    this.btnToggleSequencer?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDrawer();
    });

    // 2. Chevron Button in Drawer Header
    this.chevronBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDrawer();
    });

    // 3. Header strip click (unless clicking a control)
    this.headerEl?.addEventListener('click', (e) => {
      if (e.target.closest('input, select, button, label, .seq-cycle-badge')) return;
      this.toggleDrawer();
    });

    // 4. Active Button Toggle
    this.btnActive?.addEventListener('click', (e) => {
      e.stopPropagation();
      const sequencer = this.engine.sequencer;
      if (sequencer) {
        sequencer.isEnabled = !sequencer.isEnabled;
      }
      this.updateBadges();
      if (typeof this.callbacks.onRenderRequest === 'function') {
        this.callbacks.onRenderRequest();
      }
    });

    // 5. Loop Button Toggle
    this.btnLoop?.addEventListener('click', (e) => {
      e.stopPropagation();
      const sequencer = this.engine.sequencer;
      if (sequencer) {
        sequencer.isLooping = !sequencer.isLooping;
      }
      this.updateBadges();
      if (typeof this.callbacks.onRenderRequest === 'function') {
        this.callbacks.onRenderRequest();
      }
    });

    // 6. Reset Button
    this.btnReset?.addEventListener('click', (e) => {
      e.stopPropagation();
      const sequencer = this.engine.sequencer;
      if (sequencer) {
        sequencer.reset();
      }
      this.updateBadges();
      if (typeof this.callbacks.onReset === 'function') {
        this.callbacks.onReset();
      }
    });

    // 7. Add Step Button
    this.btnAddStep?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof this.callbacks.onAddStep === 'function') {
        this.callbacks.onAddStep();
      }
      if (!this.isOpen) this.openDrawer();
    });
  }

  toggleDrawer() {
    if (this.isOpen) this.closeDrawer();
    else this.openDrawer();
  }

  openDrawer() {
    this.isOpen = true;
    if (this.drawerEl) {
      this.drawerEl.classList.remove('is-collapsed');
    }
    document.body.classList.add('sequencer-expanded');
    if (this.btnToggleSequencer) {
      this.btnToggleSequencer.classList.add('active');
    }
    if (this.chevronBtn) {
      this.chevronBtn.classList.add('is-expanded');
    }
    if (typeof this.callbacks.onToggle === 'function') {
      this.callbacks.onToggle(true);
    }
  }

  closeDrawer() {
    this.isOpen = false;
    if (this.drawerEl) {
      this.drawerEl.classList.add('is-collapsed');
    }
    document.body.classList.remove('sequencer-expanded');
    if (this.btnToggleSequencer) {
      this.btnToggleSequencer.classList.remove('active');
    }
    if (this.chevronBtn) {
      this.chevronBtn.classList.remove('is-expanded');
    }
    if (typeof this.callbacks.onToggle === 'function') {
      this.callbacks.onToggle(false);
    }
  }

  updateBadges() {
    const sequencer = this.engine.sequencer;
    if (!sequencer) return;

    const steps = sequencer.steps || [];
    const total = steps.length;

    // Update active toggle in bottom bar
    const dot = this.btnToggleSequencer?.querySelector('.seq-status-dot');
    if (dot) {
      dot.classList.toggle('active', sequencer.isEnabled);
    }

    if (this.btnActive) this.btnActive.classList.toggle('active', !!sequencer.isEnabled);
    if (this.btnLoop) this.btnLoop.classList.toggle('active', !!sequencer.isLooping);

    if (!this.cycleBadge) return;

    if (!sequencer.isEnabled) {
      this.cycleBadge.innerHTML = total === 0
        ? `<span class="seq-badge-status seq-status-idle">Idle (No Steps)</span>`
        : `<span class="seq-badge-status seq-status-paused">Paused (${total} Steps)</span>`;
    } else {
      const cur = sequencer.activeStepIndex + 1;
      this.cycleBadge.innerHTML = `
        <span class="seq-badge-status seq-status-active">RUNNING</span>
        <span class="seq-badge-meta">Cycle #${sequencer.currentCycleCount} • Step ${cur}/${total}</span>
      `;
    }
  }
}
