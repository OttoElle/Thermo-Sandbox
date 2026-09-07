/**
 * SequencerUI.js
 * Visual GRAFCET Timeline Controller and Persistent Bottom Drawer
 * for Thermodynamic Cycle Sequencer
 */

export class SequencerUI {
  constructor(engine) {
    this.engine = engine;
    this.sequencer = engine.sequencer;
    this.isOpen = false;

    // DOM Elements
    this.drawerEl = document.getElementById('cycleSequencerDrawer');
    this.headerEl = document.getElementById('seqDrawerHeader');
    this.chevronBtn = document.getElementById('seqDrawerChevron');
    this.activeToggle = document.getElementById('seqToggleActive');
    this.loopToggle = document.getElementById('seqToggleLoop');
    this.cycleBadge = document.getElementById('seqCycleBadge');
    this.btnAddStep = document.getElementById('seqBtnAddStep');
    this.btnReset = document.getElementById('seqBtnReset');
    this.timelineTrack = document.getElementById('seqTimelineTrack');

    this._bindEvents();
    this.render();
  }

  _bindEvents() {
    // Header click toggles drawer (unless clicking a specific interactive element)
    this.headerEl?.addEventListener('click', (e) => {
      if (e.target.closest('input, select, button, label, .seq-cycle-badge')) {
        return;
      }
      this.toggleDrawer();
    });

    this.chevronBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDrawer();
    });

    this.activeToggle?.addEventListener('change', (e) => {
      this.sequencer.isEnabled = e.target.checked;
      this.updateBadges();
      this.updateActiveStep();
    });

    this.loopToggle?.addEventListener('change', (e) => {
      this.sequencer.isLooping = e.target.checked;
      this.render();
    });

    this.btnAddStep?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sequencer.addStep();
      this.render();
      if (!this.isOpen) this.openDrawer();
    });

    this.btnReset?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sequencer.reset();
      this.updateBadges();
      this.updateActiveStep();
    });

    this.sequencer.onStepChangeCallback = () => {
      this.updateBadges();
      this.updateActiveStep();
    };
    this.sequencer.onPhaseChangeCallback = this.sequencer.onStepChangeCallback;
  }

  toggleDrawer() {
    if (this.isOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  openDrawer() {
    this.isOpen = true;
    if (this.drawerEl) {
      this.drawerEl.classList.remove('is-collapsed');
    }
    document.body.classList.add('sequencer-expanded');
    if (this.chevronBtn) {
      this.chevronBtn.classList.add('is-expanded');
    }
    this.render();
  }

  closeDrawer() {
    this.isOpen = false;
    if (this.drawerEl) {
      this.drawerEl.classList.add('is-collapsed');
    }
    document.body.classList.remove('sequencer-expanded');
    if (this.chevronBtn) {
      this.chevronBtn.classList.remove('is-expanded');
    }
  }

  updateBadges() {
    if (!this.cycleBadge) return;
    const steps = this.sequencer.steps || this.sequencer.phases;
    const totalSteps = steps.length;

    if (totalSteps === 0) {
      this.cycleBadge.innerHTML = `<span class="seq-badge-status seq-status-idle">Idle (No Steps)</span>`;
      return;
    }

    if (!this.sequencer.isEnabled) {
      this.cycleBadge.innerHTML = `
        <span class="seq-badge-status seq-status-paused">Ready</span>
        <span class="seq-badge-meta">${totalSteps} Steps</span>
      `;
    } else {
      const cur = this.sequencer.activeStepIndex + 1;
      this.cycleBadge.innerHTML = `
        <span class="seq-badge-status seq-status-running">● Active</span>
        <span class="seq-badge-meta">Cycle #${this.sequencer.currentCycleCount} • Step ${cur}/${totalSteps}</span>
      `;
    }

    if (this.activeToggle) {
      this.activeToggle.checked = this.sequencer.isEnabled;
    }
    if (this.loopToggle) {
      this.loopToggle.checked = this.sequencer.isLooping;
    }
  }

  updateActiveStep() {
    if (!this.timelineTrack) return;
    const curIdx = this.sequencer.activeStepIndex;
    const isRunning = this.sequencer.isEnabled;

    const cards = this.timelineTrack.querySelectorAll('.seq-step-card');
    cards.forEach((card, idx) => {
      const isActive = isRunning && (curIdx === idx);
      card.classList.toggle('is-active', isActive);
    });

    const gates = this.timelineTrack.querySelectorAll('.seq-transition-gate');
    gates.forEach((gate, idx) => {
      const isActive = isRunning && (curIdx === idx);
      gate.classList.toggle('is-active', isActive);
      const fill = gate.querySelector('.seq-transition-progress-fill');
      if (fill) {
        fill.style.width = isActive ? `${Math.round(this.sequencer.stepProgress * 100)}%` : '0%';
      }
    });
  }

  updateLive() {
    if (!this.isOpen && !this.sequencer.isEnabled) return;
    this.updateBadges();
    this.updateActiveStep();
  }

  render() {
    if (!this.timelineTrack) return;
    this.updateBadges();

    const steps = this.sequencer.steps || this.sequencer.phases;

    if (steps.length === 0) {
      this.timelineTrack.innerHTML = `
        <div class="seq-empty-state">
          <div class="seq-empty-icon">⏱</div>
          <div class="seq-empty-title">No Thermodynamic Sequence Steps Defined</div>
          <div class="seq-empty-desc">Create your first step to coordinate pistons (TDC/BDC), throttle valves, and thermal reservoirs in cyclic loops.</div>
          <button class="seq-btn-empty-add" id="seqBtnEmptyAdd">+ Create Step 1</button>
        </div>
      `;
      document.getElementById('seqBtnEmptyAdd')?.addEventListener('click', () => {
        this.sequencer.addStep({ name: 'Step 1: Intake' });
        this.render();
      });
      return;
    }

    this.timelineTrack.innerHTML = '';

    steps.forEach((step, sIdx) => {
      // 1. Step Card (Actions)
      const stepCard = document.createElement('div');
      stepCard.className = `seq-step-card ${this.sequencer.isEnabled && this.sequencer.activeStepIndex === sIdx ? 'is-active' : ''}`;
      stepCard.dataset.stepIndex = sIdx;

      const headerHtml = `
        <div class="seq-card-header">
          <div class="seq-card-num-badge">${sIdx + 1}</div>
          <input type="text" class="seq-step-title-input" value="${step.name || `Step ${sIdx + 1}`}" placeholder="Step Name">
          <div class="seq-card-tools">
            <button class="seq-icon-btn seq-btn-left" title="Move Left" ${sIdx === 0 ? 'disabled' : ''}>◀</button>
            <button class="seq-icon-btn seq-btn-right" title="Move Right" ${sIdx === steps.length - 1 ? 'disabled' : ''}>▶</button>
            <button class="seq-icon-btn seq-btn-dup" title="Duplicate Step">❐</button>
            <button class="seq-icon-btn seq-btn-del" title="Delete Step">✕</button>
          </div>
        </div>
      `;

      let actionsHtml = '<div class="seq-actions-list">';
      if (!step.actions || step.actions.length === 0) {
        actionsHtml += `<div class="seq-no-actions">No active outputs (hold previous states)</div>`;
      } else {
        step.actions.forEach((act, aIdx) => {
          actionsHtml += this._renderActionItem(act, aIdx, sIdx);
        });
      }
      actionsHtml += '</div>';

      const addActionHtml = `
        <div class="seq-add-action-bar">
          <select class="seq-select-add-type">
            <option value="">+ Add Output Action...</option>
            <option value="piston">Piston (Stroke / Hold / Free)</option>
            <option value="valve">Throttle Valve (Open / Closed)</option>
            <option value="thermal">Thermal Reservoir (Heat / Insulate)</option>
          </select>
        </div>
      `;

      stepCard.innerHTML = headerHtml + actionsHtml + addActionHtml;
      this._bindStepCardEvents(stepCard, sIdx);
      this.timelineTrack.appendChild(stepCard);

      // 2. Discrete Transition Gate
      const nextStepNum = (sIdx + 1) < steps.length ? (sIdx + 2) : (this.sequencer.isLooping ? '1 (Loop)' : 'End');
      const transitionGate = this._renderTransitionGate(step, sIdx, nextStepNum);
      this.timelineTrack.appendChild(transitionGate);
    });

    // End placeholder to add new step
    const addEndBtn = document.createElement('div');
    addEndBtn.className = 'seq-add-card-placeholder';
    addEndBtn.title = "Add new step to sequence";
    addEndBtn.innerHTML = `
      <div class="seq-add-card-inner">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Add Step</span>
      </div>
    `;
    addEndBtn.addEventListener('click', () => {
      this.sequencer.addStep();
      this.render();
    });
    this.timelineTrack.appendChild(addEndBtn);
  }

  _renderActionItem(act, aIdx, sIdx) {
    if (act.type === 'piston') {
      const pistons = this.engine.pistons || [];
      const options = pistons.map(p => `<option value="${p.id}" ${p.id === act.targetId ? 'selected' : ''}>${p.label || 'Piston'} (${p.orientation === 'horizontal' ? 'H' : 'V'})</option>`).join('');
      const mode = act.mode || 'drive_tdc';

      return `
        <div class="seq-action-item seq-act-piston" data-action-index="${aIdx}">
          <div class="seq-act-badge seq-badge-piston">Piston</div>
          <select class="seq-act-target-select">${options || '<option value="">No Pistons in Scene</option>'}</select>
          <select class="seq-piston-mode-select">
            <option value="drive_tdc" ${mode === 'drive_tdc' ? 'selected' : ''}>Drive to TDC (Top Dead Center)</option>
            <option value="drive_bdc" ${mode === 'drive_bdc' ? 'selected' : ''}>Drive to BDC (Bottom Dead Center)</option>
            <option value="hold" ${mode === 'hold' ? 'selected' : ''}>Hold (Isochoric)</option>
            <option value="free" ${mode === 'free' ? 'selected' : ''}>Free Float</option>
            <option value="controlled" ${mode === 'controlled' ? 'selected' : ''}>Custom Position...</option>
          </select>
          ${mode === 'drive_tdc' || mode === 'drive_bdc' ? `
            <button class="seq-btn-invert-tdc ${act.invertTdcBdc ? 'is-inverted' : ''}" title="Invert TDC/BDC polarity (if chamber is on the other side)">
              ⇄ Invert
            </button>
          ` : ''}
          ${mode === 'controlled' ? `
            <div class="seq-input-group" title="Target Position in px">
              <span class="seq-input-lbl">Pos</span>
              <input type="number" class="seq-input-piston-pos" value="${Math.round(act.targetPos !== undefined ? act.targetPos : 400)}" step="10">
            </div>
            <div class="seq-input-group" title="Speed in px/s">
              <span class="seq-input-lbl">v</span>
              <input type="number" class="seq-input-piston-speed" value="${Math.round(act.targetSpeed !== undefined ? act.targetSpeed : 160)}" step="20" min="10">
            </div>
          ` : ''}
          <button class="seq-btn-remove-act" title="Remove Action">✕</button>
        </div>
      `;
    } else if (act.type === 'valve') {
      const valves = this.engine.throttleValves || [];
      const options = valves.map(v => `<option value="${v.id}" ${v.id === act.targetId ? 'selected' : ''}>Valve (id: ${v.id.slice(0, 4)})</option>`).join('');
      const state = act.state || (act.openRatio === 0 ? 'closed' : (act.openRatio === 1 ? 'open' : 'aperture'));
      const pct = Math.round((act.openRatio !== undefined ? act.openRatio : 1.0) * 100);

      return `
        <div class="seq-action-item seq-act-valve" data-action-index="${aIdx}">
          <div class="seq-act-badge seq-badge-valve">Valve</div>
          <select class="seq-act-target-select">${options || '<option value="">No Valves in Scene</option>'}</select>
          <select class="seq-valve-state-select">
            <option value="open" ${state === 'open' ? 'selected' : ''}>Open (100%)</option>
            <option value="closed" ${state === 'closed' ? 'selected' : ''}>Closed (0%)</option>
            <option value="aperture" ${state === 'aperture' ? 'selected' : ''}>Aperture %</option>
          </select>
          ${state === 'aperture' ? `
            <div class="seq-valve-controls">
              <input type="range" min="0" max="100" class="seq-valve-slider" value="${pct}">
              <span class="seq-valve-pct-lbl">${pct}%</span>
            </div>
          ` : ''}
          <button class="seq-btn-remove-act" title="Remove Action">✕</button>
        </div>
      `;
    } else if (act.type === 'thermal') {
      const blocks = [
        ...(this.engine.thermalBlocks || []),
        ...(this.engine.heatExchangers || []),
        ...(this.engine.reservoirs || [])
      ];
      const options = blocks.map(b => `<option value="${b.id}" ${b.id === act.targetId ? 'selected' : ''}>${b.label || 'Thermal'} (${Math.round(b.temperature)}K)</option>`).join('');
      const isInsulated = act.state === 'insulated' || act.isActive === false;

      return `
        <div class="seq-action-item seq-act-thermal" data-action-index="${aIdx}">
          <div class="seq-act-badge seq-badge-thermal">Thermal</div>
          <select class="seq-act-target-select">${options || '<option value="">No Thermal Blocks</option>'}</select>
          <select class="seq-thermal-state-select">
            <option value="active" ${!isInsulated ? 'selected' : ''}>Active (Coupled)</option>
            <option value="insulated" ${isInsulated ? 'selected' : ''}>Insulated (Off)</option>
          </select>
          ${!isInsulated ? `
            <div class="seq-input-group" title="Target Temperature in Kelvin">
              <input type="number" min="5" max="3000" step="25" class="seq-thermal-temp-input" value="${Math.round(act.temperature || 300)}">
              <span class="seq-input-lbl">K</span>
            </div>
          ` : ''}
          <button class="seq-btn-remove-act" title="Remove Action">✕</button>
        </div>
      `;
    }
    return '';
  }

  _renderTransitionGate(step, sIdx, nextStepLabel) {
    const container = document.createElement('div');
    container.className = 'seq-transition-wrapper';

    // Left connecting flow arrow
    const leftArrow = document.createElement('div');
    leftArrow.className = 'seq-flow-arrow';
    leftArrow.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>`;

    // Transition Gate Node
    const gate = document.createElement('div');
    gate.className = `seq-transition-gate ${this.sequencer.isEnabled && this.sequencer.activeStepIndex === sIdx ? 'is-active' : ''}`;
    gate.dataset.stepIndex = sIdx;

    const transition = step.transition || step.trigger || { type: 'duration', duration: 1.5 };

    const gateHeader = `
      <div class="seq-transition-header">
        <span class="seq-transition-pill">TRANSITION ${sIdx + 1} ➔ ${nextStepLabel}</span>
        <select class="seq-transition-type-select">
          <option value="duration" ${transition.type === 'duration' ? 'selected' : ''}>⏱ Time Duration</option>
          <option value="piston_target" ${transition.type === 'piston_target' ? 'selected' : ''}>🎯 Piston reaches TDC/BDC</option>
          <option value="sensor" ${transition.type === 'sensor' ? 'selected' : ''}>📡 Sensor Threshold</option>
        </select>
      </div>
    `;

    let paramsHtml = '<div class="seq-transition-params">';
    if (transition.type === 'duration') {
      paramsHtml += `
        <div class="seq-trig-row">
          <span class="seq-param-label">Wait:</span>
          <div class="seq-input-group">
            <input type="number" min="0.05" max="120" step="0.1" class="seq-input-duration" value="${transition.duration || 1.5}">
            <span class="seq-input-lbl">sec</span>
          </div>
        </div>
      `;
    } else if (transition.type === 'piston_target') {
      const pistons = this.engine.pistons || [];
      const pistonOptions = `<option value="">All Controlled Pistons</option>` +
        pistons.map(p => `<option value="${p.id}" ${p.id === transition.pistonId ? 'selected' : ''}>${p.label || 'Piston'}</option>`).join('');

      paramsHtml += `
        <div class="seq-trig-col">
          <div class="seq-trig-row">
            <select class="seq-trig-piston-select">${pistonOptions}</select>
            <select class="seq-trig-target-select">
              <option value="tdc" ${(transition.pistonTarget || 'tdc') === 'tdc' ? 'selected' : ''}>Reaches TDC</option>
              <option value="bdc" ${(transition.pistonTarget || 'tdc') === 'bdc' ? 'selected' : ''}>Reaches BDC</option>
            </select>
          </div>
          <div class="seq-trig-row seq-trig-timeout-row">
            <span class="seq-param-label-sm">Fallback Timeout:</span>
            <div class="seq-input-group">
              <input type="number" min="0.5" max="60" step="0.5" class="seq-input-timeout" value="${transition.fallbackTimeout || 6.0}">
              <span class="seq-input-lbl">s</span>
            </div>
          </div>
        </div>
      `;
    } else if (transition.type === 'sensor') {
      const sensors = this.engine.sensors || [];
      const sensorOptions = sensors.map(s => `<option value="${s.id}" ${s.id === transition.sensorId ? 'selected' : ''}>${s.label || 'Sensor'} (id: ${s.id.slice(0, 4)})</option>`).join('');

      paramsHtml += `
        <div class="seq-trig-col">
          <div class="seq-trig-row">
            <select class="seq-sensor-select">${sensorOptions || '<option value="">No Sensors</option>'}</select>
            <select class="seq-metric-select">
              <option value="pressure" ${transition.sensorMetric === 'pressure' ? 'selected' : ''}>Pressure (kPa)</option>
              <option value="temperature" ${transition.sensorMetric === 'temperature' ? 'selected' : ''}>Temp (K)</option>
            </select>
            <select class="seq-op-select">
              <option value=">=" ${transition.sensorOperator === '>=' ? 'selected' : ''}>&ge;</option>
              <option value="<=" ${transition.sensorOperator === '<=' ? 'selected' : ''}>&le;</option>
            </select>
            <input type="number" class="seq-thresh-input" value="${transition.sensorThreshold !== undefined ? transition.sensorThreshold : 200}" step="10">
          </div>
          <div class="seq-trig-row seq-trig-timeout-row">
            <span class="seq-param-label-sm">Timeout:</span>
            <div class="seq-input-group">
              <input type="number" min="0.5" max="60" step="0.5" class="seq-input-timeout" value="${transition.fallbackTimeout || 8.0}">
              <span class="seq-input-lbl">s</span>
            </div>
          </div>
        </div>
      `;
    }
    paramsHtml += '</div>';

    const progressHtml = `
      <div class="seq-transition-progress-track">
        <div class="seq-transition-progress-fill" style="width: ${this.sequencer.isEnabled && this.sequencer.activeStepIndex === sIdx ? Math.round(this.sequencer.stepProgress * 100) : 0}%"></div>
      </div>
    `;

    gate.innerHTML = gateHeader + paramsHtml + progressHtml;
    this._bindTransitionEvents(gate, sIdx);

    // Right connecting flow arrow
    const rightArrow = document.createElement('div');
    rightArrow.className = 'seq-flow-arrow';
    rightArrow.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>`;

    container.appendChild(leftArrow);
    container.appendChild(gate);
    container.appendChild(rightArrow);

    return container;
  }

  _bindStepCardEvents(card, sIdx) {
    const step = this.sequencer.steps[sIdx];

    // Name edit
    const titleInput = card.querySelector('.seq-step-title-input');
    titleInput?.addEventListener('input', (e) => {
      step.name = e.target.value;
    });

    // Move left
    card.querySelector('.seq-btn-left')?.addEventListener('click', () => {
      if (sIdx > 0) {
        this.sequencer.moveStep(sIdx, sIdx - 1);
        this.render();
      }
    });

    // Move right
    card.querySelector('.seq-btn-right')?.addEventListener('click', () => {
      if (sIdx < this.sequencer.steps.length - 1) {
        this.sequencer.moveStep(sIdx, sIdx + 1);
        this.render();
      }
    });

    // Duplicate
    card.querySelector('.seq-btn-dup')?.addEventListener('click', () => {
      this.sequencer.duplicateStep(sIdx);
      this.render();
    });

    // Delete
    card.querySelector('.seq-btn-del')?.addEventListener('click', () => {
      this.sequencer.removeStep(sIdx);
      this.render();
    });

    // Add Action Dropdown
    const addSelect = card.querySelector('.seq-select-add-type');
    addSelect?.addEventListener('change', (e) => {
      const type = e.target.value;
      if (!type) return;

      if (type === 'piston') {
        const firstPiston = (this.engine.pistons || [])[0];
        this.sequencer.addAction(sIdx, {
          type: 'piston',
          targetId: firstPiston ? firstPiston.id : null,
          mode: 'drive_tdc',
          invertTdcBdc: false
        });
      } else if (type === 'valve') {
        const firstValve = (this.engine.throttleValves || [])[0];
        this.sequencer.addAction(sIdx, {
          type: 'valve',
          targetId: firstValve ? firstValve.id : null,
          state: 'open',
          openRatio: 1.0
        });
      } else if (type === 'thermal') {
        const firstThermal = [
          ...(this.engine.thermalBlocks || []),
          ...(this.engine.heatExchangers || []),
          ...(this.engine.reservoirs || [])
        ][0];
        this.sequencer.addAction(sIdx, {
          type: 'thermal',
          targetId: firstThermal ? firstThermal.id : null,
          state: 'active',
          temperature: firstThermal ? Math.round(firstThermal.temperature) : 350
        });
      }
      this.render();
    });

    // Action Items Event Listeners
    const actionEls = card.querySelectorAll('.seq-action-item');
    actionEls.forEach((el) => {
      const aIdx = parseInt(el.dataset.actionIndex, 10);
      const act = step.actions[aIdx];
      if (!act) return;

      // Target selection
      el.querySelector('.seq-act-target-select')?.addEventListener('change', (e) => {
        act.targetId = e.target.value;
      });

      // Remove action
      el.querySelector('.seq-btn-remove-act')?.addEventListener('click', () => {
        this.sequencer.removeAction(sIdx, aIdx);
        this.render();
      });

      // Piston controls
      if (act.type === 'piston') {
        el.querySelector('.seq-piston-mode-select')?.addEventListener('change', (e) => {
          act.mode = e.target.value;
          this.render();
        });

        el.querySelector('.seq-btn-invert-tdc')?.addEventListener('click', () => {
          act.invertTdcBdc = !act.invertTdcBdc;
          this.render();
        });

        el.querySelector('.seq-input-piston-pos')?.addEventListener('change', (e) => {
          act.targetPos = parseFloat(e.target.value) || 400;
        });

        el.querySelector('.seq-input-piston-speed')?.addEventListener('change', (e) => {
          act.targetSpeed = Math.max(10, parseFloat(e.target.value) || 160);
        });
      }

      // Valve controls
      if (act.type === 'valve') {
        el.querySelector('.seq-valve-state-select')?.addEventListener('change', (e) => {
          act.state = e.target.value;
          if (act.state === 'open') act.openRatio = 1.0;
          else if (act.state === 'closed') act.openRatio = 0.0;
          this.render();
        });

        el.querySelector('.seq-valve-slider')?.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          act.openRatio = val / 100.0;
          const lbl = el.querySelector('.seq-valve-pct-lbl');
          if (lbl) lbl.textContent = `${val}%`;
        });
      }

      // Thermal controls
      if (act.type === 'thermal') {
        el.querySelector('.seq-thermal-state-select')?.addEventListener('change', (e) => {
          act.state = e.target.value;
          this.render();
        });

        el.querySelector('.seq-thermal-temp-input')?.addEventListener('change', (e) => {
          act.temperature = Math.max(5, Math.min(3000, parseFloat(e.target.value) || 300));
        });
      }
    });
  }

  _bindTransitionEvents(gate, sIdx) {
    const step = this.sequencer.steps[sIdx];
    const trans = step.transition || step.trigger;

    // Transition type select
    gate.querySelector('.seq-transition-type-select')?.addEventListener('change', (e) => {
      trans.type = e.target.value;
      if (trans.type === 'piston_target') {
        trans.pistonTarget = trans.pistonTarget || 'tdc';
        trans.fallbackTimeout = trans.fallbackTimeout || 6.0;
      } else if (trans.type === 'sensor') {
        trans.fallbackTimeout = trans.fallbackTimeout || 8.0;
      }
      this.render();
    });

    // Duration input
    gate.querySelector('.seq-input-duration')?.addEventListener('change', (e) => {
      trans.duration = Math.max(0.05, parseFloat(e.target.value) || 1.5);
    });

    // Piston target select
    gate.querySelector('.seq-trig-piston-select')?.addEventListener('change', (e) => {
      trans.pistonId = e.target.value || null;
    });

    gate.querySelector('.seq-trig-target-select')?.addEventListener('change', (e) => {
      trans.pistonTarget = e.target.value;
    });

    // Fallback timeout
    gate.querySelectorAll('.seq-input-timeout').forEach(input => {
      input.addEventListener('change', (e) => {
        trans.fallbackTimeout = Math.max(0.5, parseFloat(e.target.value) || 6.0);
      });
    });

    // Sensor controls
    gate.querySelector('.seq-sensor-select')?.addEventListener('change', (e) => {
      trans.sensorId = e.target.value || null;
    });

    gate.querySelector('.seq-metric-select')?.addEventListener('change', (e) => {
      trans.sensorMetric = e.target.value;
    });

    gate.querySelector('.seq-op-select')?.addEventListener('change', (e) => {
      trans.sensorOperator = e.target.value;
    });

    gate.querySelector('.seq-thresh-input')?.addEventListener('change', (e) => {
      trans.sensorThreshold = parseFloat(e.target.value) || 200;
    });
  }
}
