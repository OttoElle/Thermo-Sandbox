// Accordion property editors for the selected elements.
import { Wall } from '../physics/Wall.js';
import { Piston } from '../physics/Piston.js';
import { Reservoir } from '../physics/Reservoir.js';
import { SensorZone } from '../physics/SensorZone.js';
import { Emitter } from '../physics/Emitter.js';
import { Sink } from '../physics/Sink.js';
import { ThermalBlock } from '../physics/ThermalBlock.js';
import { HeatExchanger } from '../physics/HeatExchanger.js';
import { RegeneratorMatrix } from '../physics/RegeneratorMatrix.js';
import { TextLabel } from '../physics/TextLabel.js';
import { ParticleGroup } from '../physics/ParticleGroup.js';
import { Regulator } from '../physics/Regulator.js';
import { ThrottleValve } from '../physics/ThrottleValve.js';
import { engine } from './core.js';
import { app } from './state.js';
import { recordUndoState } from './history.js';
import { attachDualInput, makeDualInput } from './fields.js';
import { updateElementCardLabel, updateElementsList } from './elementTree.js';
import { deleteSelectedItems } from './selection.js';
import { updatePopupPosition } from './popup.js';

// ============================================================================
// Accordion Body Generator for Selected Items in Elements List
// ============================================================================
export function renderItemAccordionBody(item, bodyContainer, itemIndex) {
  if (!bodyContainer || !item) return;

  const idPrefix = `acc_${itemIndex}_`;

  if (item instanceof Wall) {
    let extraControls = '';
    if (item.type === 'manual_valve') {
      extraControls = `
        <button id="${idPrefix}toggleValveBtn" class="btn-emitter-toggle ${item.isOpen ? 'is-on' : 'is-off'}" style="margin-bottom:8px;">
          <span>${item.isOpen ? 'VALVE IS OPEN' : 'VALVE IS CLOSED'}</span>
        </button>
      `;
    } else if (item.type === 'check_valve') {
      extraControls = `
        <button id="${idPrefix}flipDirBtn" class="btn-flip-dir" title="Flip flow direction" style="margin-bottom:8px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
          <span>Flip Flow Direction (${item.allowedDirection > 0 ? 'Forward →' : 'Reverse ←'})</span>
        </button>
      `;
    } else if (item.type === 'relief_valve') {
      extraControls = `
        ${makeDualInput('Trigger Pressure P_max', `${idPrefix}reliefP`, 50, 1000, 25, item.triggerPressure, 'Pa')}
        ${makeDualInput('Hysteresis Band ΔP', `${idPrefix}reliefHyst`, 0, 100, 5, item.pressureHysteresis !== undefined ? item.pressureHysteresis : 25, 'Pa')}
        <div class="field-row">
          <div class="field-label"><span>Relief Mode</span></div>
          <div class="btn-toggle-group">
            <button class="sub-toggle-btn ${item.reliefMode === 'oneway' ? 'active' : ''}" id="${idPrefix}relief1Way">1-Way</button>
            <button class="sub-toggle-btn ${item.reliefMode === 'bidirectional' ? 'active' : ''}" id="${idPrefix}relief2Way">2-Way</button>
          </div>
        </div>
        ${item.reliefMode === 'oneway' ? `
          <button id="${idPrefix}flipReliefDirBtn" class="btn-flip-dir" title="Flip relief opening direction" style="margin-bottom:8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
            <span>Flip Relief Direction (${(item.allowedDirection || 1) > 0 ? 'Forward →' : 'Reverse ←'})</span>
          </button>
        ` : ''}
      `;
    }

    bodyContainer.innerHTML = `
      ${extraControls}
      ${makeDualInput('Thickness', `${idPrefix}wThick`, 2, 16, 1, item.thickness, 'px')}
      ${makeDualInput('Conductivity κ', `${idPrefix}wKappa`, 0, 1, 0.05, item.conductivity)}
    `;

    attachDualInput(`${idPrefix}wThick`, val => { item.thickness = val; });
    attachDualInput(`${idPrefix}wKappa`, val => { item.conductivity = val; });

    document.getElementById(`${idPrefix}toggleValveBtn`)?.addEventListener('click', () => {
      item.isOpen = !item.isOpen;
      updateElementsList();
    });
    document.getElementById(`${idPrefix}flipDirBtn`)?.addEventListener('click', () => {
      item.flipDirection();
      updateElementsList();
    });
    if (item.type === 'relief_valve') {
      attachDualInput(`${idPrefix}reliefP`, val => { item.triggerPressure = val; });
      attachDualInput(`${idPrefix}reliefHyst`, val => { item.pressureHysteresis = val; });
      document.getElementById(`${idPrefix}relief1Way`)?.addEventListener('click', () => {
        item.reliefMode = 'oneway';
        updateElementsList();
      });
      document.getElementById(`${idPrefix}relief2Way`)?.addEventListener('click', () => {
        item.reliefMode = 'bidirectional';
        updateElementsList();
      });
      document.getElementById(`${idPrefix}flipReliefDirBtn`)?.addEventListener('click', () => {
        item.flipDirection();
        updateElementsList();
      });
    }

  } else if (item instanceof ThrottleValve) {
    const isTVActive = item.isActive !== false;
    const gapPx = Math.round(item.gapWidth || (item.length * item.openRatio));
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:8px;">
        <button id="${idPrefix}toggleTVBtn" class="btn-emitter-toggle ${isTVActive ? 'is-on' : 'is-off'}">
          <span>${isTVActive ? 'THROTTLE IS ACTIVE' : 'THROTTLE IS DISABLED'}</span>
        </button>
      </div>
      <div class="stat-card" style="margin-bottom:8px;">
        <span class="stat-label">Opening Aperture & Pressure Drop</span>
        <span class="stat-value" style="font-size:12px; color:#10b981;">${Math.round(item.openRatio * 100)}% (${gapPx} px) | ΔP: ${(item.deltaP || 0).toFixed(1)} Pa</span>
      </div>
      ${makeDualInput('Opening Ratio', `${idPrefix}tvOpen`, 0, 100, 5, Math.round(item.openRatio * 100), '%')}
      ${makeDualInput('Thickness', `${idPrefix}tvThick`, 2, 16, 1, item.thickness, 'px')}
      ${makeDualInput('Conductivity κ', `${idPrefix}tvCond`, 0, 1, 0.05, item.conductivity || 0)}
      <button class="btn-danger" id="${idPrefix}delTVBtn" style="width:100%; margin-top:8px; padding:6px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">
        Delete Throttle Valve
      </button>
    `;

    document.getElementById(`${idPrefix}toggleTVBtn`)?.addEventListener('click', () => {
      item.toggle();
      updateElementsList();
    });
    attachDualInput(`${idPrefix}tvOpen`, val => {
      item.setOpenRatio(val / 100);
      updateElementsList();
    });
    attachDualInput(`${idPrefix}tvThick`, val => {
      item.thickness = Math.round(val);
      item._updateGeometry();
    });
    attachDualInput(`${idPrefix}tvCond`, val => {
      item.conductivity = val;
    });
    document.getElementById(`${idPrefix}delTVBtn`)?.addEventListener('click', () => {
      deleteSelectedItems();
    });

  } else if (item instanceof Piston) {
    const isPActive = item.isActive !== false;
    let modeDetails = '';
    if (item.mode === 'damper') {
      modeDetails = `
        ${makeDualInput('Damping Load γ', `${idPrefix}pDamp`, 5, 150, 5, item.dampingCoeff, 'Ns/m')}
        <div class="stat-card" style="margin-top:4px;">
          <span class="stat-label">Work Extracted W_ext</span>
          <span class="stat-value" style="font-size:12px; color:#f59e0b;">${(item.workExtracted || 0).toFixed(1)} J (${(item.instantPower || 0).toFixed(1)} W)</span>
        </div>
      `;
    } else if (item.mode === 'motorized') {
      const stroke = Math.round(Math.abs(item.maxPos - item.minPos));
      const amp = (item.amplitude || stroke * 0.5).toFixed(0);
      modeDetails = `
        ${makeDualInput('Frequency f', `${idPrefix}pFreq`, 0.1, 5.0, 0.1, item.frequency, 'Hz')}
        ${makeDualInput('Phase Offset φ', `${idPrefix}pPhase`, -180, 180, 15, item.phase || 0, '°')}
        <div class="stat-card" style="margin-top:4px;">
          <span class="stat-label">Stroke & Amplitude</span>
          <span class="stat-value" style="font-size:11.5px; color:#38bdf8;">±${amp} px (Stroke ${stroke} px, adjust via handles)</span>
        </div>
      `;
    } else if (item.mode === 'spring') {
      modeDetails = makeDualInput('Spring Constant k', `${idPrefix}pSpring`, 10, 500, 10, item.springK, 'N/m');
    }

    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:8px;">
        <button id="${idPrefix}togglePistonBtn" class="btn-emitter-toggle ${isPActive ? 'is-on' : 'is-off'}">
          <span>${isPActive ? 'PISTON IS ACTIVE' : 'PISTON IS DISABLED'}</span>
        </button>
      </div>
      <div class="field-row">
        <div class="field-label"><span>Mode</span></div>
        <div class="btn-toggle-group">
          <button class="sub-toggle-btn ${item.mode === 'free' ? 'active' : ''}" data-pmode="free">Displacer</button>
          <button class="sub-toggle-btn ${item.mode === 'spring' ? 'active' : ''}" data-pmode="spring">Accumulator</button>
          <button class="sub-toggle-btn ${item.mode === 'motorized' ? 'active' : ''}" data-pmode="motorized">Compressor</button>
          <button class="sub-toggle-btn ${item.mode === 'damper' ? 'active' : ''}" data-pmode="damper">Expander</button>
        </div>
      </div>
      ${makeDualInput('Mass m', `${idPrefix}pMass`, 0, 150, 5, item.mass)}
      ${makeDualInput('Conductivity κ', `${idPrefix}pKappa`, 0, 1, 0.05, item.conductivity)}
      ${modeDetails}
    `;
    document.getElementById(`${idPrefix}togglePistonBtn`)?.addEventListener('click', () => {
      item.toggle();
      updateElementsList();
    });
    bodyContainer.querySelectorAll('[data-pmode]').forEach(btn => {
      btn.addEventListener('click', () => {
        item.mode = btn.dataset.pmode;
        updateElementsList();
      });
    });
    attachDualInput(`${idPrefix}pMass`, val => { item.mass = val; });
    attachDualInput(`${idPrefix}pKappa`, val => { item.conductivity = val; });
    if (item.mode === 'damper') attachDualInput(`${idPrefix}pDamp`, val => { item.dampingCoeff = val; });
    if (item.mode === 'motorized') {
      attachDualInput(`${idPrefix}pFreq`, val => { item.frequency = val; });
      attachDualInput(`${idPrefix}pPhase`, val => { item.phase = val; });
    }
    if (item.mode === 'spring') attachDualInput(`${idPrefix}pSpring`, val => { item.springK = val; });

  } else if (item instanceof Reservoir) {
    const isResActive = item.isActive !== false;
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:8px;">
        <button id="${idPrefix}toggleResBtn" class="btn-emitter-toggle ${isResActive ? 'is-on' : 'is-off'}">
          <span>${isResActive ? 'RESERVOIR IS ACTIVE' : 'RESERVOIR IS DISABLED'}</span>
        </button>
      </div>
      ${makeDualInput('Constant Temperature T', `${idPrefix}resT`, 0, 1000, 25, item.temperature, 'K')}
      ${makeDualInput('Thermal Coupling κ', `${idPrefix}resK`, 0.05, 1.0, 0.05, item.conductance)}
    `;
    document.getElementById(`${idPrefix}toggleResBtn`)?.addEventListener('click', () => {
      item.toggle();
      updateElementsList();
    });
    attachDualInput(`${idPrefix}resT`, val => {
      item.temperature = val;
      item.label = `Isotherm (${Math.round(val)}K)`;
      updateElementCardLabel(itemIndex, item.label);
    });
    attachDualInput(`${idPrefix}resK`, val => { item.conductance = val; });

  } else if (item instanceof HeatExchanger) {
    const isHxActive = item.isActive !== false;
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:8px;">
        <button id="${idPrefix}toggleHxBtn" class="btn-emitter-toggle ${isHxActive ? 'is-on' : 'is-off'}">
          <span>${isHxActive ? 'HEAT EXCHANGER IS ACTIVE' : 'HEAT EXCHANGER IS DISABLED'}</span>
        </button>
      </div>
      ${makeDualInput('Body Temperature T', `${idPrefix}hxT`, 0, 1000, 25, item.temperature, 'K')}
      ${makeDualInput('Thermal Coupling κ', `${idPrefix}hxK`, 0.05, 1.0, 0.05, item.conductivity)}
    `;
    document.getElementById(`${idPrefix}toggleHxBtn`)?.addEventListener('click', () => {
      item.toggle();
      updateElementsList();
    });
    attachDualInput(`${idPrefix}hxT`, val => {
      item.temperature = val;
      item.label = `Heat Exchanger (${Math.round(val)}K)`;
      updateElementCardLabel(itemIndex, item.label);
    });
    attachDualInput(`${idPrefix}hxK`, val => { item.conductivity = val; });

  } else if (item instanceof RegeneratorMatrix) {
    const isRegActive = item.isActive !== false;
    const avgT = Math.round(item.getAverageTemperature());
    const minT = Math.round(Math.min(...item.temperatures));
    const maxT = Math.round(Math.max(...item.temperatures));
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:8px;">
        <button id="${idPrefix}toggleRegBtn" class="btn-emitter-toggle ${isRegActive ? 'is-on' : 'is-off'}">
          <span>${isRegActive ? 'REGENERATOR IS ACTIVE' : 'REGENERATOR IS DISABLED'}</span>
        </button>
      </div>
      <div class="field-row">
        <div class="field-label"><span>Flow Axis</span></div>
        <div class="btn-toggle-group">
          <button class="sub-toggle-btn ${item.orientation === 'horizontal' ? 'active' : ''}" id="${idPrefix}btnRegHoriz">Horizontal</button>
          <button class="sub-toggle-btn ${item.orientation === 'vertical' ? 'active' : ''}" id="${idPrefix}btnRegVert">Vertical</button>
        </div>
      </div>
      <div class="stat-card" style="margin:4px 0;">
        <span class="stat-label">Thermal Gradient Span</span>
        <span class="stat-value" style="font-size:12px; color:#38bdf8;">${minT} K to ${maxT} K (Avg: ${avgT} K)</span>
      </div>
      ${makeDualInput('Base Temperature T', `${idPrefix}regT`, 0, 1000, 25, avgT, 'K')}
      ${makeDualInput('Total Heat Capacity C', `${idPrefix}regC`, 50, 1500, 50, item.heatCapacity, 'J/K')}
      ${makeDualInput('Thermal Coupling κ', `${idPrefix}regK`, 0.05, 1.0, 0.05, item.conductivity)}
      ${makeDualInput('Axial Heat Leakage', `${idPrefix}regAx`, 0, 0.5, 0.02, item.axialConductivity || 0.05)}
    `;
    document.getElementById(`${idPrefix}toggleRegBtn`)?.addEventListener('click', () => {
      item.toggle();
      updateElementsList();
    });
    document.getElementById(`${idPrefix}btnRegHoriz`)?.addEventListener('click', () => {
      item.orientation = 'horizontal';
      updateElementsList();
    });
    document.getElementById(`${idPrefix}btnRegVert`)?.addEventListener('click', () => {
      item.orientation = 'vertical';
      updateElementsList();
    });
    attachDualInput(`${idPrefix}regT`, val => {
      const diff = val - item.getAverageTemperature();
      for (let i = 0; i < item.sliceCount; i++) {
        item.temperatures[i] = Math.max(5, item.temperatures[i] + diff);
      }
      updateElementsList();
    });
    attachDualInput(`${idPrefix}regC`, val => { item.heatCapacity = val; });
    attachDualInput(`${idPrefix}regK`, val => { item.conductivity = val; });
    attachDualInput(`${idPrefix}regAx`, val => { item.axialConductivity = val; });

  } else if (item instanceof ThermalBlock) {
    const isBlockActive = item.isActive !== false;
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:8px;">
        <button id="${idPrefix}toggleBlockBtn" class="btn-emitter-toggle ${isBlockActive ? 'is-on' : 'is-off'}">
          <span>${isBlockActive ? 'RESSAVOIR IS ACTIVE' : 'RESSAVOIR IS DISABLED'}</span>
        </button>
      </div>
      ${makeDualInput('Temperature T', `${idPrefix}blockT`, 0, 1000, 25, item.temperature, 'K')}
      ${makeDualInput('Heat Capacity C', `${idPrefix}blockC`, 50, 1500, 50, item.heatCapacity, 'J/K')}
      ${makeDualInput('Thermal Conductivity κ', `${idPrefix}blockK`, 0.05, 1.0, 0.05, item.conductivity)}
    `;
    document.getElementById(`${idPrefix}toggleBlockBtn`)?.addEventListener('click', () => {
      item.toggle();
      updateElementsList();
    });
    attachDualInput(`${idPrefix}blockT`, val => {
      item.temperature = val;
      item.label = `Ressavoir (${Math.round(val)}K)`;
      updateElementCardLabel(itemIndex, item.label);
    });
    attachDualInput(`${idPrefix}blockC`, val => { item.heatCapacity = val; });
    attachDualInput(`${idPrefix}blockK`, val => { item.conductivity = val; });

  } else if (item instanceof Emitter) {
    const isEnabled = item.enabled !== false;
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:8px;">
        <button id="${idPrefix}emitToggleBtn" class="btn-emitter-toggle ${isEnabled ? 'is-on' : 'is-off'}">
          <span>${isEnabled ? 'EMITTER IS ACTIVE' : 'EMITTER IS DISABLED'}</span>
        </button>
      </div>
      <div class="field-row">
        <div class="field-label"><span>Direction</span></div>
        <div class="btn-toggle-group">
          <button class="sub-toggle-btn ${item.direction === 'right' ? 'active' : ''}" data-seldir="right" title="Right (0°)">→</button>
          <button class="sub-toggle-btn ${item.direction === 'left' ? 'active' : ''}" data-seldir="left" title="Left (180°)">←</button>
          <button class="sub-toggle-btn ${item.direction === 'down' ? 'active' : ''}" data-seldir="down" title="Down (90°)">↓</button>
          <button class="sub-toggle-btn ${item.direction === 'up' ? 'active' : ''}" data-seldir="up" title="Up (270°)">↑</button>
          <button class="sub-toggle-btn ${item.direction === '360' || item.direction === 'radial' ? 'active' : ''}" data-seldir="360" title="Radial (360°)">360°</button>
        </div>
      </div>
      ${makeDualInput('Rate', `${idPrefix}emitRate`, 1, 60, 1, item.rate, '/s')}
      ${makeDualInput('Temperature T', `${idPrefix}emitT`, 0, 1000, 25, item.temperature, 'K')}
      ${makeDualInput('Particle Mass m', `${idPrefix}emitM`, 0.2, 5.0, 0.2, item.mass || 1.0)}
      ${makeDualInput('Max Count Limit (0 = ∞)', `${idPrefix}emitMax`, 0, 500, 10, item.maxParticles || 0)}
    `;
    document.getElementById(`${idPrefix}emitToggleBtn`)?.addEventListener('click', () => {
      item.toggle();
      updateElementsList();
    });
    bodyContainer.querySelectorAll('[data-seldir]').forEach(btn => {
      btn.addEventListener('click', () => {
        bodyContainer.querySelectorAll('[data-seldir]').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        item.direction = btn.dataset.seldir;
      });
    });
    attachDualInput(`${idPrefix}emitRate`, val => { item.rate = Math.round(val); updateElementCardLabel(itemIndex, `${item.label || 'Emitter'} [${item.rate}/s, ${Math.round(item.temperature)}K]`); });
    attachDualInput(`${idPrefix}emitT`, val => { item.temperature = val; });
    attachDualInput(`${idPrefix}emitM`, val => { item.mass = val; });
    attachDualInput(`${idPrefix}emitMax`, val => { item.maxParticles = Math.round(val); });

  } else if (item instanceof SensorZone) {
    const driftText = (item.displayDriftSpeed && item.displayDriftSpeed > 0)
      ? `${item.displayDriftSpeed.toFixed(1)} px/s (${Math.round((item.driftAngle * 180) / Math.PI)}°)`
      : '0.0 px/s (Equilibrium)';
    const boundPistonId = item.pistonBinding?.pistonId || '';
    const boundEdge = item.pistonBinding?.edge || 'right';
    const lockCross = item.pistonBinding ? (item.pistonBinding.lockCrossDimension !== false) : true;

    let pistonOptions = `<option value="">None (Unbound / Static)</option>`;
    for (let pIdx = 0; pIdx < engine.pistons.length; pIdx++) {
      const p = engine.pistons[pIdx];
      const pName = p.label ? `${p.label} (Piston ${pIdx + 1})` : `Piston ${pIdx + 1}`;
      pistonOptions += `<option value="${p.id}" ${boundPistonId === p.id ? 'selected' : ''}>${pName}</option>`;
    }

    bodyContainer.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Chamber Name</span></div>
        <input type="text" id="${idPrefix}sensName" value="${item.label}" class="styled-select" style="width:100%;">
      </div>
      <div class="field-row">
        <div class="field-label"><span>Border & Chart Color</span></div>
        <input type="color" id="${idPrefix}sensColor" value="${item.color || '#38bdf8'}" class="styled-select" style="width:54px; height:26px; padding:1px; cursor:pointer;">
      </div>
      <div class="field-row" style="margin-top:4px;">
        <div class="field-label"><span>Piston Binding 🔗</span></div>
        <select id="${idPrefix}pistonBindSelect" class="styled-select" style="width:100%;">
          ${pistonOptions}
        </select>
      </div>
      <div id="${idPrefix}pistonBindControls" style="display:${boundPistonId ? 'block' : 'none'}; margin-top:4px;">
        <div class="field-row">
          <div class="field-label"><span>Bound Chamber Edge</span></div>
          <select id="${idPrefix}pistonEdgeSelect" class="styled-select" style="width:100%;">
            <option value="right" ${boundEdge === 'right' ? 'selected' : ''}>Right Edge (Left of Piston)</option>
            <option value="left" ${boundEdge === 'left' ? 'selected' : ''}>Left Edge (Right of Piston)</option>
            <option value="bottom" ${boundEdge === 'bottom' ? 'selected' : ''}>Bottom Edge (Above Piston)</option>
            <option value="top" ${boundEdge === 'top' ? 'selected' : ''}>Top Edge (Below Piston)</option>
          </select>
        </div>
        <div class="field-row" style="margin-top:4px; display:flex; align-items:center; justify-content:space-between;">
          <label style="font-size:11px; color:#cbd5e1; cursor:pointer; display:flex; align-items:center; gap:6px;">
            <input type="checkbox" id="${idPrefix}lockCrossDim" ${lockCross ? 'checked' : ''} style="cursor:pointer;">
            <span>Lock Span to Piston</span>
          </label>
          <button id="${idPrefix}btnAutoSnap" class="btn-tool-secondary" style="font-size:10px; padding:2px 8px; cursor:pointer;">Snap Now</button>
        </div>
      </div>
      <div class="stat-card" style="margin-top:6px;">
        <span class="stat-label">Net Drift Trend ⟨v_drift⟩</span>
        <span class="stat-value" style="font-size:12px; color:#22c55e;">${driftText}</span>
      </div>
    `;

    const bindSelect = document.getElementById(`${idPrefix}pistonBindSelect`);
    const edgeSelect = document.getElementById(`${idPrefix}pistonEdgeSelect`);
    const lockCrossCheckbox = document.getElementById(`${idPrefix}lockCrossDim`);
    const btnAutoSnap = document.getElementById(`${idPrefix}btnAutoSnap`);
    const controlsDiv = document.getElementById(`${idPrefix}pistonBindControls`);

    const refreshBinding = () => {
      const pid = bindSelect?.value;
      if (!pid) {
        item.unbindPiston();
        if (controlsDiv) controlsDiv.style.display = 'none';
      } else {
        const p = engine.getPistonById(pid);
        if (p) {
          const edge = edgeSelect?.value || 'right';
          const lock = lockCrossCheckbox ? lockCrossCheckbox.checked : true;
          item.bindToPiston(p, edge, lock);
          if (controlsDiv) controlsDiv.style.display = 'block';
        }
      }
      updateElementsList();
      updatePopupPosition();
    };

    bindSelect?.addEventListener('change', () => {
      const pid = bindSelect.value;
      if (pid) {
        const p = engine.getPistonById(pid);
        if (p) {
          const sMidX = item.x + item.width * 0.5;
          const sMidY = item.y + item.height * 0.5;
          let bestEdge = 'right';
          if (p.orientation === 'horizontal') {
            bestEdge = (sMidX < p.x) ? 'right' : 'left';
          } else {
            bestEdge = (sMidY < p.y) ? 'bottom' : 'top';
          }
          if (edgeSelect) edgeSelect.value = bestEdge;
        }
      }
      refreshBinding();
    });

    edgeSelect?.addEventListener('change', refreshBinding);
    lockCrossCheckbox?.addEventListener('change', refreshBinding);
    btnAutoSnap?.addEventListener('click', () => {
      const p = engine.getPistonById(bindSelect?.value);
      if (p) {
        item.updateBoundsFromPiston(p);
        updatePopupPosition();
      }
    });

    document.getElementById(`${idPrefix}sensName`)?.addEventListener('input', (e) => {
      item.label = e.target.value.trim() || 'Chamber';
      updateElementsList();
    });
    document.getElementById(`${idPrefix}sensColor`)?.addEventListener('input', (e) => {
      item.color = e.target.value;
      updateElementsList();
    });

  } else if (item instanceof TextLabel) {
    bodyContainer.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Text Content</span></div>
        <input type="text" id="${idPrefix}textContent" value="${item.text}" class="styled-select" style="width:100%;">
      </div>
      ${makeDualInput('Font Size', `${idPrefix}fontSize`, 10, 48, 1, item.fontSize, 'px')}
    `;
    document.getElementById(`${idPrefix}textContent`)?.addEventListener('input', (e) => {
      item.text = e.target.value;
      updateElementsList();
    });
    attachDualInput(`${idPrefix}fontSize`, val => {
      item.fontSize = Math.round(val);
      item.height = item.fontSize + 12;
    });

  } else if (item instanceof Sink) {
    const isSinkActive = item.isActive !== false;
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:8px;">
        <button id="${idPrefix}toggleSinkBtn" class="btn-emitter-toggle ${isSinkActive ? 'is-on' : 'is-off'}">
          <span>${isSinkActive ? 'ABSORBER IS ACTIVE' : 'ABSORBER IS DISABLED'}</span>
        </button>
      </div>
      <div class="field-row">
        <div class="field-label"><span>Direction</span></div>
        <div class="btn-toggle-group">
          <button class="sub-toggle-btn ${item.direction === 'right' ? 'active' : ''}" data-sinkdir="right" title="Right (0°)">→</button>
          <button class="sub-toggle-btn ${item.direction === 'left' ? 'active' : ''}" data-sinkdir="left" title="Left (180°)">←</button>
          <button class="sub-toggle-btn ${item.direction === 'down' ? 'active' : ''}" data-sinkdir="down" title="Down (90°)">↓</button>
          <button class="sub-toggle-btn ${item.direction === 'up' ? 'active' : ''}" data-sinkdir="up" title="Up (270°)">↑</button>
          <button class="sub-toggle-btn ${item.direction === '360' || !item.direction ? 'active' : ''}" data-sinkdir="360" title="All (360°)">360°</button>
        </div>
      </div>
      <div class="field-row">
        <div class="field-label"><span>Filter by Temperature</span></div>
        <div class="btn-toggle-group">
          <button class="sub-toggle-btn ${(item.tempFilterMode || 'all') === 'all' ? 'active' : ''}" id="${idPrefix}btnTAll">All</button>
          <button class="sub-toggle-btn ${item.tempFilterMode === 'above' ? 'active' : ''}" id="${idPrefix}btnTAbove">&gt; T</button>
          <button class="sub-toggle-btn ${item.tempFilterMode === 'below' ? 'active' : ''}" id="${idPrefix}btnTBelow">&lt; T</button>
        </div>
      </div>
      ${(item.tempFilterMode && item.tempFilterMode !== 'all') ? makeDualInput('Threshold Temperature T', `${idPrefix}sinkT`, 0, 1000, 25, item.filterTemperature || 300, 'K') : ''}
      ${makeDualInput('Max Absorb Limit (0 = ∞)', `${idPrefix}sinkMax`, 0, 500, 10, item.maxParticles || 0)}
      ${makeDualInput('Absorption Efficiency', `${idPrefix}sinkEff`, 0.1, 1.0, 0.05, item.absorptionEfficiency)}
    `;

    document.getElementById(`${idPrefix}toggleSinkBtn`)?.addEventListener('click', () => {
      item.toggle();
      updateElementsList();
    });
    bodyContainer.querySelectorAll('[data-sinkdir]').forEach(btn => {
      btn.addEventListener('click', () => {
        bodyContainer.querySelectorAll('[data-sinkdir]').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        item.direction = btn.dataset.sinkdir;
      });
    });
    document.getElementById(`${idPrefix}btnTAll`)?.addEventListener('click', () => {
      item.tempFilterMode = 'all';
      updateElementsList();
    });
    document.getElementById(`${idPrefix}btnTAbove`)?.addEventListener('click', () => {
      item.tempFilterMode = 'above';
      updateElementsList();
    });
    document.getElementById(`${idPrefix}btnTBelow`)?.addEventListener('click', () => {
      item.tempFilterMode = 'below';
      updateElementsList();
    });
    if (item.tempFilterMode && item.tempFilterMode !== 'all') {
      attachDualInput(`${idPrefix}sinkT`, val => { item.filterTemperature = val; });
    }
    attachDualInput(`${idPrefix}sinkMax`, val => { item.maxParticles = Math.round(val); });
    attachDualInput(`${idPrefix}sinkEff`, val => { item.absorptionEfficiency = val; });

  } else if (item instanceof ParticleGroup) {
    const activeCount = item.getActiveCount(engine);
    const avgT = Math.round(item.getAverageTemperature(engine));
    bodyContainer.innerHTML = `
      <div class="stat-card" style="margin-bottom:8px;">
        <span class="stat-label">Active Particles in Group</span>
        <span class="stat-value" style="font-size:12px; color:#38bdf8;">${activeCount} particles (avg ${avgT} K)</span>
      </div>
      ${makeDualInput('Gas Temperature T', `${idPrefix}pgTemp`, 0, 1000, 25, item.temperature, 'K')}
      ${makeDualInput('Particle Mass m', `${idPrefix}pgMass`, 0.2, 5.0, 0.2, item.mass)}
      <button id="${idPrefix}selectPtsBtn" class="btn-secondary-action" style="width:100%; margin-top:6px; font-size:11px; padding:6px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); border-radius:4px; color:#38bdf8; cursor:pointer;">Select Particles on Canvas</button>
      <button id="${idPrefix}delGroupBtn" class="btn-danger-action" style="width:100%; margin-top:6px; font-size:11px; padding:6px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); border-radius:4px; color:#ef4444; cursor:pointer;">Delete Spawner Group</button>
    `;
    attachDualInput(`${idPrefix}pgTemp`, val => {
      engine.setGroupTemperature(item, val);
      updateElementsList();
    });
    attachDualInput(`${idPrefix}pgMass`, val => {
      engine.setGroupMass(item, val);
    });
    document.getElementById(`${idPrefix}selectPtsBtn`)?.addEventListener('click', () => {
      const pts = item.getActiveParticles(engine);
      pts.forEach(p => { p.selected = true; });
      app.selectedItems = [...pts];
      updateElementsList();
    });
    document.getElementById(`${idPrefix}delGroupBtn`)?.addEventListener('click', () => {
      recordUndoState();
      engine.deleteParticleGroup(item);
      app.selectedItems = [];
      updateElementsList();
    });

  } else if (item instanceof Regulator) {
    const isRegActive = item.isActive !== false;
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:8px;">
        <button id="${idPrefix}toggleRegBtn" class="btn-emitter-toggle ${isRegActive ? 'is-on' : 'is-off'}">
          <span>${isRegActive ? 'REGULATOR IS ACTIVE' : 'REGULATOR IS DISABLED'}</span>
        </button>
      </div>
      <div class="stat-card" style="margin-bottom:8px;">
        <span class="stat-label">Particles in Zone</span>
        <span class="stat-value" style="font-size:12px; color:#10b981;">${item.currentCount || 0} / ${item.targetCount} pts (band ±${item.hysteresis})</span>
      </div>
      ${makeDualInput('Gas Temperature T', `${idPrefix}regTemp`, 0, 1000, 25, item.temperature, 'K')}
      ${makeDualInput('Particle Mass m', `${idPrefix}regMass`, 0.2, 5.0, 0.2, item.mass)}
      ${makeDualInput('Target Particle Count N', `${idPrefix}regTarget`, 5, 300, 5, item.targetCount)}
      ${makeDualInput('Hysteresis Band ΔN', `${idPrefix}regHyst`, 0, 20, 1, item.hysteresis)}
      ${makeDualInput('Max Adjustment Rate', `${idPrefix}regRate`, 1, 60, 1, item.rate, '/s')}
      <button id="${idPrefix}delRegBtn" class="btn-danger-action" style="width:100%; margin-top:6px; font-size:11px; padding:6px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); border-radius:4px; color:#ef4444; cursor:pointer;">Delete Regulator</button>
    `;
    document.getElementById(`${idPrefix}toggleRegBtn`)?.addEventListener('click', () => {
      item.toggle();
      updateElementsList();
    });
    attachDualInput(`${idPrefix}regTemp`, val => { item.temperature = val; });
    attachDualInput(`${idPrefix}regMass`, val => { item.mass = val; });
    attachDualInput(`${idPrefix}regTarget`, val => { item.targetCount = Math.round(val); updateElementCardLabel(itemIndex, `Regulator [Tgt: ${item.targetCount}, ±${item.hysteresis}]`); });
    attachDualInput(`${idPrefix}regHyst`, val => { item.hysteresis = Math.round(val); updateElementCardLabel(itemIndex, `Regulator [Tgt: ${item.targetCount}, ±${item.hysteresis}]`); });
    attachDualInput(`${idPrefix}regRate`, val => { item.rate = val; });
    document.getElementById(`${idPrefix}delRegBtn`)?.addEventListener('click', () => {
      recordUndoState();
      engine.regulators = engine.regulators.filter(r => r !== item);
      engine.elements = engine.elements.filter(el => el !== item);
      app.selectedItems = [];
      updateElementsList();
    });
  }
}
