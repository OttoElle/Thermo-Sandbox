/**
 * SequencerActionFields.js
 * Generates and Extracts Property Inspector Form Controls for Element Action Snapshots.
 * Delegates component rendering and controls to SequencerFieldControls.
 * Conforms to TOOL_CATALOG.md specifications (excludes thickness, spawner, and chamber).
 */

import { SequencerFieldControls } from './SequencerFieldControls.js';

export class SequencerActionFields {
  static getElementType(item) {
    if (!item) return 'unknown';
    // 1. Valves & Walls
    if (item.type === 'manual_valve' || (item.isValve && !item.isCheckValve && !item.isReliefValve)) return 'manual_valve';
    if (item.type === 'check_valve' || item.isCheckValve) return 'check_valve';
    if (item.type === 'relief_valve' || item.isReliefValve) return 'relief_valve';
    if (item.p1 && item.p2 && item.openRatio !== undefined) return 'throttle_valve';
    if (item.openRatio !== undefined) return 'throttle_valve';
    if (item.p1 && item.p2) return 'wall';

    // 2. Piston
    if (item.getTravelLimits || item.isPiston) return 'piston';

    // 3. Particle Sources & Sinks (Must precede generic thermal checks)
    if (item.rate !== undefined && (item.emittedCount !== undefined || item.direction !== undefined || item.enabled !== undefined)) return 'emitter';
    if (item.absorptionEfficiency !== undefined || item.absorbedCount !== undefined || item.tempFilterMode !== undefined) return 'sink';
    if (item.targetCount !== undefined || item.regulationState !== undefined) return 'regulator';

    // 4. Thermals
    if (item.temperatures && Array.isArray(item.temperatures)) return 'regenerator';
    if (item.axis !== undefined && item.heatCapacity !== undefined) return 'regenerator';
    if (item.permeable) return 'heat_exchanger';
    if (item.heatCapacity !== undefined && item.temperature !== undefined) return 'thermal_block';
    if (item.conductance !== undefined || (item.temperature !== undefined && item.contains)) return 'reservoir';

    return 'unknown';
  }

  static renderFields(container, item, existingAction = {}, onChange = null, pfx = 'seqAct_') {
    const elType = existingAction.type || this.getElementType(item);
    let html = '';

    if (elType === 'piston') {
      html = SequencerFieldControls.renderPistonHTML(item, existingAction, pfx);
    } else if (elType.includes('valve') || elType === 'throttle_valve') {
      html = SequencerFieldControls.renderValveHTML(item, existingAction, elType, pfx);
    } else if (['reservoir', 'heat_exchanger', 'regenerator', 'thermal_block'].includes(elType)) {
      html = SequencerFieldControls.renderThermalHTML(item, existingAction, elType, pfx);
    } else if (['emitter', 'sink', 'regulator'].includes(elType)) {
      html = SequencerFieldControls.renderParticleHTML(item, existingAction, elType, pfx);
    } else {
      const cond = existingAction.conductivity !== undefined ? existingAction.conductivity : (item.conductivity || 0);
      html = SequencerFieldControls.makeDualInput('Conductivity κ', `${pfx}wCond`, 0, 1, 0.05, cond);
    }

    container.innerHTML = html;
    this._attachEventListeners(container, item, existingAction, elType, onChange, pfx);
  }

  static _attachEventListeners(container, item, act, elType, onChange = null, pfx = 'seqAct_') {
    // 1. Synchronize all Dual Inputs in container & track default modifications
    container.querySelectorAll('.field-row').forEach(row => {
      const slider = row.querySelector('.styled-slider');
      const num = row.querySelector('.dual-num-input');
      const defValStr = row.dataset.def;
      const hasDef = defValStr !== undefined && defValStr !== '';
      const defVal = hasDef ? parseFloat(defValStr) : NaN;

      const updateMod = (val) => {
        if (!isNaN(defVal)) row.classList.toggle('is-modified', Math.abs(val - defVal) > 1e-4);
      };

      if (slider && num) {
        slider.addEventListener('input', () => {
          num.value = slider.value;
          updateMod(parseFloat(slider.value));
          if (onChange) onChange(this.extractSnapshot(container, item, act));
        });
        num.addEventListener('input', () => {
          const v = parseFloat(num.value);
          if (!isNaN(v)) {
            slider.value = v;
            updateMod(v);
            if (onChange) onChange(this.extractSnapshot(container, item, act));
          }
        });
      }
    });

    // 2. Track Select changes against default
    container.querySelectorAll('select').forEach(sel => {
      const row = sel.closest('.field-row');
      sel.addEventListener('change', () => {
        if (row && row.dataset.def !== undefined && row.dataset.def !== '') {
          row.classList.toggle('is-modified', String(sel.value) !== String(row.dataset.def));
        }
        if (onChange) onChange(this.extractSnapshot(container, item, act));
      });
    });

    // 3. Track Button Group changes against default & toggle active
    container.querySelectorAll('.btn-toggle-group').forEach(grp => {
      const row = grp.closest('.field-row');
      grp.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          grp.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const v = btn.dataset.val || btn.dataset.dir;
          if (row && row.dataset.def !== undefined && row.dataset.def !== '') {
            row.classList.toggle('is-modified', String(v) !== String(row.dataset.def));
          }
          if (onChange) onChange(this.extractSnapshot(container, item, act));
        });
      });
    });

    // 4. Element specific interactive handlers
    if (elType === 'piston') {
      const motionSelect = container.querySelector(`[id$="motionType"]`);
      const dynamicSub = container.querySelector(`[id$="pDynamic"]`);
      if (motionSelect && dynamicSub) {
        motionSelect.addEventListener('change', () => {
          const m = motionSelect.value;
          let subHtml = '';
          if (m === 'spring') {
            subHtml = SequencerFieldControls.makeDualInput('Spring Constant k', `${pfx}pSpring`, 10, 500, 10, act.springK || item.springK || 50, 'N/m', 50);
          } else if (m === 'motorized') {
            subHtml = `
              ${SequencerFieldControls.makeDualInput('Motor Frequency f', `${pfx}pFreq`, 0.1, 5.0, 0.1, act.frequency || item.frequency || 0.8, 'Hz', 0.8)}
              ${SequencerFieldControls.makeDualInput('Phase Offset φ', `${pfx}pPhase`, -180, 180, 15, act.phase || item.phase || 0, '°', 0)}
            `;
          } else if (m === 'damper') {
            subHtml = SequencerFieldControls.makeDualInput('Damping Load γ', `${pfx}pDamp`, 5, 150, 5, act.dampingCoeff || item.dampingCoeff || 25, 'Ns/m', 25);
          }
          dynamicSub.innerHTML = subHtml;
          dynamicSub.querySelectorAll('.field-row').forEach(row => {
            const s = row.querySelector('.styled-slider');
            const n = row.querySelector('.dual-num-input');
            const defValStr = row.dataset.def;
            const defVal = defValStr ? parseFloat(defValStr) : NaN;
            if (s && n) {
              s.addEventListener('input', () => {
                n.value = s.value;
                if (!isNaN(defVal)) row.classList.toggle('is-modified', Math.abs(parseFloat(s.value) - defVal) > 1e-4);
                if (onChange) onChange(this.extractSnapshot(container, item, act));
              });
              n.addEventListener('input', () => {
                const v = parseFloat(n.value);
                if (!isNaN(v)) {
                  s.value = v;
                  if (!isNaN(defVal)) row.classList.toggle('is-modified', Math.abs(v - defVal) > 1e-4);
                  if (onChange) onChange(this.extractSnapshot(container, item, act));
                }
              });
            }
          });
          if (onChange) onChange(this.extractSnapshot(container, item, act));
        });
      }
    }

    if (elType === 'sink') {
      const filterGroup = container.querySelector(`[id$="snkFilterMode"]`);
      const filterTRow = container.querySelector(`[id$="snkFilterTRow"]`);
      if (filterGroup && filterTRow) {
        filterGroup.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => {
            filterTRow.style.display = btn.dataset.val !== 'all' ? 'block' : 'none';
          });
        });
      }
    }
  }

  static extractSnapshot(container, item, existingAction = {}) {
    const elType = existingAction.type || this.getElementType(item);
    const getVal = (suffix, def = 0) => {
      const el = container.querySelector(`[id$="${suffix}_num"]`) || container.querySelector(`[id$="${suffix}_slider"]`);
      return el ? parseFloat(el.value) : def;
    };
    const getActiveVal = (suffix, def = '') => {
      const grp = container.querySelector(`[id$="${suffix}"]`);
      const activeBtn = grp ? grp.querySelector('.sub-toggle-btn.active') : null;
      return activeBtn ? (activeBtn.dataset.val || activeBtn.dataset.dir || def) : def;
    };
    const getSelectVal = (suffix, def = '') => {
      const el = container.querySelector(`[id$="${suffix}"]`);
      return el ? el.value : def;
    };

    const snapshot = {
      id: existingAction.id || 'act_' + Math.random().toString(36).substring(2, 9),
      targetId: item.id,
      type: elType
    };

    if (elType === 'piston') {
      const stroke = getSelectVal('strokeCommand', 'drive_tdc');
      const motion = getSelectVal('motionType', 'free');
      snapshot.strokeCommand = stroke;
      snapshot.mode = stroke;
      snapshot.motionType = motion;
      snapshot.targetSpeed = getVal('pSpeed', 160);
      snapshot.mass = getVal('pMass', 30);
      snapshot.conductivity = getVal('pCond', 0.2);
      if (motion === 'spring') snapshot.springK = getVal('pSpring', 50);
      else if (motion === 'motorized') {
        snapshot.motorFrequency = getVal('pFreq', 0.8);
        snapshot.frequency = snapshot.motorFrequency;
        snapshot.motorPhase = getVal('pPhase', 0);
        snapshot.phase = snapshot.motorPhase;
      } else if (motion === 'damper') {
        snapshot.dampingGamma = getVal('pDamp', 25);
        snapshot.dampingCoeff = snapshot.dampingGamma;
      }
    } else if (elType === 'manual_valve') {
      const vs = getSelectVal('valveState', 'open');
      snapshot.valveState = vs;
      snapshot.isOpen = vs === 'open';
      snapshot.conductivity = getVal('vCond', 0);
    } else if (elType === 'check_valve') {
      const d = parseInt(getActiveVal('checkDir', '1'), 10);
      snapshot.direction = isNaN(d) ? 1 : d;
      snapshot.flowDirection = snapshot.direction === 1 ? 'forward' : 'reverse';
      snapshot.conductivity = getVal('vCond', 0);
    } else if (elType === 'relief_valve') {
      snapshot.reliefMode = getActiveVal('reliefMode', '1-way');
      snapshot.triggerPressure = getVal('vTrig', 250);
      snapshot.pressureHysteresis = getVal('vHyst', 25);
      snapshot.hysteresis = snapshot.pressureHysteresis;
      snapshot.conductivity = getVal('vCond', 0);
    } else if (elType === 'throttle_valve') {
      snapshot.state = getSelectVal('tvState', 'active');
      snapshot.openRatio = getVal('tvOpen', 30) / 100.0;
      snapshot.conductivity = getVal('vCond', 0);
    } else if (['reservoir', 'heat_exchanger', 'regenerator', 'thermal_block'].includes(elType)) {
      snapshot.isActive = getSelectVal('thState', 'true') === 'true';
      snapshot.temperature = getVal('thTemp', 300);
      snapshot.conductivity = getVal('thCond', 0.6);
      snapshot.thermalCoupling = snapshot.conductivity;
      if (elType === 'reservoir') snapshot.conductance = snapshot.conductivity;
      if (elType === 'regenerator') {
        snapshot.orientation = getActiveVal('regenOrient', 'horizontal');
        snapshot.axis = snapshot.orientation;
        snapshot.heatCapacity = getVal('thCap', 400);
      } else if (elType === 'thermal_block') {
        snapshot.heatCapacity = getVal('thCap', 300);
      }
    } else if (elType === 'emitter') {
      snapshot.state = getSelectVal('emState', 'firing');
      snapshot.isActive = snapshot.state === 'firing';
      snapshot.direction = getActiveVal('emDir', 'right');
      snapshot.flowDirection = snapshot.direction;
      snapshot.rate = Math.round(getVal('emRate', 8));
      snapshot.temperature = getVal('emTemp', 300);
      snapshot.mass = getVal('emMass', 1.0);
      snapshot.particleMass = snapshot.mass;
      snapshot.maxParticles = Math.round(getVal('emMax', 0));
      snapshot.capacityLimit = snapshot.maxParticles;
    } else if (elType === 'sink') {
      snapshot.isActive = getSelectVal('snkState', 'true') === 'true';
      snapshot.direction = getActiveVal('snkDir', '360');
      snapshot.tempFilterMode = getActiveVal('snkFilterMode', 'all');
      snapshot.thermalFilter = snapshot.tempFilterMode;
      snapshot.filterTemperature = getVal('snkFilterT', 300);
      snapshot.cutoffTemp = snapshot.filterTemperature;
      snapshot.absorptionEfficiency = getVal('snkEff', 100) / 100.0;
      snapshot.efficiency = snapshot.absorptionEfficiency;
      snapshot.maxParticles = Math.round(getVal('snkMax', 0));
      snapshot.maxAbsorbed = snapshot.maxParticles;
    } else if (elType === 'regulator') {
      snapshot.isActive = getSelectVal('regState', 'true') === 'true';
      snapshot.targetCount = Math.round(getVal('regTgt', 50));
      snapshot.hysteresis = Math.round(getVal('regHyst', 3));
      snapshot.temperature = getVal('regTemp', 300);
      snapshot.mass = getVal('regMass', 1.0);
      snapshot.rate = Math.round(getVal('regRate', 15));
      snapshot.maxFlowRate = snapshot.rate;
    } else {
      snapshot.conductivity = getVal('wCond', 0);
    }

    return snapshot;
  }
}
