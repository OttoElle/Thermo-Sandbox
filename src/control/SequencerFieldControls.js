/**
 * SequencerFieldControls.js
 * Modular UI field builders with default indicators and live modified highlighting.
 * Conforms to TOOL_CATALOG.md specifications.
 */

export class SequencerFieldControls {
  static makeDualInput(label, id, min, max, step, value, unit = '', defVal = null) {
    const hasDef = defVal !== null && defVal !== undefined;
    const isMod = hasDef && Math.abs(parseFloat(value) - parseFloat(defVal)) > 1e-4;
    const defTag = hasDef ? `<span class="seq-def-indicator" title="Standard: ${defVal}${unit}">(def: ${defVal})</span>` : '';
    const defPct = hasDef ? Math.max(0, Math.min(100, ((parseFloat(defVal) - min) / (max - min)) * 100)) : null;
    return `
      <div class="field-row ${isMod ? 'is-modified' : ''}" data-def="${hasDef ? defVal : ''}" id="row_${id}">
        <div class="field-label"><span>${label}</span>${defTag}</div>
        <div class="dual-input-row">
          <div class="slider-track-wrap">
            <input type="range" id="${id}_slider" min="${min}" max="${max}" step="${step}" value="${value}" class="styled-slider">
            ${hasDef ? `<div class="slider-notch" style="left: ${defPct}%;" title="Default: ${defVal}${unit}"></div>` : ''}
          </div>
          <input type="number" id="${id}_num" min="${min}" max="${max}" step="${step}" value="${value}" class="dual-num-input">
          ${unit ? `<span style="font-size:10px; color:var(--text-dim);">${unit}</span>` : ''}
        </div>
      </div>
    `;
  }

  static attachDualInput(container, id, onChange) {
    const slider = container.querySelector(`#${id}_slider`);
    const num = container.querySelector(`#${id}_num`);
    if (!slider || !num) return;
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      num.value = val;
      if (onChange) onChange(val);
    });
    num.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        slider.value = val;
        if (onChange) onChange(val);
      }
    });
  }

  static makeDirection5(id, currentDir = 'right', defDir = 'right') {
    const isMod = String(currentDir) !== String(defDir);
    return `
      <div class="field-row ${isMod ? 'is-modified' : ''}" data-def="${defDir}" id="row_${id}">
        <div class="field-label"><span>Direction</span><span class="seq-def-indicator">(def: ${defDir})</span></div>
        <div class="btn-toggle-group" id="${id}">
          <button type="button" class="sub-toggle-btn ${currentDir === 'right' ? 'active' : ''}" data-dir="right" title="Right">→</button>
          <button type="button" class="sub-toggle-btn ${currentDir === 'left' ? 'active' : ''}" data-dir="left" title="Left">←</button>
          <button type="button" class="sub-toggle-btn ${currentDir === 'down' ? 'active' : ''}" data-dir="down" title="Down">↓</button>
          <button type="button" class="sub-toggle-btn ${currentDir === 'up' ? 'active' : ''}" data-dir="up" title="Up">↑</button>
          <button type="button" class="sub-toggle-btn ${currentDir === '360' || currentDir === 'radial' ? 'active' : ''}" data-dir="360" title="Radial">360°</button>
        </div>
      </div>
    `;
  }

  static attachDirection5(container, id, onChange) {
    const group = container.querySelector(`#${id}`);
    if (!group) return;
    group.querySelectorAll('[data-dir]').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('[data-dir]').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        if (onChange) onChange(btn.dataset.dir);
      });
    });
  }

  static makeToggleGroup(id, options, currentVal, defVal = null) {
    const hasDef = defVal !== null && defVal !== undefined;
    const isMod = hasDef && String(currentVal) !== String(defVal);
    const defTag = hasDef ? `<span class="seq-def-indicator">(def: ${defVal})</span>` : '';
    const btns = options.map(opt => `
      <button type="button" class="sub-toggle-btn ${String(opt.value) === String(currentVal) ? 'active' : ''}" data-val="${opt.value}">${opt.label}</button>
    `).join('');
    return `
      <div class="field-row ${isMod ? 'is-modified' : ''}" data-def="${hasDef ? defVal : ''}" id="row_${id}">
        <div class="field-label"><span>${id.replace(/([A-Z])/g, ' $1')}</span>${defTag}</div>
        <div class="btn-toggle-group" id="${id}">${btns}</div>
      </div>
    `;
  }

  static attachToggleGroup(container, id, onChange) {
    const group = container.querySelector(`#${id}`);
    if (!group) return;
    group.querySelectorAll('[data-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('[data-val]').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        if (onChange) onChange(btn.dataset.val);
      });
    });
  }

  static renderPistonHTML(item, act, pfx = 'seqAct_') {
    const stroke = act.strokeCommand || act.mode || 'drive_tdc';
    const motion = act.motionType || item.mode || 'free';
    const mass = act.mass !== undefined ? act.mass : (item.mass || 30);
    const cond = act.conductivity !== undefined ? act.conductivity : (item.conductivity !== undefined ? item.conductivity : 0.20);
    const spd = act.targetSpeed !== undefined ? act.targetSpeed : 160;
    const springK = act.springK !== undefined ? act.springK : (item.springK || 50);
    const freq = act.frequency !== undefined ? act.frequency : (item.frequency || 0.8);
    const phase = act.phase !== undefined ? act.phase : (item.phase || 0);
    const damp = act.dampingCoeff !== undefined ? act.dampingCoeff : (item.dampingCoeff || 25);

    let modeInputs = '';
    if (motion === 'spring') {
      modeInputs = this.makeDualInput('Spring Constant k', `${pfx}pSpring`, 10, 500, 10, springK, 'N/m', 50);
    } else if (motion === 'motorized') {
      modeInputs = `
        ${this.makeDualInput('Motor Frequency f', `${pfx}pFreq`, 0.1, 5.0, 0.1, freq, 'Hz', 0.8)}
        ${this.makeDualInput('Phase Offset φ', `${pfx}pPhase`, -180, 180, 15, phase, '°', 0)}
      `;
    } else if (motion === 'damper') {
      modeInputs = this.makeDualInput('Damping Load γ', `${pfx}pDamp`, 5, 150, 5, damp, 'Ns/m', 25);
    }

    return `
      <div class="field-row ${stroke !== 'drive_tdc' ? 'is-modified' : ''}" data-def="drive_tdc" id="row_${pfx}strokeCommand">
        <div class="field-label"><span>Stroke Command</span><span class="seq-def-indicator">(def: TDC)</span></div>
        <select id="${pfx}strokeCommand" class="styled-select" style="width:100%;">
          <option value="drive_tdc" ${stroke === 'drive_tdc' ? 'selected' : ''}>Drive to TDC (Min Volume)</option>
          <option value="drive_bdc" ${stroke === 'drive_bdc' ? 'selected' : ''}>Drive to BDC (Max Volume)</option>
          <option value="hold" ${stroke === 'hold' ? 'selected' : ''}>Hold Position</option>
          <option value="free" ${stroke === 'free' ? 'selected' : ''}>Free Float</option>
        </select>
      </div>
      <div class="field-row ${motion !== 'free' ? 'is-modified' : ''}" data-def="free" id="row_${pfx}motionType">
        <div class="field-label"><span>Motion Mode</span><span class="seq-def-indicator">(def: Free)</span></div>
        <select id="${pfx}motionType" class="styled-select" style="width:100%;">
          <option value="free" ${motion === 'free' ? 'selected' : ''}>Free Floating (Displacer)</option>
          <option value="spring" ${motion === 'spring' ? 'selected' : ''}>Spring Restrained (Accumulator)</option>
          <option value="motorized" ${motion === 'motorized' ? 'selected' : ''}>Motorized Crank (Compressor)</option>
          <option value="damper" ${motion === 'damper' ? 'selected' : ''}>Viscous Damper (Expander)</option>
        </select>
      </div>
      ${this.makeDualInput('Drive Speed', `${pfx}pSpeed`, 20, 400, 10, spd, 'px/s', 160)}
      ${this.makeDualInput('Piston Mass m', `${pfx}pMass`, 0, 150, 5, mass, 'kg', 30)}
      ${this.makeDualInput('Conductivity κ', `${pfx}pCond`, 0, 1, 0.05, cond, '', 0.20)}
      <div id="${pfx}pDynamic">${modeInputs}</div>
    `;
  }

  static renderValveHTML(item, act, elType, pfx = 'seqAct_') {
    const cond = act.conductivity !== undefined ? act.conductivity : (item.conductivity || 0);

    if (elType === 'manual_valve') {
      const isOpen = act.valveState === 'open' || (act.valveState === undefined && item.isOpen !== false);
      return `
        <div class="field-row ${!isOpen ? 'is-modified' : ''}" data-def="open">
          <div class="field-label"><span>Valve State</span><span class="seq-def-indicator">(def: Open)</span></div>
          <select id="${pfx}valveState" class="styled-select" style="width:100%;">
            <option value="open" ${isOpen ? 'selected' : ''}>VALVE IS OPEN (Passable)</option>
            <option value="closed" ${!isOpen ? 'selected' : ''}>VALVE IS CLOSED (Solid Barrier)</option>
          </select>
        </div>
        ${this.makeDualInput('Conductivity κ', `${pfx}vCond`, 0, 1, 0.05, cond, '', 0.0)}
      `;
    }

    if (elType === 'check_valve') {
      const dir = act.direction !== undefined ? act.direction : (item.direction || 1);
      return `
        <div class="field-row ${dir !== 1 ? 'is-modified' : ''}" data-def="1">
          <div class="field-label"><span>Allowed Flow Direction</span><span class="seq-def-indicator">(def: Forward)</span></div>
          <div class="btn-toggle-group" id="${pfx}checkDir">
            <button type="button" class="sub-toggle-btn ${dir === 1 ? 'active' : ''}" data-val="1">Forward →</button>
            <button type="button" class="sub-toggle-btn ${dir === -1 ? 'active' : ''}" data-val="-1">Reverse ←</button>
          </div>
        </div>
        ${this.makeDualInput('Conductivity κ', `${pfx}vCond`, 0, 1, 0.05, cond, '', 0.0)}
      `;
    }

    if (elType === 'relief_valve') {
      const trig = act.triggerPressure !== undefined ? act.triggerPressure : (item.triggerPressure || 250);
      const hyst = act.pressureHysteresis !== undefined ? act.pressureHysteresis : (item.pressureHysteresis !== undefined ? item.pressureHysteresis : 25);
      const mode = act.reliefMode || item.reliefMode || '1-way';
      return `
        <div class="field-row ${mode !== '1-way' && mode !== 'oneway' ? 'is-modified' : ''}" data-def="1-way">
          <div class="field-label"><span>Relief Mode</span><span class="seq-def-indicator">(def: 1-Way)</span></div>
          <div class="btn-toggle-group" id="${pfx}reliefMode">
            <button type="button" class="sub-toggle-btn ${mode === '1-way' || mode === 'oneway' ? 'active' : ''}" data-val="1-way">1-Way</button>
            <button type="button" class="sub-toggle-btn ${mode === '2-way' || mode === 'twoway' ? 'active' : ''}" data-val="2-way">2-Way</button>
          </div>
        </div>
        ${this.makeDualInput('Trigger Pressure P_max', `${pfx}vTrig`, 50, 1000, 25, trig, 'Pa', 250)}
        ${this.makeDualInput('Hysteresis Band ΔP', `${pfx}vHyst`, 0, 100, 5, hyst, 'Pa', 25)}
        ${this.makeDualInput('Conductivity κ', `${pfx}vCond`, 0, 1, 0.05, cond, '', 0.0)}
      `;
    }

    // throttle_valve
    const state = act.state || (item.openRatio > 0 ? 'active' : 'bypassed');
    const ratio = act.openRatio !== undefined ? Math.round(act.openRatio * 100) : Math.round((item.openRatio !== undefined ? item.openRatio : 0.3) * 100);
    return `
      <div class="field-row ${state !== 'active' ? 'is-modified' : ''}" data-def="active">
        <div class="field-label"><span>Throttle State</span><span class="seq-def-indicator">(def: Active)</span></div>
        <select id="${pfx}tvState" class="styled-select" style="width:100%;">
          <option value="active" ${state === 'active' ? 'selected' : ''}>THROTTLE IS ACTIVE</option>
          <option value="bypassed" ${state === 'bypassed' ? 'selected' : ''}>BYPASSED (100% Open)</option>
        </select>
      </div>
      ${this.makeDualInput('Opening Ratio', `${pfx}tvOpen`, 0, 100, 5, ratio, '%', 30)}
      ${this.makeDualInput('Conductivity κ', `${pfx}vCond`, 0, 1, 0.05, cond, '', 0.0)}
    `;
  }

  static renderThermalHTML(item, act, elType, pfx = 'seqAct_') {
    const isActive = act.isActive !== undefined ? act.isActive : (item.isActive !== false);
    const defT = elType === 'reservoir' ? 500 : 300;
    const defK = elType === 'reservoir' ? 0.8 : (elType === 'regenerator' ? 0.7 : 0.6);
    const temp = act.temperature !== undefined ? act.temperature : (item.temperature || defT);
    const cond = act.conductivity !== undefined ? act.conductivity : (item.conductivity !== undefined ? item.conductivity : (item.conductance || defK));
    const cap = act.heatCapacity !== undefined ? act.heatCapacity : (item.heatCapacity || (elType === 'regenerator' ? 400 : 300));
    const orient = act.orientation || item.orientation || 'horizontal';

    let extraInputs = '';
    if (elType === 'regenerator') {
      extraInputs = `
        <div class="field-row ${orient !== 'horizontal' ? 'is-modified' : ''}" data-def="horizontal">
          <div class="field-label"><span>Orientation</span><span class="seq-def-indicator">(def: Horizontal)</span></div>
          <div class="btn-toggle-group" id="${pfx}regenOrient">
            <button type="button" class="sub-toggle-btn ${orient === 'horizontal' ? 'active' : ''}" data-val="horizontal">Horizontal</button>
            <button type="button" class="sub-toggle-btn ${orient === 'vertical' ? 'active' : ''}" data-val="vertical">Vertical</button>
          </div>
        </div>
        ${this.makeDualInput('Heat Capacity C', `${pfx}thCap`, 50, 1500, 50, cap, 'J/K', 400)}
      `;
    } else if (elType === 'thermal_block') {
      extraInputs = this.makeDualInput('Heat Capacity C', `${pfx}thCap`, 50, 1500, 50, cap, 'J/K', 300);
    }

    return `
      <div class="field-row ${!isActive ? 'is-modified' : ''}" data-def="true">
        <div class="field-label"><span>Thermal State</span><span class="seq-def-indicator">(def: Active)</span></div>
        <select id="${pfx}thState" class="styled-select" style="width:100%;">
          <option value="true" ${isActive ? 'selected' : ''}>ACTIVE (Thermal Exchange)</option>
          <option value="false" ${!isActive ? 'selected' : ''}>INSULATED / INACTIVE</option>
        </select>
      </div>
      ${this.makeDualInput(elType === 'reservoir' ? 'Constant Temperature T' : 'Temperature T', `${pfx}thTemp`, 0, 1000, 25, temp, 'K', defT)}
      ${this.makeDualInput(elType === 'reservoir' ? 'Thermal Coupling κ' : 'Conductivity κ', `${pfx}thCond`, 0.05, 1.0, 0.05, cond, '', defK)}
      ${extraInputs}
    `;
  }

  static renderParticleHTML(item, act, elType, pfx = 'seqAct_') {
    if (elType === 'emitter') {
      const isFiring = act.state === 'firing' || (act.state === undefined && item.isActive !== false);
      const dir = act.direction || item.direction || 'right';
      const rate = act.rate !== undefined ? act.rate : (item.rate || 8);
      const temp = act.temperature !== undefined ? act.temperature : (item.temperature || 300);
      const mass = act.mass !== undefined ? act.mass : (item.mass || 1.0);
      const maxP = act.maxParticles !== undefined ? act.maxParticles : (item.maxParticles || 0);

      return `
        <div class="field-row ${!isFiring ? 'is-modified' : ''}" data-def="firing">
          <div class="field-label"><span>Emitter State</span><span class="seq-def-indicator">(def: Firing)</span></div>
          <select id="${pfx}emState" class="styled-select" style="width:100%;">
            <option value="firing" ${isFiring ? 'selected' : ''}>EMITTER IS FIRING</option>
            <option value="paused" ${!isFiring ? 'selected' : ''}>EMITTER IS PAUSED</option>
          </select>
        </div>
        ${this.makeDirection5(`${pfx}emDir`, dir, 'right')}
        ${this.makeDualInput('Rate', `${pfx}emRate`, 1, 50, 1, rate, '/s', 8)}
        ${this.makeDualInput('Temperature T', `${pfx}emTemp`, 20, 800, 20, temp, 'K', 300)}
        ${this.makeDualInput('Particle Mass m', `${pfx}emMass`, 0.2, 5.0, 0.2, mass, '', 1.0)}
        ${this.makeDualInput('Capacity Limit (0 = ∞)', `${pfx}emMax`, 0, 500, 25, maxP, '', 0)}
      `;
    }

    if (elType === 'sink') {
      const isActive = act.isActive !== undefined ? act.isActive : (item.isActive !== false);
      const dir = act.direction || item.direction || '360';
      const filterMode = act.tempFilterMode || item.tempFilterMode || 'all';
      const filterT = act.filterTemperature !== undefined ? act.filterTemperature : (item.filterTemperature || 300);
      const eff = act.absorptionEfficiency !== undefined ? Math.round(act.absorptionEfficiency * 100) : Math.round((item.absorptionEfficiency !== undefined ? item.absorptionEfficiency : 1.0) * 100);
      const maxP = act.maxParticles !== undefined ? act.maxParticles : (item.maxParticles || 0);

      return `
        <div class="field-row ${!isActive ? 'is-modified' : ''}" data-def="true">
          <div class="field-label"><span>Absorber State</span><span class="seq-def-indicator">(def: Active)</span></div>
          <select id="${pfx}snkState" class="styled-select" style="width:100%;">
            <option value="true" ${isActive ? 'selected' : ''}>ABSORBER IS ACTIVE</option>
            <option value="false" ${!isActive ? 'selected' : ''}>ABSORBER IS INACTIVE</option>
          </select>
        </div>
        ${this.makeDirection5(`${pfx}snkDir`, dir, '360')}
        <div class="field-row ${filterMode !== 'all' ? 'is-modified' : ''}" data-def="all">
          <div class="field-label"><span>Thermal Filter</span><span class="seq-def-indicator">(def: All)</span></div>
          <div class="btn-toggle-group" id="${pfx}snkFilterMode">
            <button type="button" class="sub-toggle-btn ${filterMode === 'all' ? 'active' : ''}" data-val="all">All</button>
            <button type="button" class="sub-toggle-btn ${filterMode === 'hot' ? 'active' : ''}" data-val="hot">Hot Only</button>
            <button type="button" class="sub-toggle-btn ${filterMode === 'cold' ? 'active' : ''}" data-val="cold">Cold Only</button>
          </div>
        </div>
        <div id="${pfx}snkFilterTRow" style="display:${filterMode !== 'all' ? 'block' : 'none'};">
          ${this.makeDualInput('Threshold Temp T', `${pfx}snkFilterT`, 50, 800, 25, filterT, 'K', 300)}
        </div>
        ${this.makeDualInput('Absorption Efficiency', `${pfx}snkEff`, 10, 100, 5, eff, '%', 100)}
        ${this.makeDualInput('Capacity Limit (0 = ∞)', `${pfx}snkMax`, 0, 500, 25, maxP, '', 0)}
      `;
    }

    // regulator
    const isActive = act.isActive !== undefined ? act.isActive : (item.isActive !== false);
    const tgt = act.targetCount !== undefined ? act.targetCount : (item.targetCount || 50);
    const hyst = act.hysteresis !== undefined ? act.hysteresis : (item.hysteresis || 3);
    const temp = act.temperature !== undefined ? act.temperature : (item.temperature || 300);
    const mass = act.mass !== undefined ? act.mass : (item.mass || 1.0);
    const rate = act.rate !== undefined ? act.rate : (item.rate || 15);

    return `
      <div class="field-row ${!isActive ? 'is-modified' : ''}" data-def="true">
        <div class="field-label"><span>Regulator State</span><span class="seq-def-indicator">(def: Active)</span></div>
        <select id="${pfx}regState" class="styled-select" style="width:100%;">
          <option value="true" ${isActive ? 'selected' : ''}>REGULATOR IS ACTIVE</option>
          <option value="false" ${!isActive ? 'selected' : ''}>REGULATOR IS INACTIVE</option>
        </select>
      </div>
      ${this.makeDualInput('Target Particle Count N', `${pfx}regTgt`, 5, 200, 5, tgt, '', 50)}
      ${this.makeDualInput('Hysteresis Band ΔN', `${pfx}regHyst`, 1, 15, 1, hyst, '', 3)}
      ${this.makeDualInput('Gas Temperature T', `${pfx}regTemp`, 20, 800, 20, temp, 'K', 300)}
      ${this.makeDualInput('Particle Mass m', `${pfx}regMass`, 0.2, 5.0, 0.2, mass, '', 1.0)}
      ${this.makeDualInput('Max Adjustment Rate', `${pfx}regRate`, 1, 50, 1, rate, '/s', 15)}
    `;
  }
}
