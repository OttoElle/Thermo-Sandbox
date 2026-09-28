// Ribbon tools, tool configurations and the floating tool properties dialog.
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
import { btnToolDialogClose, helpArrowIcon, toolDialogBadge, toolDialogHeader, toolDialogHelpPanel, toolDialogPanel, toolDialogTitle, toolPropertiesContainer } from './dom.js';
import { engine, renderer } from './core.js';
import { app, pointer, resetPolygonDraft } from './state.js';
import { attachDualInput, makeDualInput } from './fields.js';
import { updateElementsList } from './elementTree.js';
import { closeContextMenu } from './canvasInput.js';
import { closePopup } from './popup.js';

// Tool Configurations
export const toolConfigs = {
  wall: { shape: 'polygon', thickness: 4, conductivity: 0.0 },
  piston: { mass: 30, mode: 'free', springK: 50, frequency: 0.8, amplitude: 50, phase: 0, dampingCoeff: 25.0, conductivity: 0.2 },
  solid_res: { temperature: 500, conductance: 0.8 },
  heat_exchanger: { temperature: 300, conductivity: 0.6 },
  regenerator: { temperature: 300, heatCapacity: 400, conductivity: 0.7, orientation: 'horizontal', sliceCount: 10 },
  storage_block: { temperature: 300, heatCapacity: 300, conductivity: 0.6 },
  valve: { type: 'manual_valve', thickness: 4, conductivity: 0.0, allowedDirection: 1, triggerPressure: 250, pressureHysteresis: 25, reliefMode: 'oneway' },
  throttle_valve: { openRatio: 0.3, thickness: 6, conductivity: 0.0 },
  gas: { temperature: 300, mass: 1.0, count: 30, velocityMode: 'uniform_speed' },
  regulator: { temperature: 300, mass: 1.0, targetCount: 50, hysteresis: 3, rate: 15 },
  emitter: { direction: 'right', rate: 8, temperature: 300, mass: 1.0, maxParticles: 0 },
  sink: { direction: '360', tempFilterMode: 'all', filterTemperature: 300, maxParticles: 0, absorptionEfficiency: 1.0 },
  sensor: { label: 'Chamber', color: '#38bdf8' },
  text: { text: 'Note', fontSize: 14, color: '#94a3b8' }
};

// ============================================================================
// IPE Toolbar Ribbon & Dedicated Mode Tool Binding
// ============================================================================
export const ribbonToolBtns = document.querySelectorAll('.ribbon-tool-btn');

export function selectToolButton(btn) {
  ribbonToolBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const tool = btn.dataset.tool;
  app.activeTool = tool;

  if (tool === 'wall' && btn.dataset.wshape) {
    toolConfigs.wall.shape = btn.dataset.wshape;
  } else if (tool === 'piston' && btn.dataset.pmode) {
    toolConfigs.piston.mode = btn.dataset.pmode;
  } else if (tool === 'valve' && btn.dataset.vtype) {
    toolConfigs.valve.type = btn.dataset.vtype;
  }

  resetPolygonDraft();
  pointer.arcSteps = [];
  renderer.draftInfo = null;
  closePopup();
  closeContextMenu();
  renderToolProperties(tool);
}

ribbonToolBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (app.isSimulating) return;
    selectToolButton(btn);
  });
});

// ============================================================================
// Tool Explanations & Dedicated Active Tool Properties Inspector (CAD Style)
// ============================================================================
const toolHelpDescriptions = {
  wall: 'Defines rigid, thermally insulating or conductive walls to contain particles and direct flow.',
  piston: 'Movable piston with mass, damping, or motor drive for expansion, compression, and work extraction.',
  valve: 'Flow control valve (Manual, One-Way Check, or Pressure Relief) to regulate fluid flow between chambers.',
  throttle_valve: 'Continuous adjustable constriction (orifice) inducing localized pressure drops and expansion.',
  gas: 'Places a thermalized particle lattice with defined initial temperature, particle mass, and count.',
  regulator: 'Maintains target particle count in the zone automatically by injecting or extracting particles.',
  emitter: 'Continuous particle source generating directed flow at defined rate, temperature, and speed.',
  sink: 'Absorbs colliding particles to simulate a vacuum, exhaust port, or open atmosphere.',
  sensor: 'Measurement zone monitoring pressure, temperature, particle count, and net drift velocity.',
  solid_res: 'Constant-temperature thermal reservoir with infinite heat capacity acting as heat source or sink.',
  heat_exchanger: 'Permeable thermal body that exchanges heat directly with particles flowing through it.',
  regenerator: 'Thermal matrix developing a temperature gradient to reversibly store and release thermal energy.',
  storage_block: 'Solid thermal block with finite heat capacity exchanging heat via boundary conduction.',
  text: 'Creates text annotations to document experimental setups and label chambers on the canvas.'
};

function syncActiveToolWithSelection(tool, updateFn) {
  if (!app.selectedItems || app.selectedItems.length === 0) return;
  let hasModified = false;

  for (const item of app.selectedItems) {
    let matches = false;
    if (tool === 'wall') {
      matches = (item instanceof Wall) && (item.type === 'standard' || item.type === 'normal' || !item.type);
    } else if (tool === 'valve') {
      matches = (item instanceof Wall) && (item.type === 'manual_valve' || item.type === 'check_valve' || item.type === 'relief_valve');
    } else if (tool === 'throttle_valve') {
      matches = (item instanceof ThrottleValve);
    } else if (tool === 'piston') {
      matches = (item instanceof Piston);
    } else if (tool === 'solid_res') {
      matches = (item instanceof Reservoir);
    } else if (tool === 'heat_exchanger') {
      matches = (item instanceof HeatExchanger);
    } else if (tool === 'regenerator') {
      matches = (item instanceof RegeneratorMatrix);
    } else if (tool === 'storage_block') {
      matches = (item instanceof ThermalBlock);
    } else if (tool === 'emitter') {
      matches = (item instanceof Emitter);
    } else if (tool === 'sink') {
      matches = (item instanceof Sink);
    } else if (tool === 'sensor') {
      matches = (item instanceof SensorZone);
    } else if (tool === 'text') {
      matches = (item instanceof TextLabel);
    } else if (tool === 'regulator') {
      matches = (item instanceof Regulator);
    } else if (tool === 'gas') {
      matches = (item instanceof ParticleGroup);
    }

    if (matches) {
      updateFn(item);
      hasModified = true;
    }
  }

  if (hasModified) {
    updateElementsList();
  }
}

export function renderToolProperties(tool) {
  if (!toolPropertiesContainer) return;

  const toolNames = {
    select: 'Select',
    text: 'Text',
    wall: toolConfigs.wall.shape === 'polygon' ? 'Polyline' : (toolConfigs.wall.shape === 'rect' ? 'Rect' : (toolConfigs.wall.shape === 'circle' ? 'Circle' : 'Arc')),
    piston: toolConfigs.piston.mode === 'free' ? 'Displacer' : (toolConfigs.piston.mode === 'spring' ? 'Accumulator' : (toolConfigs.piston.mode === 'motorized' ? 'Compressor' : 'Expander')),
    solid_res: 'Sink',
    heat_exchanger: 'Heat Exchanger',
    regenerator: 'Regenerator',
    storage_block: 'Ressavoir',
    valve: toolConfigs.valve.type === 'manual_valve' ? 'Manual' : (toolConfigs.valve.type === 'check_valve' ? 'Check' : 'PRV'),
    throttle_valve: 'Throttle',
    gas: 'Spawner',
    regulator: 'Regulator',
    emitter: 'Emitter',
    sink: 'Absorber',
    sensor: 'Chamber'
  };

  const badgeNames = {
    select: 'TOOLS',
    text: 'TOOLS',
    wall: 'WALLS',
    gas: 'PARTICLES',
    emitter: 'PARTICLES',
    sink: 'PARTICLES',
    regulator: 'PARTICLES',
    solid_res: 'THERMAL',
    heat_exchanger: 'THERMAL',
    regenerator: 'THERMAL',
    storage_block: 'THERMAL',
    piston: 'PISTONS',
    valve: 'VALVES',
    throttle_valve: 'VALVES',
    sensor: 'SENSORS'
  };

  const titleText = toolNames[tool] || 'Tool';
  const badgeText = badgeNames[tool] || 'TOOL';
  if (toolDialogTitle) toolDialogTitle.textContent = titleText;
  if (toolDialogBadge) toolDialogBadge.textContent = badgeText;
  if (toolDialogHelpPanel) toolDialogHelpPanel.textContent = toolHelpDescriptions[tool] || '';

  // Always reset description to collapsed when switching tools
  isToolHelpOpen = false;
  if (toolDialogHelpPanel) toolDialogHelpPanel.style.display = 'none';
  if (helpArrowIcon) helpArrowIcon.textContent = '▾';

  if (app.isSimulating || tool === 'select') {
    if (toolDialogPanel) toolDialogPanel.style.display = 'none';
    toolPropertiesContainer.innerHTML = '';
    return;
  }

  if (toolDialogPanel) {
    toolDialogPanel.style.display = 'flex';
    toolDialogPanel.style.left = '350px';
    toolDialogPanel.style.top = '176px';
  }

  if (tool === 'text') {
    toolPropertiesContainer.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Default Text</span></div>
        <input type="text" id="propTextVal" value="${toolConfigs.text.text}" class="styled-select" style="width:100%;">
      </div>
      ${makeDualInput('Font Size', 'propTextSize', 10, 36, 1, toolConfigs.text.fontSize, 'px')}
    `;
    document.getElementById('propTextVal')?.addEventListener('input', (e) => {
      toolConfigs.text.text = e.target.value;
      syncActiveToolWithSelection('text', item => { item.text = e.target.value; });
    });
    attachDualInput('propTextSize', val => {
      toolConfigs.text.fontSize = Math.round(val);
      syncActiveToolWithSelection('text', item => { item.fontSize = Math.round(val); item.height = item.fontSize + 12; });
    });

  } else if (tool === 'wall') {
    toolPropertiesContainer.innerHTML = `
      ${makeDualInput('Thickness', 'propWThick', 2, 16, 1, toolConfigs.wall.thickness, 'px')}
      ${makeDualInput('Conductivity κ', 'propWCond', 0, 1, 0.05, toolConfigs.wall.conductivity)}
    `;
    attachDualInput('propWThick', val => {
      toolConfigs.wall.thickness = val;
      syncActiveToolWithSelection('wall', item => { item.thickness = val; });
    });
    attachDualInput('propWCond', val => {
      toolConfigs.wall.conductivity = val;
      syncActiveToolWithSelection('wall', item => { item.conductivity = val; });
    });

  } else if (tool === 'piston') {
    const pMode = toolConfigs.piston.mode;
    let modeInputs = '';
    if (pMode === 'spring') {
      modeInputs = makeDualInput('Spring Constant k', 'propPSpring', 10, 500, 10, toolConfigs.piston.springK, 'N/m');
    } else if (pMode === 'motorized') {
      modeInputs = `
        ${makeDualInput('Motor Frequency f', 'propPFreq', 0.1, 5.0, 0.1, toolConfigs.piston.frequency, 'Hz')}
        ${makeDualInput('Phase Offset φ', 'propPPhase', -180, 180, 15, toolConfigs.piston.phase || 0, '°')}
        <div class="stat-card" style="margin-top:4px;">
          <span class="stat-label">Stroke & Amplitude</span>
          <span class="stat-value" style="font-size:11px; color:#38bdf8;">Adjust directly via rail handles</span>
        </div>
      `;
    } else if (pMode === 'damper') {
      modeInputs = makeDualInput('Damping Load γ', 'propPDamp', 5, 150, 5, toolConfigs.piston.dampingCoeff || 25, 'Ns/m');
    }

    toolPropertiesContainer.innerHTML = `
      ${makeDualInput('Piston Mass m', 'propPMass', 0, 150, 5, toolConfigs.piston.mass)}
      ${makeDualInput('Conductivity κ', 'propPKappa', 0, 1, 0.05, toolConfigs.piston.conductivity)}
      ${modeInputs}
    `;
    attachDualInput('propPMass', val => {
      toolConfigs.piston.mass = val;
      syncActiveToolWithSelection('piston', item => { item.mass = val; });
    });
    attachDualInput('propPKappa', val => {
      toolConfigs.piston.conductivity = val;
      syncActiveToolWithSelection('piston', item => { item.conductivity = val; });
    });
    if (pMode === 'spring') attachDualInput('propPSpring', val => {
      toolConfigs.piston.springK = val;
      syncActiveToolWithSelection('piston', item => { item.springK = val; });
    });
    if (pMode === 'motorized') {
      attachDualInput('propPFreq', val => {
        toolConfigs.piston.frequency = val;
        syncActiveToolWithSelection('piston', item => { item.frequency = val; });
      });
      attachDualInput('propPPhase', val => {
        toolConfigs.piston.phase = val;
        syncActiveToolWithSelection('piston', item => { item.phase = val; });
      });
    }
    if (pMode === 'damper') attachDualInput('propPDamp', val => {
      toolConfigs.piston.dampingCoeff = val;
      syncActiveToolWithSelection('piston', item => { item.dampingCoeff = val; });
    });

  } else if (tool === 'solid_res') {
    toolPropertiesContainer.innerHTML = `
      ${makeDualInput('Constant Temperature T', 'propResT', 0, 1000, 25, toolConfigs.solid_res.temperature, 'K')}
      ${makeDualInput('Thermal Coupling κ', 'propResK', 0.05, 1.0, 0.05, toolConfigs.solid_res.conductance)}
    `;
    attachDualInput('propResT', val => {
      toolConfigs.solid_res.temperature = val;
      syncActiveToolWithSelection('solid_res', item => {
        item.temperature = val;
        item.label = `Isotherm (${Math.round(val)}K)`;
      });
    });
    attachDualInput('propResK', val => {
      toolConfigs.solid_res.conductance = val;
      syncActiveToolWithSelection('solid_res', item => { item.conductance = val; });
    });

  } else if (tool === 'heat_exchanger') {
    toolPropertiesContainer.innerHTML = `
      ${makeDualInput('Body Temperature T', 'propHxT', 0, 1000, 25, toolConfigs.heat_exchanger.temperature, 'K')}
      ${makeDualInput('Thermal Coupling κ', 'propHxK', 0.05, 1.0, 0.05, toolConfigs.heat_exchanger.conductivity)}
    `;
    attachDualInput('propHxT', val => {
      toolConfigs.heat_exchanger.temperature = val;
      syncActiveToolWithSelection('heat_exchanger', item => {
        item.temperature = val;
        item.label = `Heat Exchanger (${Math.round(val)}K)`;
      });
    });
    attachDualInput('propHxK', val => {
      toolConfigs.heat_exchanger.conductivity = val;
      syncActiveToolWithSelection('heat_exchanger', item => { item.conductivity = val; });
    });

  } else if (tool === 'regenerator') {
    toolPropertiesContainer.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Flow Axis</span></div>
        <div class="btn-toggle-group">
          <button class="sub-toggle-btn ${toolConfigs.regenerator.orientation === 'horizontal' ? 'active' : ''}" id="btnRegenHoriz">Horizontal</button>
          <button class="sub-toggle-btn ${toolConfigs.regenerator.orientation === 'vertical' ? 'active' : ''}" id="btnRegenVert">Vertical</button>
        </div>
      </div>
      ${makeDualInput('Base Temperature T', 'propRegenT', 0, 1000, 25, toolConfigs.regenerator.temperature, 'K')}
      ${makeDualInput('Total Heat Capacity C', 'propRegenC', 50, 1500, 50, toolConfigs.regenerator.heatCapacity, 'J/K')}
      ${makeDualInput('Thermal Coupling κ', 'propRegenK', 0.05, 1.0, 0.05, toolConfigs.regenerator.conductivity)}
    `;
    document.getElementById('btnRegenHoriz')?.addEventListener('click', () => {
      toolConfigs.regenerator.orientation = 'horizontal';
      renderToolProperties('regenerator');
      syncActiveToolWithSelection('regenerator', item => { item.orientation = 'horizontal'; });
    });
    document.getElementById('btnRegenVert')?.addEventListener('click', () => {
      toolConfigs.regenerator.orientation = 'vertical';
      renderToolProperties('regenerator');
      syncActiveToolWithSelection('regenerator', item => { item.orientation = 'vertical'; });
    });
    attachDualInput('propRegenT', val => {
      toolConfigs.regenerator.temperature = val;
      syncActiveToolWithSelection('regenerator', item => { item.temperature = val; });
    });
    attachDualInput('propRegenC', val => {
      toolConfigs.regenerator.heatCapacity = val;
      syncActiveToolWithSelection('regenerator', item => { item.heatCapacity = val; });
    });
    attachDualInput('propRegenK', val => {
      toolConfigs.regenerator.conductivity = val;
      syncActiveToolWithSelection('regenerator', item => { item.conductivity = val; });
    });

  } else if (tool === 'storage_block') {
    toolPropertiesContainer.innerHTML = `
      ${makeDualInput('Temperature T', 'propStoreT', 0, 1000, 25, toolConfigs.storage_block.temperature, 'K')}
      ${makeDualInput('Heat Capacity C', 'propStoreC', 50, 1500, 50, toolConfigs.storage_block.heatCapacity, 'J/K')}
      ${makeDualInput('Thermal Conductivity κ', 'propStoreK', 0.05, 1.0, 0.05, toolConfigs.storage_block.conductivity)}
    `;
    attachDualInput('propStoreT', val => {
      toolConfigs.storage_block.temperature = val;
      syncActiveToolWithSelection('storage_block', item => {
        item.temperature = val;
        item.label = `Ressavoir (${Math.round(val)}K)`;
      });
    });
    attachDualInput('propStoreC', val => {
      toolConfigs.storage_block.heatCapacity = val;
      syncActiveToolWithSelection('storage_block', item => { item.heatCapacity = val; });
    });
    attachDualInput('propStoreK', val => {
      toolConfigs.storage_block.conductivity = val;
      syncActiveToolWithSelection('storage_block', item => { item.conductivity = val; });
    });

  } else if (tool === 'valve') {
    const vType = toolConfigs.valve.type;
    let extraFields = '';
    if (vType === 'check_valve') {
      extraFields = `
        <div class="field-row">
          <button id="btnToolFlipCheckDir" class="btn-flip-dir" style="width:100%;">
            <span>Flip Flow Direction (${toolConfigs.valve.allowedDirection > 0 ? 'Forward →' : 'Reverse ←'})</span>
          </button>
        </div>
      `;
    } else if (vType === 'relief_valve') {
      extraFields = `
        ${makeDualInput('Trigger Pressure P_max', 'propVReliefP', 50, 1000, 25, toolConfigs.valve.triggerPressure, 'Pa')}
        ${makeDualInput('Hysteresis Band ΔP', 'propVReliefHyst', 0, 100, 5, toolConfigs.valve.pressureHysteresis !== undefined ? toolConfigs.valve.pressureHysteresis : 25, 'Pa')}
        <div class="field-row">
          <div class="field-label"><span>Relief Mode</span></div>
          <div class="btn-toggle-group">
            <button class="sub-toggle-btn ${toolConfigs.valve.reliefMode === 'oneway' ? 'active' : ''}" id="btnRelief1Way">1-Way</button>
            <button class="sub-toggle-btn ${toolConfigs.valve.reliefMode === 'bidirectional' ? 'active' : ''}" id="btnRelief2Way">2-Way</button>
          </div>
        </div>
      `;
    }
    toolPropertiesContainer.innerHTML = `
      ${extraFields}
      ${makeDualInput('Thickness', 'propVThick', 2, 16, 1, toolConfigs.valve.thickness || 4, 'px')}
      ${makeDualInput('Conductivity κ', 'propVKappa', 0, 1, 0.05, toolConfigs.valve.conductivity)}
    `;
    attachDualInput('propVThick', val => {
      toolConfigs.valve.thickness = val;
      syncActiveToolWithSelection('valve', item => { item.thickness = val; });
    });
    attachDualInput('propVKappa', val => {
      toolConfigs.valve.conductivity = val;
      syncActiveToolWithSelection('valve', item => { item.conductivity = val; });
    });
    if (vType === 'check_valve') {
      document.getElementById('btnToolFlipCheckDir')?.addEventListener('click', () => {
        toolConfigs.valve.allowedDirection = -toolConfigs.valve.allowedDirection;
        renderToolProperties('valve');
        syncActiveToolWithSelection('valve', item => { item.allowedDirection = toolConfigs.valve.allowedDirection; });
      });
    } else if (vType === 'relief_valve') {
      attachDualInput('propVReliefP', val => {
        toolConfigs.valve.triggerPressure = val;
        syncActiveToolWithSelection('valve', item => { item.triggerPressure = val; });
      });
      attachDualInput('propVReliefHyst', val => {
        toolConfigs.valve.pressureHysteresis = val;
        syncActiveToolWithSelection('valve', item => { item.pressureHysteresis = val; });
      });
      document.getElementById('btnRelief1Way')?.addEventListener('click', () => {
        toolConfigs.valve.reliefMode = 'oneway';
        renderToolProperties('valve');
        syncActiveToolWithSelection('valve', item => { item.reliefMode = 'oneway'; });
      });
      document.getElementById('btnRelief2Way')?.addEventListener('click', () => {
        toolConfigs.valve.reliefMode = 'bidirectional';
        renderToolProperties('valve');
        syncActiveToolWithSelection('valve', item => { item.reliefMode = 'bidirectional'; });
      });
    }

  } else if (tool === 'throttle_valve') {
    toolPropertiesContainer.innerHTML = `
      ${makeDualInput('Opening Ratio', 'propTVOpen', 0, 100, 5, Math.round(toolConfigs.throttle_valve.openRatio * 100), '%')}
      ${makeDualInput('Thickness', 'propTVThick', 2, 16, 1, toolConfigs.throttle_valve.thickness || 6, 'px')}
      ${makeDualInput('Conductivity κ', 'propTVCond', 0, 1, 0.05, toolConfigs.throttle_valve.conductivity || 0)}
    `;
    attachDualInput('propTVOpen', val => {
      toolConfigs.throttle_valve.openRatio = val / 100;
      syncActiveToolWithSelection('throttle_valve', item => { item.setOpenRatio(val / 100); });
    });
    attachDualInput('propTVThick', val => {
      toolConfigs.throttle_valve.thickness = val;
      syncActiveToolWithSelection('throttle_valve', item => {
        item.thickness = Math.round(val);
        item._updateGeometry();
      });
    });
    attachDualInput('propTVCond', val => {
      toolConfigs.throttle_valve.conductivity = val;
      syncActiveToolWithSelection('throttle_valve', item => { item.conductivity = val; });
    });

  } else if (tool === 'gas') {
    toolPropertiesContainer.innerHTML = `
      ${makeDualInput('Gas Temperature T', 'propGasT', 0, 1000, 25, toolConfigs.gas.temperature, 'K')}
      ${makeDualInput('Particle Mass m', 'propGasM', 0.2, 5.0, 0.2, toolConfigs.gas.mass)}
      ${makeDualInput('Spawner Particle Count', 'propGasCount', 5, 300, 5, toolConfigs.gas.count)}
    `;
    attachDualInput('propGasT', val => {
      toolConfigs.gas.temperature = val;
      syncActiveToolWithSelection('gas', item => { engine.setGroupTemperature(item, val); });
    });
    attachDualInput('propGasM', val => {
      toolConfigs.gas.mass = val;
      syncActiveToolWithSelection('gas', item => { engine.setGroupMass(item, val); });
    });
    attachDualInput('propGasCount', val => { toolConfigs.gas.count = Math.round(val); });

  } else if (tool === 'regulator') {
    toolPropertiesContainer.innerHTML = `
      ${makeDualInput('Gas Temperature T', 'propRegTemp', 0, 1000, 25, toolConfigs.regulator.temperature, 'K')}
      ${makeDualInput('Particle Mass m', 'propRegMass', 0.2, 5.0, 0.2, toolConfigs.regulator.mass)}
      ${makeDualInput('Target Particle Count N', 'propRegTarget', 5, 300, 5, toolConfigs.regulator.targetCount)}
      ${makeDualInput('Hysteresis Band ΔN', 'propRegHyst', 0, 20, 1, toolConfigs.regulator.hysteresis)}
      ${makeDualInput('Max Adjustment Rate', 'propRegRate', 1, 60, 1, toolConfigs.regulator.rate, '/s')}
    `;
    attachDualInput('propRegTemp', val => {
      toolConfigs.regulator.temperature = val;
      syncActiveToolWithSelection('regulator', item => { item.temperature = val; });
    });
    attachDualInput('propRegMass', val => {
      toolConfigs.regulator.mass = val;
      syncActiveToolWithSelection('regulator', item => { item.mass = val; });
    });
    attachDualInput('propRegTarget', val => {
      toolConfigs.regulator.targetCount = Math.round(val);
      syncActiveToolWithSelection('regulator', item => { item.targetCount = Math.round(val); });
    });
    attachDualInput('propRegHyst', val => {
      toolConfigs.regulator.hysteresis = Math.round(val);
      syncActiveToolWithSelection('regulator', item => { item.hysteresis = Math.round(val); });
    });
    attachDualInput('propRegRate', val => {
      toolConfigs.regulator.rate = val;
      syncActiveToolWithSelection('regulator', item => { item.rate = val; });
    });

  } else if (tool === 'emitter') {
    toolPropertiesContainer.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Direction</span></div>
        <div class="btn-toggle-group">
          <button class="sub-toggle-btn ${toolConfigs.emitter.direction === 'right' ? 'active' : ''}" data-dir="right" title="Right (0°)">→</button>
          <button class="sub-toggle-btn ${toolConfigs.emitter.direction === 'left' ? 'active' : ''}" data-dir="left" title="Left (180°)">←</button>
          <button class="sub-toggle-btn ${toolConfigs.emitter.direction === 'down' ? 'active' : ''}" data-dir="down" title="Down (90°)">↓</button>
          <button class="sub-toggle-btn ${toolConfigs.emitter.direction === 'up' ? 'active' : ''}" data-dir="up" title="Up (270°)">↑</button>
          <button class="sub-toggle-btn ${toolConfigs.emitter.direction === '360' || toolConfigs.emitter.direction === 'radial' ? 'active' : ''}" data-dir="360" title="Radial (360°)">360°</button>
        </div>
      </div>
      ${makeDualInput('Rate', 'propEmitRate', 1, 60, 1, toolConfigs.emitter.rate, '/s')}
      ${makeDualInput('Temperature T', 'propEmitT', 0, 1000, 25, toolConfigs.emitter.temperature, 'K')}
      ${makeDualInput('Particle Mass m', 'propEmitM', 0.2, 5.0, 0.2, toolConfigs.emitter.mass || 1.0)}
      ${makeDualInput('Max Count Limit (0 = ∞)', 'propEmitMax', 0, 500, 10, toolConfigs.emitter.maxParticles, '')}
    `;
    toolPropertiesContainer.querySelectorAll('[data-dir]').forEach(btn => {
      btn.addEventListener('click', () => {
        toolPropertiesContainer.querySelectorAll('[data-dir]').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        toolConfigs.emitter.direction = btn.dataset.dir;
        syncActiveToolWithSelection('emitter', item => { item.direction = btn.dataset.dir; });
      });
    });
    attachDualInput('propEmitRate', val => {
      toolConfigs.emitter.rate = Math.round(val);
      syncActiveToolWithSelection('emitter', item => { item.rate = Math.round(val); });
    });
    attachDualInput('propEmitT', val => {
      toolConfigs.emitter.temperature = val;
      syncActiveToolWithSelection('emitter', item => { item.temperature = val; });
    });
    attachDualInput('propEmitM', val => {
      toolConfigs.emitter.mass = val;
      syncActiveToolWithSelection('emitter', item => { item.mass = val; });
    });
    attachDualInput('propEmitMax', val => {
      toolConfigs.emitter.maxParticles = Math.round(val);
      syncActiveToolWithSelection('emitter', item => { item.maxParticles = Math.round(val); });
    });

  } else if (tool === 'sink') {
    toolPropertiesContainer.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Direction</span></div>
        <div class="btn-toggle-group">
          <button class="sub-toggle-btn ${toolConfigs.sink.direction === 'right' ? 'active' : ''}" data-sinkdir="right" title="Right (0°)">→</button>
          <button class="sub-toggle-btn ${toolConfigs.sink.direction === 'left' ? 'active' : ''}" data-sinkdir="left" title="Left (180°)">←</button>
          <button class="sub-toggle-btn ${toolConfigs.sink.direction === 'down' ? 'active' : ''}" data-sinkdir="down" title="Down (90°)">↓</button>
          <button class="sub-toggle-btn ${toolConfigs.sink.direction === 'up' ? 'active' : ''}" data-sinkdir="up" title="Up (270°)">↑</button>
          <button class="sub-toggle-btn ${toolConfigs.sink.direction === '360' ? 'active' : ''}" data-sinkdir="360" title="All (360°)">360°</button>
        </div>
      </div>
      <div class="field-row">
        <div class="field-label"><span>Filter by Temperature</span></div>
        <div class="btn-toggle-group">
          <button class="sub-toggle-btn ${toolConfigs.sink.tempFilterMode === 'all' ? 'active' : ''}" data-tfilter="all">All</button>
          <button class="sub-toggle-btn ${toolConfigs.sink.tempFilterMode === 'above' ? 'active' : ''}" data-tfilter="above">&gt; T</button>
          <button class="sub-toggle-btn ${toolConfigs.sink.tempFilterMode === 'below' ? 'active' : ''}" data-tfilter="below">&lt; T</button>
        </div>
      </div>
      ${toolConfigs.sink.tempFilterMode !== 'all' ? makeDualInput('Threshold Temperature T', 'propSinkT', 0, 1000, 25, toolConfigs.sink.filterTemperature || 300, 'K') : ''}
      ${makeDualInput('Max Absorb Limit (0 = ∞)', 'propSinkMax', 0, 500, 10, toolConfigs.sink.maxParticles || 0, '')}
      ${makeDualInput('Absorption Efficiency', 'propSinkEff', 0.1, 1.0, 0.05, toolConfigs.sink.absorptionEfficiency)}
    `;
    toolPropertiesContainer.querySelectorAll('[data-sinkdir]').forEach(btn => {
      btn.addEventListener('click', () => {
        toolPropertiesContainer.querySelectorAll('[data-sinkdir]').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        toolConfigs.sink.direction = btn.dataset.sinkdir;
        syncActiveToolWithSelection('sink', item => { item.direction = btn.dataset.sinkdir; });
      });
    });
    toolPropertiesContainer.querySelectorAll('[data-tfilter]').forEach(btn => {
      btn.addEventListener('click', () => {
        toolConfigs.sink.tempFilterMode = btn.dataset.tfilter;
        renderToolProperties('sink');
        syncActiveToolWithSelection('sink', item => { item.tempFilterMode = btn.dataset.tfilter; });
      });
    });
    if (toolConfigs.sink.tempFilterMode !== 'all') {
      attachDualInput('propSinkT', val => {
        toolConfigs.sink.filterTemperature = val;
        syncActiveToolWithSelection('sink', item => { item.filterTemperature = val; });
      });
    }
    attachDualInput('propSinkMax', val => {
      toolConfigs.sink.maxParticles = Math.round(val);
      syncActiveToolWithSelection('sink', item => { item.maxParticles = Math.round(val); });
    });
    attachDualInput('propSinkEff', val => {
      toolConfigs.sink.absorptionEfficiency = val;
      syncActiveToolWithSelection('sink', item => { item.absorptionEfficiency = val; });
    });

  } else if (tool === 'sensor') {
    toolPropertiesContainer.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Chamber Prefix</span></div>
        <input type="text" id="propSensName" value="${toolConfigs.sensor.label}" class="styled-select" style="width:100%;">
      </div>
      <div class="field-row">
        <div class="field-label"><span>Border & Chart Color</span></div>
        <input type="color" id="propSensColor" value="${toolConfigs.sensor.color || '#38bdf8'}" class="styled-select" style="width:54px; height:26px; padding:1px; cursor:pointer;">
      </div>
    `;
    document.getElementById('propSensName')?.addEventListener('input', (e) => {
      toolConfigs.sensor.label = e.target.value.trim() || 'Chamber';
      syncActiveToolWithSelection('sensor', item => { item.label = toolConfigs.sensor.label; });
    });
    document.getElementById('propSensColor')?.addEventListener('input', (e) => {
      toolConfigs.sensor.color = e.target.value;
      syncActiveToolWithSelection('sensor', item => { item.color = e.target.value; });
    });
  }
}

// ============================================================================
// Floating Tool Dialog (Onshape CAD Style) Controls
// ============================================================================
let isToolHelpOpen = false;
function toggleToolHelp(forceState) {
  if (!toolDialogHelpPanel || !helpArrowIcon) return;
  isToolHelpOpen = (typeof forceState === 'boolean') ? forceState : !isToolHelpOpen;
  toolDialogHelpPanel.style.display = isToolHelpOpen ? 'block' : 'none';
  helpArrowIcon.textContent = isToolHelpOpen ? '▴' : '▾';
}

btnToolDialogClose?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('toolSelect')?.click();
});

if (toolDialogHeader) {
  toolDialogHeader.style.cursor = 'pointer';
  toolDialogHeader.addEventListener('click', (e) => {
    if (e.target.closest?.('.tool-dialog-actions')) return;
    toggleToolHelp();
  });
}

// Backward Compatibility for selection inspector calls
function renderSelectedItemProperties(item) {
  updateElementsList();
}
function renderMultiSelectionProperties() {
  updateElementsList();
}
