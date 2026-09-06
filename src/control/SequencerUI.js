/**
 * SequencerUI.js
 * Visual Controller and Bottom Drawer UI for Thermodynamic Cycle Sequencer
 */

export class SequencerUI {
  constructor(engine) {
    this.engine = engine;
    this.sequencer = engine.sequencer;
    this.isOpen = false;
    this.lastRenderedPhaseCount = -1;

    // DOM Elements
    this.drawerEl = document.getElementById('cycleSequencerDrawer');
    this.toggleBtn = document.getElementById('btnToggleSequencer');
    this.activeToggle = document.getElementById('seqToggleActive');
    this.loopToggle = document.getElementById('seqToggleLoop');
    this.cycleBadge = document.getElementById('seqCycleBadge');
    this.btnAddPhase = document.getElementById('seqBtnAddPhase');
    this.btnClose = document.getElementById('seqBtnClose');
    this.btnReset = document.getElementById('seqBtnReset');
    this.phasesContainer = document.getElementById('seqPhasesList');

    this._bindEvents();
    this.render();
  }

  _bindEvents() {
    this.toggleBtn?.addEventListener('click', () => {
      this.toggleDrawer();
    });

    this.btnClose?.addEventListener('click', () => {
      this.closeDrawer();
    });

    this.activeToggle?.addEventListener('change', (e) => {
      this.sequencer.isEnabled = e.target.checked;
      this.updateBadges();
      this.updateActiveCards();
    });

    this.loopToggle?.addEventListener('change', (e) => {
      this.sequencer.isLooping = e.target.checked;
    });

    this.btnAddPhase?.addEventListener('click', () => {
      this.sequencer.addPhase();
      this.render();
      if (!this.isOpen) this.openDrawer();
    });

    this.btnReset?.addEventListener('click', () => {
      this.sequencer.reset();
      this.updateBadges();
      this.updateActiveCards();
    });

    this.sequencer.onPhaseChangeCallback = () => {
      this.updateBadges();
      this.updateActiveCards();
    };
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
      this.drawerEl.classList.remove('hidden');
      this.drawerEl.classList.add('is-open');
    }
    if (this.toggleBtn) {
      this.toggleBtn.classList.add('active');
    }
    this.render();
  }

  closeDrawer() {
    this.isOpen = false;
    if (this.drawerEl) {
      this.drawerEl.classList.remove('is-open');
      this.drawerEl.classList.add('hidden');
    }
    if (this.toggleBtn) {
      this.toggleBtn.classList.remove('active');
    }
  }

  updateBadges() {
    if (!this.cycleBadge) return;
    const totalPhases = this.sequencer.phases.length;

    if (totalPhases === 0) {
      this.cycleBadge.innerHTML = `<span class="seq-badge-status seq-status-idle">Keine Phasen</span>`;
      return;
    }

    if (!this.sequencer.isEnabled) {
      this.cycleBadge.innerHTML = `
        <span class="seq-badge-status seq-status-paused">Bereit (Inaktiv)</span>
        <span class="seq-badge-meta">${totalPhases} Takte</span>
      `;
    } else {
      const cur = this.sequencer.activePhaseIndex + 1;
      this.cycleBadge.innerHTML = `
        <span class="seq-badge-status seq-status-running">● Aktiv</span>
        <span class="seq-badge-meta">Zyklus #${this.sequencer.currentCycleCount} • Takt ${cur}/${totalPhases}</span>
      `;
    }

    if (this.activeToggle) {
      this.activeToggle.checked = this.sequencer.isEnabled;
    }
    if (this.loopToggle) {
      this.loopToggle.checked = this.sequencer.isLooping;
    }
  }

  updateActiveCards() {
    if (!this.phasesContainer) return;
    const cards = this.phasesContainer.querySelectorAll('.seq-phase-card');
    cards.forEach((card, idx) => {
      const isActive = this.sequencer.isEnabled && (this.sequencer.activePhaseIndex === idx);
      card.classList.toggle('is-active', isActive);
      const fill = card.querySelector('.seq-progress-fill');
      if (fill) {
        fill.style.width = isActive ? `${Math.round(this.sequencer.phaseProgress * 100)}%` : '0%';
      }
    });
  }

  updateLive() {
    if (!this.isOpen && !this.sequencer.isEnabled) return;
    this.updateBadges();
    this.updateActiveCards();
  }

  render() {
    if (!this.phasesContainer) return;

    this.updateBadges();
    const phases = this.sequencer.phases;

    if (phases.length === 0) {
      this.phasesContainer.innerHTML = `
        <div class="seq-empty-state">
          <div class="seq-empty-icon">⏱</div>
          <div class="seq-empty-title">Keine Kreisprozess-Phasen definiert</div>
          <div class="seq-empty-desc">Füge einen ersten Takt hinzu, um Kolben, Ventile und Thermals präzise aufeinander abzustimmen.</div>
          <button class="seq-btn-empty-add" id="seqBtnEmptyAdd">+ Ersten Takt erstellen</button>
        </div>
      `;
      document.getElementById('seqBtnEmptyAdd')?.addEventListener('click', () => {
        this.sequencer.addPhase({ name: 'Takt 1: Ansaugen' });
        this.render();
      });
      return;
    }

    this.phasesContainer.innerHTML = '';

    phases.forEach((phase, pIdx) => {
      const card = document.createElement('div');
      card.className = `seq-phase-card ${this.sequencer.isEnabled && this.sequencer.activePhaseIndex === pIdx ? 'is-active' : ''}`;
      card.dataset.phaseIndex = pIdx;

      // Card Header
      const headerHtml = `
        <div class="seq-card-header">
          <div class="seq-card-num-badge">${pIdx + 1}</div>
          <input type="text" class="seq-phase-title-input" value="${phase.name || `Takt ${pIdx + 1}`}" placeholder="Takt-Name">
          <div class="seq-card-tools">
            <button class="seq-icon-btn seq-btn-left" title="Nach links" ${pIdx === 0 ? 'disabled' : ''}>◀</button>
            <button class="seq-icon-btn seq-btn-right" title="Nach rechts" ${pIdx === phases.length - 1 ? 'disabled' : ''}>▶</button>
            <button class="seq-icon-btn seq-btn-dup" title="Duplizieren">❐</button>
            <button class="seq-icon-btn seq-btn-del" title="Löschen">✕</button>
          </div>
        </div>
      `;

      // Actions List HTML
      let actionsHtml = '<div class="seq-actions-list">';
      if (!phase.actions || phase.actions.length === 0) {
        actionsHtml += `<div class="seq-no-actions">Keine Stellglieder (Zustand wird gehalten)</div>`;
      } else {
        phase.actions.forEach((act, aIdx) => {
          actionsHtml += this._renderActionItem(act, aIdx, pIdx);
        });
      }
      actionsHtml += '</div>';

      // Add Action Dropdown
      const addActionHtml = `
        <div class="seq-add-action-bar">
          <select class="seq-select-add-type">
            <option value="">+ Stellglied ansteuern...</option>
            <option value="piston">Kolben (Hub & Modus)</option>
            <option value="valve">Ventil (Öffnungsgrad)</option>
            <option value="thermal">Thermal / Heizblock (Temperatur)</option>
          </select>
        </div>
      `;

      // Trigger / Transition Section
      const trigger = phase.trigger || { type: 'duration', duration: 1.0 };
      const triggerHtml = `
        <div class="seq-trigger-section">
          <div class="seq-trigger-header">
            <span class="seq-trigger-label">➔ Weiter bei:</span>
            <select class="seq-select-trigger-type">
              <option value="duration" ${trigger.type === 'duration' ? 'selected' : ''}>⏱ Zeitdauer</option>
              <option value="piston_target" ${trigger.type === 'piston_target' ? 'selected' : ''}>🎯 Kolben-Ziel</option>
              <option value="sensor" ${trigger.type === 'sensor' ? 'selected' : ''}>📡 Sensor-Schwelle</option>
            </select>
          </div>
          <div class="seq-trigger-params">
            ${this._renderTriggerParams(trigger, pIdx)}
          </div>
        </div>
      `;

      // Progress Bar
      const progressHtml = `
        <div class="seq-progress-track">
          <div class="seq-progress-fill" style="width: ${this.sequencer.isEnabled && this.sequencer.activePhaseIndex === pIdx ? Math.round(this.sequencer.phaseProgress * 100) : 0}%"></div>
        </div>
      `;

      card.innerHTML = headerHtml + actionsHtml + addActionHtml + triggerHtml + progressHtml;

      // Event Listeners for this card
      this._bindCardEvents(card, pIdx);

      this.phasesContainer.appendChild(card);

      // Connecting Arrow
      if (pIdx < phases.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'seq-phase-arrow';
        arrow.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
        this.phasesContainer.appendChild(arrow);
      }
    });

    // Add Phase End Button
    const addEndBtn = document.createElement('div');
    addEndBtn.className = 'seq-add-card-placeholder';
    addEndBtn.innerHTML = `
      <div class="seq-add-card-inner">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Takt hinzufügen</span>
      </div>
    `;
    addEndBtn.addEventListener('click', () => {
      this.sequencer.addPhase();
      this.render();
    });
    this.phasesContainer.appendChild(addEndBtn);
  }

  _renderActionItem(act, aIdx, pIdx) {
    if (act.type === 'piston') {
      const pistons = this.engine.pistons || [];
      const options = pistons.map(p => `<option value="${p.id}" ${p.id === act.targetId ? 'selected' : ''}>${p.label || 'Kolben'} (id: ${p.id.slice(0, 4)})</option>`).join('');

      return `
        <div class="seq-action-item seq-act-piston" data-action-index="${aIdx}">
          <div class="seq-act-badge seq-badge-piston">Kolben</div>
          <select class="seq-act-target-select">${options || '<option value="">Kein Kolben vorhanden</option>'}</select>
          <select class="seq-piston-mode-select">
            <option value="controlled" ${act.mode === 'controlled' ? 'selected' : ''}>Fahre nach X</option>
            <option value="hold" ${act.mode === 'hold' ? 'selected' : ''}>Halten (isochor)</option>
            <option value="free" ${act.mode === 'free' ? 'selected' : ''}>Freilauf</option>
          </select>
          ${act.mode === 'controlled' ? `
            <div class="seq-input-group" title="Zielposition in Pixel">
              <span class="seq-input-lbl">Ziel</span>
              <input type="number" class="seq-input-piston-pos" value="${Math.round(act.targetPos !== undefined ? act.targetPos : 500)}" step="10">
            </div>
            <div class="seq-input-group" title="Geschwindigkeit in px/s">
              <span class="seq-input-lbl">v</span>
              <input type="number" class="seq-input-piston-speed" value="${Math.round(act.targetSpeed !== undefined ? act.targetSpeed : 150)}" step="25" min="10">
            </div>
          ` : ''}
          <button class="seq-btn-remove-act" title="Aktion entfernen">✕</button>
        </div>
      `;
    } else if (act.type === 'valve') {
      const valves = this.engine.throttleValves || [];
      const options = valves.map(v => `<option value="${v.id}" ${v.id === act.targetId ? 'selected' : ''}>Ventil (id: ${v.id.slice(0, 4)})</option>`).join('');
      const pct = Math.round((act.openRatio !== undefined ? act.openRatio : 1.0) * 100);

      return `
        <div class="seq-action-item seq-act-valve" data-action-index="${aIdx}">
          <div class="seq-act-badge seq-badge-valve">Ventil</div>
          <select class="seq-act-target-select">${options || '<option value="">Kein Ventil vorhanden</option>'}</select>
          <div class="seq-valve-controls">
            <input type="range" min="0" max="100" class="seq-valve-slider" value="${pct}">
            <span class="seq-valve-pct-lbl">${pct}%</span>
          </div>
          <button class="seq-btn-remove-act" title="Aktion entfernen">✕</button>
        </div>
      `;
    } else if (act.type === 'thermal') {
      const blocks = [
        ...(this.engine.thermalBlocks || []),
        ...(this.engine.heatExchangers || []),
        ...(this.engine.reservoirs || [])
      ];
      const options = blocks.map(b => `<option value="${b.id}" ${b.id === act.targetId ? 'selected' : ''}>${b.label || 'Thermal'} (id: ${b.id.slice(0, 4)})</option>`).join('');

      return `
        <div class="seq-action-item seq-act-thermal" data-action-index="${aIdx}">
          <div class="seq-act-badge seq-badge-thermal">Thermal</div>
          <select class="seq-act-target-select">${options || '<option value="">Kein Thermal vorhanden</option>'}</select>
          <div class="seq-input-group" title="Temperatur in Kelvin">
            <input type="number" min="5" max="3000" step="25" class="seq-thermal-temp-input" value="${Math.round(act.temperature || 300)}">
            <span class="seq-input-lbl">K</span>
          </div>
          <label class="seq-check-lbl" title="Wärmeleitung aktiv">
            <input type="checkbox" class="seq-thermal-active-check" ${act.isActive !== false ? 'checked' : ''}> Aktiv
          </label>
          <button class="seq-btn-remove-act" title="Aktion entfernen">✕</button>
        </div>
      `;
    }
    return '';
  }

  _renderTriggerParams(trigger, pIdx) {
    if (trigger.type === 'duration') {
      return `
        <div class="seq-trig-row">
          <span>Dauer:</span>
          <input type="number" min="0.05" max="60" step="0.1" class="seq-input-duration" value="${trigger.duration || 1.0}">
          <span>s</span>
        </div>
      `;
    } else if (trigger.type === 'piston_target') {
      return `
        <div class="seq-trig-row">
          <span class="seq-trig-desc">Sobald gesteuerte Kolben Soll-Position erreichen</span>
          <div class="seq-trig-sub">
            <span>Timeout:</span>
            <input type="number" min="0.5" step="0.5" class="seq-input-timeout" value="${trigger.fallbackTimeout || 8.0}">
            <span>s</span>
          </div>
        </div>
      `;
    } else if (trigger.type === 'sensor') {
      const sensors = this.engine.sensors || [];
      const options = sensors.map(s => `<option value="${s.id}" ${s.id === trigger.sensorId ? 'selected' : ''}>${s.label || 'Kammer'} (id: ${s.id.slice(0, 4)})</option>`).join('');

      return `
        <div class="seq-trig-row-sensor">
          <select class="seq-sensor-select">${options || '<option value="">Kein Sensor vorhanden</option>'}</select>
          <select class="seq-metric-select">
            <option value="pressure" ${trigger.sensorMetric === 'pressure' ? 'selected' : ''}>Druck</option>
            <option value="temperature" ${trigger.sensorMetric === 'temperature' ? 'selected' : ''}>Temperatur</option>
          </select>
          <select class="seq-op-select">
            <option value=">=" ${trigger.sensorOperator === '>=' ? 'selected' : ''}>&ge;</option>
            <option value="<=" ${trigger.sensorOperator === '<=' ? 'selected' : ''}>&le;</option>
          </select>
          <input type="number" class="seq-thresh-input" value="${trigger.sensorThreshold || 200}">
          <span>${trigger.sensorMetric === 'temperature' ? 'K' : 'kPa'}</span>
        </div>
      `;
    }
    return '';
  }

  _bindCardEvents(card, pIdx) {
    const phase = this.sequencer.phases[pIdx];
    if (!phase) return;

    // Phase Title Edit
    const titleInput = card.querySelector('.seq-phase-title-input');
    titleInput?.addEventListener('input', (e) => {
      phase.name = e.target.value;
    });

    // Move buttons
    card.querySelector('.seq-btn-left')?.addEventListener('click', () => {
      this.sequencer.movePhase(pIdx, pIdx - 1);
      this.render();
    });
    card.querySelector('.seq-btn-right')?.addEventListener('click', () => {
      this.sequencer.movePhase(pIdx, pIdx + 1);
      this.render();
    });

    // Duplicate
    card.querySelector('.seq-btn-dup')?.addEventListener('click', () => {
      this.sequencer.duplicatePhase(pIdx);
      this.render();
    });

    // Delete
    card.querySelector('.seq-btn-del')?.addEventListener('click', () => {
      this.sequencer.removePhase(pIdx);
      this.render();
    });

    // Add action dropdown
    const addTypeSelect = card.querySelector('.seq-select-add-type');
    addTypeSelect?.addEventListener('change', (e) => {
      const type = e.target.value;
      if (!type) return;

      if (type === 'piston') {
        const p0 = this.engine.pistons[0];
        this.sequencer.addAction(pIdx, {
          type: 'piston',
          targetId: p0 ? p0.id : null,
          mode: 'controlled',
          targetPos: p0 ? Math.round(p0.getPos()) : 500,
          targetSpeed: 150
        });
      } else if (type === 'valve') {
        const v0 = this.engine.throttleValves[0];
        this.sequencer.addAction(pIdx, {
          type: 'valve',
          targetId: v0 ? v0.id : null,
          openRatio: 1.0
        });
      } else if (type === 'thermal') {
        const b0 = (this.engine.thermalBlocks || [])[0] || (this.engine.heatExchangers || [])[0] || (this.engine.reservoirs || [])[0];
        this.sequencer.addAction(pIdx, {
          type: 'thermal',
          targetId: b0 ? b0.id : null,
          temperature: 450,
          isActive: true
        });
      }
      this.render();
    });

    // Action Items inside phase
    const actionItems = card.querySelectorAll('.seq-action-item');
    actionItems.forEach((itemEl) => {
      const aIdx = parseInt(itemEl.dataset.actionIndex, 10);
      const act = phase.actions[aIdx];
      if (!act) return;

      // Target selection
      itemEl.querySelector('.seq-act-target-select')?.addEventListener('change', (e) => {
        act.targetId = e.target.value;
      });

      // Piston mode
      itemEl.querySelector('.seq-piston-mode-select')?.addEventListener('change', (e) => {
        act.mode = e.target.value;
        this.render();
      });

      // Piston target pos
      itemEl.querySelector('.seq-input-piston-pos')?.addEventListener('input', (e) => {
        act.targetPos = parseFloat(e.target.value) || 0;
      });

      // Piston speed
      itemEl.querySelector('.seq-input-piston-speed')?.addEventListener('input', (e) => {
        act.targetSpeed = Math.max(10, parseFloat(e.target.value) || 150);
      });

      // Valve slider
      const valveSlider = itemEl.querySelector('.seq-valve-slider');
      const valvePctLbl = itemEl.querySelector('.seq-valve-pct-lbl');
      valveSlider?.addEventListener('input', (e) => {
        const pct = parseInt(e.target.value, 10);
        act.openRatio = pct / 100.0;
        if (valvePctLbl) valvePctLbl.textContent = `${pct}%`;
      });

      // Thermal temp
      itemEl.querySelector('.seq-thermal-temp-input')?.addEventListener('input', (e) => {
        act.temperature = Math.max(5, parseFloat(e.target.value) || 300);
      });

      // Thermal active
      itemEl.querySelector('.seq-thermal-active-check')?.addEventListener('change', (e) => {
        act.isActive = e.target.checked;
      });

      // Remove action
      itemEl.querySelector('.seq-btn-remove-act')?.addEventListener('click', () => {
        this.sequencer.removeAction(pIdx, aIdx);
        this.render();
      });
    });

    // Trigger Type selection
    const trigTypeSelect = card.querySelector('.seq-select-trigger-type');
    trigTypeSelect?.addEventListener('change', (e) => {
      phase.trigger.type = e.target.value;
      this.render();
    });

    // Trigger Duration
    card.querySelector('.seq-input-duration')?.addEventListener('input', (e) => {
      phase.trigger.duration = Math.max(0.05, parseFloat(e.target.value) || 1.0);
    });

    // Trigger Timeout
    card.querySelector('.seq-input-timeout')?.addEventListener('input', (e) => {
      phase.trigger.fallbackTimeout = Math.max(0.5, parseFloat(e.target.value) || 5.0);
    });

    // Sensor Trigger elements
    card.querySelector('.seq-sensor-select')?.addEventListener('change', (e) => {
      phase.trigger.sensorId = e.target.value;
    });
    card.querySelector('.seq-metric-select')?.addEventListener('change', (e) => {
      phase.trigger.sensorMetric = e.target.value;
      this.render();
    });
    card.querySelector('.seq-op-select')?.addEventListener('change', (e) => {
      phase.trigger.sensorOperator = e.target.value;
    });
    card.querySelector('.seq-thresh-input')?.addEventListener('input', (e) => {
      phase.trigger.sensorThreshold = parseFloat(e.target.value) || 0;
    });
  }
}
