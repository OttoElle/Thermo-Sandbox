import { Engine } from './physics/Engine.js';
import { Renderer } from './render/Renderer.js';
import { TempTimeChart } from './analytics/TempTimeChart.js';
import { VelHistChart } from './analytics/VelHistChart.js';
import { ChamberChart, DashboardChart } from './analytics/ChamberChart.js';
import { Vector2 } from './physics/Vector2.js';
import { Wall } from './physics/Wall.js';
import { Piston } from './physics/Piston.js';
import { Reservoir } from './physics/Reservoir.js';
import { SensorZone } from './physics/SensorZone.js';
import { Emitter } from './physics/Emitter.js';
import { Sink } from './physics/Sink.js';
import { ThermalBlock } from './physics/ThermalBlock.js';
import { HeatExchanger } from './physics/HeatExchanger.js';
import { RegeneratorMatrix } from './physics/RegeneratorMatrix.js';
import { TextLabel } from './physics/TextLabel.js';
import { ParticleGroup } from './physics/ParticleGroup.js';
import { Regulator } from './physics/Regulator.js';
import { ThrottleValve } from './physics/ThrottleValve.js';
import { Presets } from './presets/index.js';
import { SequencerUI } from './control/SequencerUI.js';

// Canvas DOM Elements
const canvas = document.getElementById('simCanvas');
const glCanvas = document.getElementById('glCanvas');
const tempChartCanvas = document.getElementById('tempChartCanvas');
const velChartCanvas = document.getElementById('velChartCanvas');

// Header & Navigation Elements
const btnToggleGrid = document.getElementById('btnToggleGrid');
const selectGridSize = document.getElementById('selectGridSize');
const btnToggleSnap = document.getElementById('btnToggleSnap');
const btnToggleVectors = document.getElementById('btnToggleVectors');
const btnToggleColor = document.getElementById('btnToggleColor');
const btnUndo = document.getElementById('btnUndo');
const btnRedo = document.getElementById('btnRedo');
const headerProjectTitle = document.getElementById('headerProjectTitle');
const fileImportInput = document.getElementById('fileImportInput');
const btnToolbarReset = document.getElementById('btnToolbarReset');
const btnToolbarClear = document.getElementById('btnToolbarClear');
const brandBadge = document.getElementById('brandBadge');
const brandTitle = document.getElementById('brandTitle');

// Splash Screen / Welcome Dashboard Elements
const splashOverlay = document.getElementById('splashOverlay');
const splashCard = document.getElementById('splashCard');
const btnSplashNew = document.getElementById('btnSplashNew');
const btnSplashOpen = document.getElementById('btnSplashOpen');
const btnSplashResume = document.getElementById('btnSplashResume');
const btnSplashClose = document.getElementById('btnSplashClose');
const splashRecentContainer = document.getElementById('splashRecentContainer');
const splashPresetsContainer = document.getElementById('splashPresetsContainer');
const btnClearRecent = document.getElementById('btnClearRecent');

// Transform Ribbon Elements
const btnRotate90 = document.getElementById('btnRotate90');
const btnFlipH = document.getElementById('btnFlipH');
const btnFlipV = document.getElementById('btnFlipV');
const btnGroupSelected = document.getElementById('btnGroupSelected');

// Save Modal Elements
const saveModal = document.getElementById('saveModal');
const saveProjectNameInput = document.getElementById('saveProjectNameInput');
const saveFilenamePreview = document.getElementById('saveFilenamePreview');
const btnSaveClose = document.getElementById('btnSaveClose');
const btnSaveCancel = document.getElementById('btnSaveCancel');
const btnSaveDownload = document.getElementById('btnSaveDownload');

// Custom Chart Dashboard Modal & Elements
const btnAddCustomChart = document.getElementById('btnAddCustomChart');
const chartModal = document.getElementById('chartModal');
const btnChartModalClose = document.getElementById('btnChartModalClose');
const btnChartCancel = document.getElementById('btnChartCancel');
const btnChartConfirm = document.getElementById('btnChartConfirm');
const selectChartTarget = document.getElementById('selectChartTarget');
const selectChartMetric = document.getElementById('selectChartMetric');
const customChartsContainer = document.getElementById('customChartsContainer');
const customCharts = [];

// Left Sidebar & Floating Tool Options Dialog (Onshape CAD Style)
const sidebarLeft = document.getElementById('sidebarLeft');
const toolDialogPanel = document.getElementById('toolDialogPanel');
const toolDialogHeader = document.getElementById('toolDialogHeader');
const toolDialogTitle = document.getElementById('toolDialogTitle');
const toolDialogBadge = document.getElementById('toolDialogBadge');
const btnToolDialogClose = document.getElementById('btnToolDialogClose');
const toolDialogTitleGroup = document.getElementById('toolDialogTitleGroup');
const helpArrowIcon = document.getElementById('helpArrowIcon');
const toolDialogHelpPanel = document.getElementById('toolDialogHelpPanel');
const toolPropertiesContainer = document.getElementById('toolPropertiesContainer');
const elementsListContainer = document.getElementById('elementsListContainer');
const elementCountBadge = document.getElementById('elementCountBadge');

// Context Popup & Menu
const elementPopup = document.getElementById('elementPopup');
const popupTitle = document.getElementById('popupTitle');
const popupBody = document.getElementById('popupBody');
const btnPopupClose = document.getElementById('btnPopupClose');

const contextMenu = document.getElementById('contextMenu');
const ctxDuplicate = document.getElementById('ctxDuplicate');
const ctxGroup = document.getElementById('ctxGroup');
const ctxBringFront = document.getElementById('ctxBringFront');
const ctxBringForward = document.getElementById('ctxBringForward');
const ctxSendBackward = document.getElementById('ctxSendBackward');
const ctxSendBack = document.getElementById('ctxSendBack');
const ctxDelete = document.getElementById('ctxDelete');

// Playback Bar & Model Toggle Controls
const modelToggleGroup = document.getElementById('modelToggleGroup');
const modelToggleBtns = modelToggleGroup ? modelToggleGroup.querySelectorAll('.model-toggle-btn') : [];
const btnToggleGravity = document.getElementById('btnToggleGravity');
const btnPlayPause = document.getElementById('btnPlayPause');
const playIcon = document.getElementById('playIcon');
const btnStep = document.getElementById('btnStep');
const btnStepBack = document.getElementById('btnStepBack');
const btnStopReset = document.getElementById('btnStopReset');
const speedSlider = document.getElementById('speedSlider');
const speedVal = document.getElementById('speedVal');
const timeVal = document.getElementById('timeVal');

// Zoom Controls
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnResetView = document.getElementById('btnResetView');
const zoomDisplay = document.getElementById('zoomDisplay');

// Stats & Chamber Analytics
const statN = document.getElementById('statN');
const statT = document.getElementById('statT');
const statE = document.getElementById('statE');
const statV = document.getElementById('statV');
const chamberCardsContainer = document.getElementById('chamberCardsContainer');
const tabTemp = document.getElementById('tabTemp');
const tabPV = document.getElementById('tabPV');

const infoModal = document.getElementById('infoModal');
const btnInfoClose = document.getElementById('btnInfoClose');

// Canvas Resizing
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (glCanvas) {
    glCanvas.width = window.innerWidth;
    glCanvas.height = window.innerHeight;
    if (window.renderer && window.renderer.glRenderer) {
      window.renderer.glRenderer.resize(window.innerWidth, window.innerHeight);
    }
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Master Physics Engine, Renderer & Analytics
const engine = new Engine(2500, 2500);
const renderer = new Renderer(canvas, glCanvas);
window.engine = engine;
window.renderer = renderer;
const tempChart = new TempTimeChart(tempChartCanvas);
const velChart = new VelHistChart(velChartCanvas);
const sequencerUI = new SequencerUI(engine);
window.sequencerUI = sequencerUI;

renderer.setViewport(canvas.width * 0.5 - 450, canvas.height * 0.5 - 300, 1.0);

// App Workflow State
let currentProjectName = 'Untitled Simulation';
let isSimulating = false;
let isSplashActive = true;
let isAmbientSim = true;
let hasActiveSession = false;
let activeTool = 'select';
let selectedItems = [];
let popupTargetItem = null;

// Undo & Redo Stacks for Edit Mode
const undoStack = [];
const redoStack = [];
const MAX_UNDO = 40;

function recordUndoState() {
  if (isSimulating) return;
  const snapshot = engine.exportState(currentProjectName);
  undoStack.push(JSON.stringify(snapshot));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
  updateElementsList();
}

function performUndo() {
  if (isSimulating || undoStack.length === 0) return;
  const current = engine.exportState(currentProjectName);
  redoStack.push(JSON.stringify(current));
  const prevJSON = undoStack.pop();
  engine.importState(JSON.parse(prevJSON));
  selectedItems = [];
  closePopup();
  closeContextMenu();
  updateElementsList();
  renderToolProperties(activeTool);
}

function performRedo() {
  if (isSimulating || redoStack.length === 0) return;
  const current = engine.exportState(currentProjectName);
  undoStack.push(JSON.stringify(current));
  const nextJSON = redoStack.pop();
  engine.importState(JSON.parse(nextJSON));
  selectedItems = [];
  closePopup();
  closeContextMenu();
  updateElementsList();
  renderToolProperties(activeTool);
}

btnUndo.addEventListener('click', performUndo);
btnRedo.addEventListener('click', performRedo);

// Playback History buffer for Step Back (⏮)
const historyBuffer = [];
const MAX_HISTORY = 120;

function pushHistoryFrame() {
  if (historyBuffer.length >= MAX_HISTORY) historyBuffer.shift();
  historyBuffer.push({
    time: engine.totalTime,
    particles: engine.particles.map(p => ({ x: p.pos.x, y: p.pos.y, vx: p.vel.x, vy: p.vel.y })),
    pistons: engine.pistons.map(p => ({ x: p.x, y: p.y, v: p.velocity, temp: p.temperature })),
    walls: engine.walls.map(w => ({ temp: w.temperature, isOpen: w.isOpen })),
    thermalBlocks: engine.thermalBlocks.map(b => ({ temp: b.temperature }))
  });
}

function popHistoryFrame() {
  if (historyBuffer.length === 0) {
    engine.restoreInitialSnapshot();
    return;
  }
  const frame = historyBuffer.pop();
  engine.totalTime = frame.time;
  for (let i = 0; i < Math.min(engine.particles.length, frame.particles.length); i++) {
    engine.particles[i].pos.set(frame.particles[i].x, frame.particles[i].y);
    engine.particles[i].vel.set(frame.particles[i].vx, frame.particles[i].vy);
  }
  for (let i = 0; i < Math.min(engine.pistons.length, frame.pistons.length); i++) {
    engine.pistons[i].x = frame.pistons[i].x;
    engine.pistons[i].y = frame.pistons[i].y;
    engine.pistons[i].velocity = frame.pistons[i].v;
    engine.pistons[i].temperature = frame.pistons[i].temp;
  }
  for (let i = 0; i < Math.min(engine.walls.length, frame.walls.length); i++) {
    engine.walls[i].temperature = frame.walls[i].temp;
    engine.walls[i].isOpen = frame.walls[i].isOpen;
  }
  for (let i = 0; i < Math.min(engine.thermalBlocks.length, frame.thermalBlocks.length); i++) {
    engine.thermalBlocks[i].temperature = frame.thermalBlocks[i].temp;
  }
}

// Mouse & Drag State
let isMouseDown = false;
let isPanning = false;
let panStartScreen = { x: 0, y: 0 };
let panStartCamera = { x: 0, y: 0 };
let dragStartWorld = null;
let currentCursorWorld = null;
let polygonPoints = [];
let polygonGroupId = null;
let polygonWalls = [];

function resetPolygonDraft() {
  polygonPoints = [];
  polygonGroupId = null;
  polygonWalls = [];
}
let arcSteps = [];
let draggingHandle = null;
let isMovingSelection = false;
let moveStartWorld = null;

// Open chamber cards in right sidebar
const openChamberCardIds = new Set();

// Grid Snapping
function snapToGrid(v) {
  if (!renderer.snapToGrid) return v;
  return Math.round(v / renderer.gridSize) * renderer.gridSize;
}

// Synchronized Dual Slider + Number Input Helpers
function makeDualInput(label, id, min, max, step, value, unit = '') {
  return `
    <div class="field-row">
      <div class="field-label"><span>${label}</span></div>
      <div class="dual-input-row">
        <input type="range" id="${id}_slider" min="${min}" max="${max}" step="${step}" value="${value}" class="styled-slider">
        <input type="number" id="${id}_num" min="${min}" max="${max}" step="${step}" value="${value}" class="dual-num-input">
        ${unit ? `<span style="font-size:10px; color:var(--text-dim);">${unit}</span>` : ''}
      </div>
    </div>
  `;
}

function attachDualInput(id, onChange) {
  const slider = document.getElementById(`${id}_slider`);
  const num = document.getElementById(`${id}_num`);
  if (!slider || !num) return;

  slider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    num.value = val;
    onChange(val);
  });

  num.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      slider.value = val;
      onChange(val);
    }
  });
}

// Tool Configurations
const toolConfigs = {
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
const ribbonToolBtns = document.querySelectorAll('.ribbon-tool-btn');

function selectToolButton(btn) {
  ribbonToolBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const tool = btn.dataset.tool;
  activeTool = tool;

  if (tool === 'wall' && btn.dataset.wshape) {
    toolConfigs.wall.shape = btn.dataset.wshape;
  } else if (tool === 'piston' && btn.dataset.pmode) {
    toolConfigs.piston.mode = btn.dataset.pmode;
  } else if (tool === 'valve' && btn.dataset.vtype) {
    toolConfigs.valve.type = btn.dataset.vtype;
  }

  resetPolygonDraft();
  arcSteps = [];
  renderer.draftInfo = null;
  closePopup();
  closeContextMenu();
  renderToolProperties(tool);
}

ribbonToolBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (isSimulating) return;
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
  if (!selectedItems || selectedItems.length === 0) return;
  let hasModified = false;

  for (const item of selectedItems) {
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

function renderToolProperties(tool) {
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

  if (isSimulating || tool === 'select') {
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

// ============================================================================
// Accordion Body Generator for Selected Items in Elements List
// ============================================================================
function renderItemAccordionBody(item, bodyContainer, itemIndex) {
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
    bodyContainer.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Chamber Name</span></div>
        <input type="text" id="${idPrefix}sensName" value="${item.label}" class="styled-select" style="width:100%;">
      </div>
      <div class="field-row">
        <div class="field-label"><span>Border & Chart Color</span></div>
        <input type="color" id="${idPrefix}sensColor" value="${item.color || '#38bdf8'}" class="styled-select" style="width:54px; height:26px; padding:1px; cursor:pointer;">
      </div>
      <div class="stat-card" style="margin-top:6px;">
        <span class="stat-label">Net Drift Trend ⟨v_drift⟩</span>
        <span class="stat-value" style="font-size:12px; color:#22c55e;">${driftText}</span>
      </div>
    `;
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
      selectedItems = [...pts];
      updateElementsList();
    });
    document.getElementById(`${idPrefix}delGroupBtn`)?.addEventListener('click', () => {
      recordUndoState();
      engine.deleteParticleGroup(item);
      selectedItems = [];
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
      selectedItems = [];
      updateElementsList();
    });
  }
}

// ============================================================================
// Interactive Canvas Elements Outline List
// ============================================================================
function getElementInfo(item, index) {
  if (item instanceof Wall) {
    const vLabel = item.type === 'manual_valve' ? `Valve ${index + 1}` : (item.type === 'check_valve' ? `Check Valve ${index + 1}` : (item.type === 'relief_valve' ? `PRV Valve ${index + 1}` : `Wall ${index + 1} (${item.conductivity > 0 ? 'Conductive' : 'Insulated'})`));
    return { tag: 'WALL', label: vLabel };
  } else if (item instanceof ThrottleValve) {
    return { tag: 'THROTTLE', label: `Throttle Valve ${index + 1} [${Math.round(item.openRatio * 100)}%]` };
  } else if (item instanceof Piston) {
    const modeLabels = { free: 'displacer', spring: 'accumulator', motorized: 'compressor', damper: 'expander' };
    const mLabel = modeLabels[item.mode] || item.mode;
    return { tag: 'PISTON', label: `Piston ${index + 1} (${mLabel})` };
  } else if (item instanceof Reservoir) {
    return { tag: 'SINK', label: `Sink [${Math.round(item.temperature)}K]` };
  } else if (item instanceof HeatExchanger) {
    return { tag: 'HX', label: `Heat Exchanger [${Math.round(item.temperature)}K]` };
  } else if (item instanceof RegeneratorMatrix) {
    const minT = Math.round(Math.min(...item.temperatures));
    const maxT = Math.round(Math.max(...item.temperatures));
    return { tag: 'REGEN', label: `Regenerator [${minT}-${maxT}K]` };
  } else if (item instanceof ThermalBlock) {
    return { tag: 'RESSAVOIR', label: `Ressavoir [${Math.round(item.temperature)}K]` };
  } else if (item instanceof SensorZone) {
    return { tag: 'SENSOR', label: item.label };
  } else if (item instanceof Emitter) {
    return { tag: 'SOURCE', label: `Emitter (${item.rate}/s)` };
  } else if (item instanceof Sink) {
    return { tag: 'ABSORBER', label: 'Absorber' };
  } else if (item instanceof Regulator) {
    return { tag: 'REGULATOR', label: `Regulator [${item.currentCount || 0}/${item.targetCount} pts]` };
  } else if (item instanceof TextLabel) {
    return { tag: 'NOTE', label: `"${item.text}"` };
  } else if (item instanceof ParticleGroup) {
    const activeCount = item.getActiveCount(engine);
    const avgT = Math.round(item.getAverageTemperature(engine));
    return { tag: 'SPAWNER', label: `${item.label} [${activeCount} pts, ${avgT}K]` };
  }
  return { tag: 'ITEM', label: `Element ${index + 1}` };
}

// ============================================================================
// CAD Feature Tree & Accordion Group Management
// ============================================================================
const treeExpandedGroups = new Set();

function updateElementCardLabel(itemIndex, newLabel) {
  const card = document.querySelector(`[data-elindex="${itemIndex}"]`);
  if (!card) return;
  const labelSpan = card.querySelector('.element-label-text');
  if (labelSpan) labelSpan.textContent = newLabel;
}

function renderGroupAccordionBody(group, bodyContainer) {
  if (!bodyContainer || !group) return;
  const isAllWalls = group.items.every(i => i instanceof Wall);
  const idPrefix = `grp_${group.id}_`;

  if (isAllWalls) {
    const firstWall = group.items[0];
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:6px;">
        <span style="font-size:10px; color:#38bdf8; font-weight:600;">Batch Group Settings (${group.items.length} Segments)</span>
      </div>
      ${makeDualInput('Conductivity κ', `${idPrefix}wKappa`, 0, 1, 0.05, firstWall.conductivity)}
      ${makeDualInput('Thickness', `${idPrefix}wThick`, 2, 16, 1, firstWall.thickness, 'px')}
      <div class="field-row" style="margin-top:6px;">
        <button id="${idPrefix}ungroupBtn" class="sub-toggle-btn" style="width:100%; justify-content:center; padding:5px 0;">Ungroup Segments</button>
      </div>
    `;
    attachDualInput(`${idPrefix}wKappa`, val => {
      group.items.forEach(w => { w.conductivity = val; });
    });
    attachDualInput(`${idPrefix}wThick`, val => {
      group.items.forEach(w => { w.thickness = val; });
    });
    document.getElementById(`${idPrefix}ungroupBtn`)?.addEventListener('click', () => {
      recordUndoState();
      group.items.forEach(w => { delete w.groupId; });
      updateElementsList();
    });
  } else {
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:6px;">
        <span style="font-size:10px; color:#38bdf8; font-weight:600;">Group Settings (${group.items.length} Elements)</span>
      </div>
      <div class="field-row" style="margin-top:6px;">
        <button id="${idPrefix}ungroupBtn" class="sub-toggle-btn" style="width:100%; justify-content:center; padding:5px 0;">Ungroup Elements</button>
      </div>
    `;
    document.getElementById(`${idPrefix}ungroupBtn`)?.addEventListener('click', () => {
      recordUndoState();
      group.items.forEach(i => { delete i.groupId; });
      updateElementsList();
    });
  }
}

function updateElementsList() {
  if (!elementsListContainer) return;
  const elements = engine.elements || [];

  elementCountBadge.textContent = elements.length;

  if (elements.length === 0) {
    elementsListContainer.innerHTML = '<p class="empty-cell" style="padding:8px 0;">No elements on canvas</p>';
    return;
  }

  // Group elements for Feature Tree: standalone items vs group clusters
  const treeEntries = [];
  const groupMap = new Map();

  elements.forEach((item, index) => {
    if (item.groupId) {
      if (!groupMap.has(item.groupId)) {
        const grp = {
          type: 'group',
          groupId: item.groupId,
          items: []
        };
        groupMap.set(item.groupId, grp);
        treeEntries.push(grp);
      }
      groupMap.get(item.groupId).items.push({ item, index });
    } else {
      treeEntries.push({ type: 'single', item, index });
    }
  });

  let html = '';
  treeEntries.forEach(entry => {
    if (entry.type === 'single') {
      const { item, index } = entry;
      const info = getElementInfo(item, index);
      const isSel = selectedItems.includes(item);
      html += `
        <div class="element-item-card ${isSel ? 'selected' : ''}" data-elindex="${index}">
          <div class="element-item-header" draggable="true">
            <div class="element-item-info">
              <span class="element-drag-handle" title="Drag to reorder layer">::</span>
              <span style="font-size:8px; color:var(--text-dim);">${isSel ? '▾' : '▸'}</span>
              <span class="element-item-tag" style="font-size:9px; font-weight:700; color:var(--accent); background:rgba(56,189,248,0.1); padding:1px 4px; border-radius:3px;">${info.tag}</span>
              <span class="element-label-text">${info.label}</span>
            </div>
            <div class="element-item-actions">
              <button class="element-item-btn element-item-del" data-delindex="${index}" title="Delete Element">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          ${isSel ? `<div class="element-accordion-body" id="accBody_${index}" draggable="false"></div>` : ''}
        </div>
      `;
    } else {
      const { groupId, items } = entry;
      const groupItemsList = items.map(x => x.item);
      const isGroupSelected = groupItemsList.length > 0 && groupItemsList.every(i => selectedItems.includes(i));
      const isExpanded = treeExpandedGroups.has(groupId);

      let groupTag = 'GROUP';
      let groupLabel = `Group (${items.length} items)`;
      if (groupId.startsWith('g_circle_')) {
        groupTag = 'CIRCLE';
        groupLabel = `Circle Wall (${items.length} segments)`;
      } else if (groupId.startsWith('g_arc_')) {
        groupTag = 'ARC';
        groupLabel = `Arc Wall (${items.length} segments)`;
      } else if (groupId.startsWith('g_rect_')) {
        groupTag = 'RECT';
        groupLabel = `Rectangle Wall (${items.length} segments)`;
      } else if (groupId.startsWith('g_poly_')) {
        groupTag = 'POLYGON';
        groupLabel = `Polygon Wall (${items.length} segments)`;
      }

      let childrenHtml = '';
      if (isExpanded) {
        childrenHtml = `
          <div class="tree-children-container">
            ${items.map(({ item: child, index: childIdx }, sIdx) => {
              const isChildSel = selectedItems.includes(child);
              return `
                <div class="tree-child-item ${isChildSel ? 'selected' : ''}" data-childindex="${childIdx}" title="Click to inspect segment">
                  <span>↳ Segment #${sIdx + 1}</span>
                  <span style="font-size:8.5px; opacity:0.6;">#${childIdx + 1}</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      html += `
        <div class="element-item-card tree-group-card ${isGroupSelected ? 'selected' : ''}" data-groupid="${groupId}">
          <div class="element-item-header tree-group-header">
            <div class="element-item-info">
              <span class="tree-toggle-arrow" data-togglegroup="${groupId}" title="Toggle Feature Tree">${isExpanded ? '▼' : '▶'}</span>
              <span class="element-item-tag" style="font-size:9px; font-weight:700; color:#38bdf8; background:rgba(56,189,248,0.15); padding:1px 4px; border-radius:3px;">${groupTag}</span>
              <span class="element-label-text" style="font-weight:600;">${groupLabel}</span>
            </div>
            <div class="element-item-actions">
              <button class="element-item-btn element-group-del" data-delgroup="${groupId}" title="Delete Entire Group">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          ${isGroupSelected ? `<div class="element-accordion-body" id="groupAccBody_${groupId}" draggable="false"></div>` : ''}
          ${childrenHtml}
        </div>
      `;
    }
  });

  elementsListContainer.innerHTML = html;

  // Render accordion bodies
  treeEntries.forEach(entry => {
    if (entry.type === 'single') {
      const { item, index } = entry;
      if (selectedItems.includes(item)) {
        const body = document.getElementById(`accBody_${index}`);
        if (body) {
          renderItemAccordionBody(item, body, index);
        }
      }
    } else {
      const { groupId, items } = entry;
      const groupItemsList = items.map(x => x.item);
      const isGroupSelected = groupItemsList.length > 0 && groupItemsList.every(i => selectedItems.includes(i));
      if (isGroupSelected) {
        const body = document.getElementById(`groupAccBody_${groupId}`);
        if (body) {
          renderGroupAccordionBody({ id: groupId, items: groupItemsList }, body);
        }
      }
    }
  });

  // Feature Tree toggle arrow click
  elementsListContainer.querySelectorAll('.tree-toggle-arrow').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gid = btn.dataset.togglegroup;
      if (treeExpandedGroups.has(gid)) treeExpandedGroups.delete(gid);
      else treeExpandedGroups.add(gid);
      updateElementsList();
    });
  });

  // Group Header click: select/deselect all in group
  elementsListContainer.querySelectorAll('.tree-group-header').forEach(hdr => {
    hdr.addEventListener('click', (e) => {
      if (e.target.closest('.element-item-actions') || e.target.closest('.tree-toggle-arrow')) return;
      const card = hdr.closest('.tree-group-card');
      const gid = card.dataset.groupid;
      const grp = groupMap.get(gid);
      if (grp) {
        const groupItemsList = grp.items.map(x => x.item);
        const isAllSelected = groupItemsList.length > 0 && groupItemsList.every(i => selectedItems.includes(i));
        if (isAllSelected && selectedItems.length === groupItemsList.length) {
          selectedItems = [];
        } else {
          selectedItems = [...groupItemsList];
        }
        updateElementsList();
      }
    });
  });

  // Group Delete button
  elementsListContainer.querySelectorAll('.element-group-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gid = btn.dataset.delgroup;
      const grp = groupMap.get(gid);
      if (grp) {
        selectedItems = grp.items.map(x => x.item);
        deleteSelectedItems();
      }
    });
  });

  // Child item click in Feature Tree
  elementsListContainer.querySelectorAll('.tree-child-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const childIdx = parseInt(el.dataset.childindex, 10);
      const childItem = elements[childIdx];
      if (childItem) {
        selectedItems = [childItem];
        updateElementsList();
      }
    });
  });

  // Drag and Drop Layer Reordering (Single item cards)
  let draggedCardIdx = null;
  let hasDragged = false;
  const cards = elementsListContainer.querySelectorAll('.element-item-card[data-elindex]');

  cards.forEach(card => {
    const header = card.querySelector('.element-item-header');
    if (header) {
      header.addEventListener('dragstart', (e) => {
        if (e.target.closest('.element-item-del') || e.target.closest('button')) {
          e.preventDefault();
          return;
        }
        hasDragged = true;
        draggedCardIdx = parseInt(card.dataset.elindex, 10);
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(draggedCardIdx));
      });

      header.addEventListener('dragend', () => {
        cards.forEach(c => {
          c.classList.remove('dragging');
          c.classList.remove('drag-over');
        });
        draggedCardIdx = null;
        setTimeout(() => { hasDragged = false; }, 50);
      });
    }

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const targetIdx = parseInt(card.dataset.elindex, 10);
      if (draggedCardIdx !== null && draggedCardIdx !== targetIdx && !isNaN(targetIdx)) {
        recordUndoState();
        engine.reorderElements(draggedCardIdx, targetIdx);
        updateElementsList();
      }
    });
  });

  // Single card header click: select / accordion toggle
  elementsListContainer.querySelectorAll('.element-item-card[data-elindex] > .element-item-header').forEach(hdr => {
    hdr.addEventListener('click', (e) => {
      if (hasDragged || e.target.closest('.element-item-actions')) return;
      const card = hdr.closest('.element-item-card');
      const idx = parseInt(card.dataset.elindex, 10);
      const item = elements[idx];
      if (item) {
        if (selectedItems.includes(item) && selectedItems.length === 1) {
          selectedItems = [];
        } else {
          selectedItems = item.groupId ? getAllGroupItems(item) : [item];
        }
        updateElementsList();
      }
    });
  });

  // Single card delete button
  elementsListContainer.querySelectorAll('.element-item-card[data-elindex] .element-item-del').forEach(delBtn => {
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(delBtn.dataset.delindex, 10);
      const item = elements[idx];
      if (item) {
        selectedItems = [item];
        deleteSelectedItems();
      }
    });
  });
}

// ============================================================================
// Desktop Menu Bar Logic (File, Edit, View, Help)
// ============================================================================
const menuItems = document.querySelectorAll('.menu-item');
let isAnyMenuOpen = false;

function closeAllMenus() {
  menuItems.forEach(item => item.classList.remove('open'));
  isAnyMenuOpen = false;
}

menuItems.forEach(item => {
  const btn = item.querySelector('.menu-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = item.classList.contains('open');
    closeAllMenus();
    if (!isOpen) {
      item.classList.add('open');
      isAnyMenuOpen = true;
    }
  });

  item.addEventListener('mouseenter', () => {
    if (isAnyMenuOpen) {
      closeAllMenus();
      item.classList.add('open');
      isAnyMenuOpen = true;
    }
  });
});

window.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-item')) {
    closeAllMenus();
  }
});

// File Menu Actions
document.getElementById('menuEntryImport').addEventListener('click', () => {
  closeAllMenus();
  fileImportInput.click();
});

document.getElementById('menuEntrySaveAs').addEventListener('click', () => {
  closeAllMenus();
  openSaveModal();
});

function stopAndResetSimulationForNewScene() {
  isSimulating = false;
  engine.isPaused = true;
  isAmbientSim = false;
  
  document.querySelector('.ribbon-row-construction')?.classList.remove('simulating-locked');
  document.getElementById('btnToolbarClear')?.removeAttribute('disabled');
  
  playIcon.classList.add('is-play');
  playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';
  
  engine.totalTime = 0;
  timeVal.textContent = '0.00 s';
  historyBuffer.length = 0;
  undoStack.length = 0;
  redoStack.length = 0;
  selectedItems = [];
  resetPolygonDraft();
  arcSteps = [];
  closePopup();
  closeContextMenu();
}

function resetToLoadedProfile() {
  isSimulating = false;
  engine.isPaused = true;
  document.querySelector('.ribbon-row-construction')?.classList.remove('simulating-locked');
  document.getElementById('btnToolbarClear')?.removeAttribute('disabled');
  
  engine.resetToLoadedProfile();
  
  if (engine.currentProfileName) {
    currentProjectName = engine.currentProfileName;
    headerProjectTitle.textContent = `${currentProjectName}.json`;
  }
  
  selectedItems = [];
  resetPolygonDraft();
  arcSteps = [];
  historyBuffer.length = 0;
  undoStack.length = 0;
  redoStack.length = 0;
  
  playIcon.classList.add('is-play');
  playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';
  
  closePopup();
  closeContextMenu();
  updateElementsList();
  renderToolProperties(activeTool);
  updateModelToggleUI();
  updateGravityUI();
  timeVal.textContent = '0.00 s';
}

document.getElementById('menuEntryReset').addEventListener('click', () => {
  closeAllMenus();
  resetToLoadedProfile();
});

document.getElementById('menuEntryClear').addEventListener('click', () => {
  closeAllMenus();
  recordUndoState();
  engine.clear();
  resetPolygonDraft();
  arcSteps = [];
  selectedItems = [];
  historyBuffer.length = 0;
  closePopup();
  closeContextMenu();
  updateElementsList();
  renderToolProperties(activeTool);
});

btnToolbarReset.addEventListener('click', resetToLoadedProfile);

btnToolbarClear.addEventListener('click', () => {
  document.getElementById('menuEntryClear').click();
});

// Edit Menu Actions
document.getElementById('menuEntryUndo').addEventListener('click', () => {
  closeAllMenus();
  performUndo();
});

document.getElementById('menuEntryRedo').addEventListener('click', () => {
  closeAllMenus();
  performRedo();
});

document.getElementById('menuEntryDuplicate').addEventListener('click', () => {
  closeAllMenus();
  ctxDuplicate.click();
});

document.getElementById('menuEntryGroup').addEventListener('click', () => {
  closeAllMenus();
  ctxGroup.click();
});

document.getElementById('menuEntryDelete').addEventListener('click', () => {
  closeAllMenus();
  deleteSelectedItems();
});

// View Menu Actions
function updateViewMenuLabels() {
  document.getElementById('labelMenuGrid').textContent = renderer.showGrid ? '✓ Show Grid' : 'Show Grid';
  document.getElementById('labelGrid10').textContent = renderer.gridSize === 10 ? '✓ Grid Size: 10 px' : 'Grid Size: 10 px';
  document.getElementById('labelGrid20').textContent = renderer.gridSize === 20 ? '✓ Grid Size: 20 px' : 'Grid Size: 20 px';
  document.getElementById('labelGrid40').textContent = renderer.gridSize === 40 ? '✓ Grid Size: 40 px' : 'Grid Size: 40 px';
  document.getElementById('labelMenuSnap').textContent = renderer.snapToGrid ? '✓ Snap to Grid' : 'Snap to Grid';
  document.getElementById('labelMenuVectors').textContent = renderer.showVectors ? '✓ Velocity Vectors (v⃗)' : 'Velocity Vectors (v⃗)';
  const labelColor = document.getElementById('labelMenuColor');
  if (labelColor) labelColor.textContent = renderer.colorByVelocity ? '✓ Color by Speed (|v|)' : 'Color by Speed (|v|)';

  btnToggleGrid.classList.toggle('active', renderer.showGrid);
  btnToggleSnap.classList.toggle('active', renderer.snapToGrid);
  btnToggleVectors.classList.toggle('active', renderer.showVectors);
  if (btnToggleColor) btnToggleColor.classList.toggle('active', renderer.colorByVelocity);

  const floatingVelLegend = document.getElementById('floatingVelLegend');
  if (floatingVelLegend) {
    floatingVelLegend.style.display = renderer.colorByVelocity ? 'flex' : 'none';
  }
}

document.getElementById('menuEntryToggleGrid').addEventListener('click', () => {
  renderer.showGrid = !renderer.showGrid;
  updateViewMenuLabels();
  closeAllMenus();
});

btnToggleGrid.addEventListener('click', () => {
  renderer.showGrid = !renderer.showGrid;
  updateViewMenuLabels();
});

selectGridSize.addEventListener('change', (e) => {
  renderer.gridSize = parseInt(e.target.value, 10);
  updateViewMenuLabels();
});

document.getElementById('menuEntryGrid10').addEventListener('click', () => {
  renderer.gridSize = 10;
  selectGridSize.value = "10";
  updateViewMenuLabels();
  closeAllMenus();
});

document.getElementById('menuEntryGrid20').addEventListener('click', () => {
  renderer.gridSize = 20;
  selectGridSize.value = "20";
  updateViewMenuLabels();
  closeAllMenus();
});

document.getElementById('menuEntryGrid40').addEventListener('click', () => {
  renderer.gridSize = 40;
  selectGridSize.value = "40";
  updateViewMenuLabels();
  closeAllMenus();
});

document.getElementById('menuEntryToggleSnap').addEventListener('click', () => {
  renderer.snapToGrid = !renderer.snapToGrid;
  updateViewMenuLabels();
  closeAllMenus();
});

btnToggleSnap.addEventListener('click', () => {
  renderer.snapToGrid = !renderer.snapToGrid;
  updateViewMenuLabels();
});

document.getElementById('menuEntryToggleVectors').addEventListener('click', () => {
  renderer.showVectors = !renderer.showVectors;
  updateViewMenuLabels();
  closeAllMenus();
});

btnToggleVectors.addEventListener('click', () => {
  renderer.showVectors = !renderer.showVectors;
  updateViewMenuLabels();
});

document.getElementById('menuEntryToggleColor')?.addEventListener('click', () => {
  renderer.colorByVelocity = !renderer.colorByVelocity;
  updateViewMenuLabels();
  closeAllMenus();
});

btnToggleColor?.addEventListener('click', () => {
  renderer.colorByVelocity = !renderer.colorByVelocity;
  updateViewMenuLabels();
});

document.getElementById('menuEntryResetView').addEventListener('click', () => {
  renderer.setViewport(canvas.width * 0.5 - 450, canvas.height * 0.5 - 300, 1.0);
  updateZoomText();
  closeAllMenus();
});

// Help Menu
document.getElementById('menuEntryGuide').addEventListener('click', () => {
  infoModal.style.display = 'flex';
  closeAllMenus();
});

// ============================================================================
// Save Project As Dialog Workflow
// ============================================================================
function updateSaveFilePreview() {
  const name = saveProjectNameInput.value.trim() || 'Project';
  const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  saveFilenamePreview.textContent = `${cleanName}.json`;
}

function openSaveModal() {
  saveProjectNameInput.value = currentProjectName;
  updateSaveFilePreview();
  saveModal.style.display = 'flex';
  setTimeout(() => saveProjectNameInput.select(), 50);
}

function closeSaveModal() {
  saveModal.style.display = 'none';
}

saveProjectNameInput.addEventListener('input', updateSaveFilePreview);
btnSaveClose.addEventListener('click', closeSaveModal);
btnSaveCancel.addEventListener('click', closeSaveModal);
window.addEventListener('click', (e) => { if (e.target === saveModal) closeSaveModal(); });

btnSaveDownload.addEventListener('click', () => {
  const chosenName = saveProjectNameInput.value.trim() || 'Project';
  currentProjectName = chosenName;
  headerProjectTitle.textContent = `${chosenName}.json`;

  const state = engine.exportState(chosenName);
  addRecentProfile(chosenName, state);
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${chosenName.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  closeSaveModal();
});

fileImportInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      stopAndResetSimulationForNewScene();
      const data = JSON.parse(evt.target.result);
      if (data.profileName) {
        currentProjectName = data.profileName;
      } else {
        currentProjectName = file.name.replace(/\.json$/i, '');
        data.profileName = currentProjectName;
      }
      headerProjectTitle.textContent = `${currentProjectName}.json`;
      engine.setLoadedProfile(data);
      updateElementsList();
      renderToolProperties(activeTool);
      updateModelToggleUI();
      updateGravityUI();
      addRecentProfile(currentProjectName, data);
      hasActiveSession = true;
      hideSplashScreen();
    } catch (err) {
      alert('Invalid JSON configuration file.');
    }
  };
  reader.readAsText(file);
  fileImportInput.value = '';
});

// ============================================================================
// Playback Controls & Physics Model Toggle
// ============================================================================
modelToggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modelToggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    engine.simModel = btn.dataset.model;
  });
});

function updateModelToggleUI() {
  modelToggleBtns.forEach(btn => {
    if (btn.dataset.model === (engine.simModel || 'hard_sphere')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function updateGravityUI() {
  if (!btnToggleGravity) return;
  if (engine.gravityEnabled) {
    btnToggleGravity.classList.add('active');
  } else {
    btnToggleGravity.classList.remove('active');
  }
}

btnToggleGravity?.addEventListener('click', () => {
  engine.gravityEnabled = !engine.gravityEnabled;
  updateGravityUI();
});

btnPlayPause.addEventListener('click', () => {
  if (!isSimulating) {
    engine.saveSimStartSnapshot();
    isSimulating = true;
    document.querySelector('.ribbon-row-construction')?.classList.add('simulating-locked');
    document.getElementById('btnToolbarClear')?.setAttribute('disabled', 'true');
    activeTool = 'select';
    ribbonToolBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('toolSelect')?.classList.add('active');
    if (toolDialogPanel) toolDialogPanel.style.display = 'none';
    selectedItems = [];
    resetPolygonDraft();
    arcSteps = [];
    closePopup();
    closeContextMenu();
  }

  engine.isPaused = !engine.isPaused;
  if (engine.isPaused) {
    playIcon.classList.add('is-play');
    playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';
  } else {
    playIcon.classList.remove('is-play');
    playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1"/><rect x="15" y="4" width="4" height="16" rx="1"/></svg>';
  }
});

btnStep.addEventListener('click', () => {
  if (!isSimulating) {
    engine.saveSimStartSnapshot();
    isSimulating = true;
    document.querySelector('.ribbon-row-construction')?.classList.add('simulating-locked');
    document.getElementById('btnToolbarClear')?.setAttribute('disabled', 'true');
    activeTool = 'select';
    ribbonToolBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('toolSelect')?.classList.add('active');
    if (toolDialogPanel) toolDialogPanel.style.display = 'none';
    closePopup();
    closeContextMenu();
  }
  pushHistoryFrame();
  engine.isPaused = false;
  engine.step(0.016);
  engine.isPaused = true;
  playIcon.classList.add('is-play');
  playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';
});

btnStepBack.addEventListener('click', () => {
  popHistoryFrame();
});

btnStopReset.addEventListener('click', () => {
  isSimulating = false;
  engine.isPaused = true;
  document.querySelector('.ribbon-row-construction')?.classList.remove('simulating-locked');
  document.getElementById('btnToolbarClear')?.removeAttribute('disabled');
  
  engine.restoreSimStartSnapshot();
  
  selectedItems = [];
  historyBuffer.length = 0;
  
  playIcon.classList.add('is-play');
  playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';
  
  closePopup();
  closeContextMenu();
  updateElementsList();
  renderToolProperties(activeTool);
  timeVal.textContent = '0.00 s';
});

document.getElementById('btnUnlockSim')?.addEventListener('click', (e) => {
  e.stopPropagation();
  btnStopReset.click();
});

speedSlider.addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  engine.timeScale = v;
  speedVal.textContent = `${v.toFixed(2)}×`;
});

// Zoom Controls
function updateZoomText() {
  zoomDisplay.textContent = `${Math.round(renderer.zoom * 100)}%`;
}
btnZoomIn.addEventListener('click', () => {
  renderer.zoomAt(canvas.width * 0.5, canvas.height * 0.5, 1.2);
  updateZoomText();
  updatePopupPosition();
});
btnZoomOut.addEventListener('click', () => {
  renderer.zoomAt(canvas.width * 0.5, canvas.height * 0.5, 0.83);
  updateZoomText();
  updatePopupPosition();
});
btnResetView.addEventListener('click', () => {
  renderer.setViewport(canvas.width * 0.5 - 450, canvas.height * 0.5 - 300, 1.0);
  updateZoomText();
  updatePopupPosition();
});

// Snapping to Existing Wall Endpoints (Magnetic Snap)
function findSnapVertex(posWorld, maxDist = 14) {
  let closest = null;
  let minDistSq = maxDist * maxDist;

  for (const wall of engine.walls) {
    const d1Sq = (posWorld.x - wall.p1.x) ** 2 + (posWorld.y - wall.p1.y) ** 2;
    if (d1Sq < minDistSq) {
      minDistSq = d1Sq;
      closest = { x: wall.p1.x, y: wall.p1.y, isVertex: true };
    }
    const d2Sq = (posWorld.x - wall.p2.x) ** 2 + (posWorld.y - wall.p2.y) ** 2;
    if (d2Sq < minDistSq) {
      minDistSq = d2Sq;
      closest = { x: wall.p2.x, y: wall.p2.y, isVertex: true };
    }
  }
  return closest;
}

// Coordinate Converter
function getCoords(evt) {
  const rect = canvas.getBoundingClientRect();
  const screenX = evt.clientX - rect.left;
  const screenY = evt.clientY - rect.top;
  const world = renderer.screenToWorld(screenX, screenY);
  
  // Magnetic Snapping for drawing tools
  const isDrawingTool = activeTool === 'wall' || activeTool === 'valve' || activeTool === 'throttle_valve';
  const snapVertex = isDrawingTool ? findSnapVertex(world, 14 / renderer.zoom) : null;
  if (snapVertex) {
    return {
      screenX, screenY,
      worldX: snapVertex.x,
      worldY: snapVertex.y,
      snapX: snapVertex.x,
      snapY: snapVertex.y,
      isVertex: true
    };
  }

  return {
    screenX, screenY,
    worldX: world.x,
    worldY: world.y,
    snapX: snapToGrid(world.x),
    snapY: snapToGrid(world.y),
    isVertex: false
  };
}

// Mouse Handlers
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const coords = getCoords(e);
  renderer.zoomAt(coords.screenX, coords.screenY, factor);
  updateZoomText();
  updatePopupPosition();
}, { passive: false });

// Right-Click Context Menu
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const coords = getCoords(e);
  resetPolygonDraft();
  arcSteps = [];

  if (isSimulating) return;

  const item = findItemAt(coords.worldX, coords.worldY);
  if (item) {
    if (!selectedItems.includes(item)) selectedItems = [item];
    updateElementsList();
    openContextMenu(e.clientX, e.clientY);
  } else {
    closeContextMenu();
  }
});

function openContextMenu(screenX, screenY) {
  contextMenu.style.left = `${Math.min(window.innerWidth - 180, screenX)}px`;
  contextMenu.style.top = `${Math.min(window.innerHeight - 150, screenY)}px`;
  contextMenu.style.display = 'flex';
}

function closeContextMenu() {
  contextMenu.style.display = 'none';
}

window.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target)) closeContextMenu();
});

ctxDelete?.addEventListener('click', () => {
  recordUndoState();
  deleteSelectedItems();
  closeContextMenu();
});

ctxDuplicate?.addEventListener('click', () => {
  if (selectedItems.length === 0) return;
  recordUndoState();
  const newItems = [];
  selectedItems.forEach(item => {
    if (item instanceof Wall) {
      const w = engine.addWall(item.p1.x + 20, item.p1.y + 20, item.p2.x + 20, item.p2.y + 20, {
        type: item.type, conductivity: item.conductivity, thickness: item.thickness,
        allowedDirection: item.allowedDirection, triggerPressure: item.triggerPressure,
        pressureHysteresis: item.pressureHysteresis, reliefMode: item.reliefMode
      });
      newItems.push(w);
    } else if (item instanceof Reservoir) {
      const r = engine.addReservoir(item.x + 20, item.y + 20, item.width, item.height, {
        label: item.label, temperature: item.temperature, conductance: item.conductance, isActive: item.isActive
      });
      newItems.push(r);
    } else if (item instanceof HeatExchanger) {
      const hx = engine.addHeatExchanger(item.x + 20, item.y + 20, item.width, item.height, {
        temperature: item.temperature, conductivity: item.conductivity, isActive: item.isActive
      });
      newItems.push(hx);
    } else if (item instanceof RegeneratorMatrix) {
      const reg = engine.addRegeneratorMatrix(item.x + 20, item.y + 20, item.width, item.height, {
        orientation: item.orientation, sliceCount: item.sliceCount, heatCapacity: item.heatCapacity,
        conductivity: item.conductivity, axialConductivity: item.axialConductivity,
        temperatures: [...item.temperatures], isActive: item.isActive
      });
      newItems.push(reg);
    } else if (item instanceof ThermalBlock) {
      const b = engine.addThermalBlock(item.x + 20, item.y + 20, item.width, item.height, {
        temperature: item.temperature, heatCapacity: item.heatCapacity, conductivity: item.conductivity, isActive: item.isActive
      });
      newItems.push(b);
    } else if (item instanceof Emitter) {
      const em = engine.addEmitter(item.x + 20, item.y + 20, item.width, item.height, {
        rate: item.rate, temperature: item.temperature, mass: item.mass, direction: item.direction, maxParticles: item.maxParticles, enabled: item.enabled
      });
      newItems.push(em);
    } else if (item instanceof Sink) {
      const sk = engine.addSink(item.x + 20, item.y + 20, item.width, item.height, {
        absorptionEfficiency: item.absorptionEfficiency, direction: item.direction,
        maxParticles: item.maxParticles, tempFilterMode: item.tempFilterMode,
        filterTemperature: item.filterTemperature, isActive: item.isActive
      });
      newItems.push(sk);
    } else if (item instanceof Regulator) {
      const reg = engine.addRegulator(item.x + 20, item.y + 20, item.width, item.height, {
        targetCount: item.targetCount, hysteresis: item.hysteresis,
        temperature: item.temperature, mass: item.mass, rate: item.rate, isActive: item.isActive
      });
      newItems.push(reg);
    } else if (item instanceof ThrottleValve) {
      const tv = engine.addThrottleValve(item.p1.x + 20, item.p1.y + 20, item.p2.x + 20, item.p2.y + 20, {
        openRatio: item.openRatio, thickness: item.thickness, conductivity: item.conductivity, temperature: item.temperature, isActive: item.isActive
      });
      newItems.push(tv);
    } else if (item instanceof SensorZone) {
      const s = engine.addSensor({
        label: `${item.label} (Copy)`, x: item.x + 20, y: item.y + 20, width: item.width, height: item.height,
        color: item.color
      });
      newItems.push(s);
    }
  });
  selectedItems = newItems;
  updateElementsList();
  closeContextMenu();
});

ctxGroup?.addEventListener('click', () => {
  toggleGroupSelection();
  closeContextMenu();
});

ctxBringFront?.addEventListener('click', () => {
  if (selectedItems.length === 0) return;
  recordUndoState();
  selectedItems.forEach(item => engine.bringToFront(item));
  updateElementsList();
  closeContextMenu();
});

ctxBringForward?.addEventListener('click', () => {
  if (selectedItems.length === 0) return;
  recordUndoState();
  selectedItems.forEach(item => engine.bringForward(item));
  updateElementsList();
  closeContextMenu();
});

ctxSendBackward?.addEventListener('click', () => {
  if (selectedItems.length === 0) return;
  recordUndoState();
  selectedItems.forEach(item => engine.sendBackward(item));
  updateElementsList();
  closeContextMenu();
});

ctxSendBack?.addEventListener('click', () => {
  if (selectedItems.length === 0) return;
  recordUndoState();
  selectedItems.forEach(item => engine.sendToBack(item));
  updateElementsList();
  closeContextMenu();
});

// ============================================================================
// Canvas Selection & Multi-Item Transforms
// ============================================================================
function getSelectionBounds() {
  if (selectedItems.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const item of selectedItems) {
    if (item.p1 && item.p2) {
      minX = Math.min(minX, item.p1.x, item.p2.x);
      maxX = Math.max(maxX, item.p1.x, item.p2.x);
      minY = Math.min(minY, item.p1.y, item.p2.y);
      maxY = Math.max(maxY, item.p1.y, item.p2.y);
    } else if (item.x !== undefined && item.y !== undefined) {
      const w = item.width || 30;
      const h = item.height || 30;
      minX = Math.min(minX, item.x);
      maxX = Math.max(maxX, item.x + w);
      minY = Math.min(minY, item.y);
      maxY = Math.max(maxY, item.y + h);
    }
  }
  return { minX, maxX, minY, maxY, cx: (minX + maxX) * 0.5, cy: (minY + maxY) * 0.5 };
}

function rotateSelection90() {
  if (selectedItems.length === 0 || isSimulating) return;
  recordUndoState();
  const bounds = getSelectionBounds();
  if (!bounds) return;
  const { cx, cy } = bounds;

  for (const item of selectedItems) {
    if (item.p1 && item.p2) {
      const x1 = cx - (item.p1.y - cy);
      const y1 = cy + (item.p1.x - cx);
      const x2 = cx - (item.p2.y - cy);
      const y2 = cy + (item.p2.x - cx);
      item.setPoints(x1, y1, x2, y2);
    } else if (item.x !== undefined && item.y !== undefined) {
      const w = item.width || 40;
      const h = item.height || 40;
      const itemCenterX = item.x + w * 0.5;
      const itemCenterY = item.y + h * 0.5;
      const newCenterX = cx - (itemCenterY - cy);
      const newCenterY = cy + (itemCenterX - cx);
      
      item.width = h;
      item.height = w;
      item.x = newCenterX - item.width * 0.5;
      item.y = newCenterY - item.height * 0.5;

      if (item.direction) {
        const dirs = ['right', 'down', 'left', 'up'];
        const idx = dirs.indexOf(item.direction);
        if (idx !== -1) item.direction = dirs[(idx + 1) % 4];
      }
      if (item.orientation) {
        item.orientation = item.orientation === 'horizontal' ? 'vertical' : 'horizontal';
      }
    }
  }
  updateElementsList();
}

function flipSelectionH() {
  if (selectedItems.length === 0 || isSimulating) return;
  recordUndoState();
  const bounds = getSelectionBounds();
  if (!bounds) return;
  const { cx } = bounds;

  for (const item of selectedItems) {
    if (item.p1 && item.p2) {
      const x1 = 2 * cx - item.p1.x;
      const x2 = 2 * cx - item.p2.x;
      item.setPoints(x1, item.p1.y, x2, item.p2.y);
      if (item.flipDirection) item.flipDirection();
      else if (item.allowedDirection) item.allowedDirection = -item.allowedDirection;
    } else if (item.x !== undefined) {
      const w = item.width || 40;
      const itemCenterX = item.x + w * 0.5;
      const newCenterX = 2 * cx - itemCenterX;
      item.x = newCenterX - w * 0.5;
      if (item.direction === 'right') item.direction = 'left';
      else if (item.direction === 'left') item.direction = 'right';
    }
  }
  updateElementsList();
}

function flipSelectionV() {
  if (selectedItems.length === 0 || isSimulating) return;
  recordUndoState();
  const bounds = getSelectionBounds();
  if (!bounds) return;
  const { cy } = bounds;

  for (const item of selectedItems) {
    if (item.p1 && item.p2) {
      const y1 = 2 * cy - item.p1.y;
      const y2 = 2 * cy - item.p2.y;
      item.setPoints(item.p1.x, y1, item.p2.x, y2);
      if (item.flipDirection) item.flipDirection();
      else if (item.allowedDirection) item.allowedDirection = -item.allowedDirection;
    } else if (item.y !== undefined) {
      const h = item.height || 40;
      const itemCenterY = item.y + h * 0.5;
      const newCenterY = 2 * cy - itemCenterY;
      item.y = newCenterY - h * 0.5;
      if (item.direction === 'up') item.direction = 'down';
      else if (item.direction === 'down') item.direction = 'up';
    }
  }
  updateElementsList();
}

function getAllGroupItems(item) {
  if (!item || !item.groupId) return [item];
  const all = [
    ...engine.walls,
    ...(engine.throttleValves || []),
    ...engine.pistons,
    ...engine.reservoirs,
    ...engine.thermalBlocks,
    ...engine.heatExchangers,
    ...engine.regenerators,
    ...engine.emitters,
    ...engine.sinks,
    ...engine.regulators,
    ...engine.sensors,
    ...engine.textLabels
  ];
  const group = all.filter(i => i.groupId && i.groupId === item.groupId);
  return group.length > 0 ? group : [item];
}

function toggleGroupSelection() {
  if (selectedItems.length === 0 || isSimulating) return;
  recordUndoState();
  const allSameGroup = selectedItems.length > 1 && selectedItems.every(i => i.groupId && i.groupId === selectedItems[0].groupId);
  if (allSameGroup) {
    selectedItems.forEach(i => { delete i.groupId; });
  } else {
    const gid = 'g_' + Math.random().toString(36).substring(2, 8);
    selectedItems.forEach(i => { i.groupId = gid; });
  }
  updateElementsList();
}

btnRotate90?.addEventListener('click', rotateSelection90);
btnFlipH?.addEventListener('click', flipSelectionH);
btnFlipV?.addEventListener('click', flipSelectionV);
btnGroupSelected?.addEventListener('click', toggleGroupSelection);

// ============================================================================
// Canvas Mouse Interactions
// ============================================================================
canvas.addEventListener('mousedown', (e) => {
  closeContextMenu();
  closeAllMenus();
  const coords = getCoords(e);
  currentCursorWorld = { x: coords.snapX, y: coords.snapY };

  // Direct Click during Simulation: Toggle manual valves & emitters
  if (isSimulating) {
    for (let i = 0; i < engine.walls.length; i++) {
      const w = engine.walls[i];
      if (w.type === 'manual_valve') {
        const closest = w.getClosestPoint(new Vector2(coords.worldX, coords.worldY));
        if (Math.hypot(closest.x - coords.worldX, closest.y - coords.worldY) < 18 / renderer.zoom) {
          w.isOpen = !w.isOpen;
          return;
        }
      }
    }
    for (let i = 0; i < (engine.throttleValves || []).length; i++) {
      const tv = engine.throttleValves[i];
      const closest = tv._closestPointOnSegment(new Vector2(coords.worldX, coords.worldY), tv.p1, tv.p2);
      if (Math.hypot(closest.x - coords.worldX, closest.y - coords.worldY) < 18 / renderer.zoom) {
        tv.toggle();
        return;
      }
    }
    const clickedEm = engine.emitters.find(em => em.contains(coords.worldX, coords.worldY));
    if (clickedEm) {
      clickedEm.toggle();
      return;
    }
  }

  // Panning with Middle Mouse or Alt-Click
  if (e.button === 1 || e.altKey) {
    isPanning = true;
    panStartScreen = { x: coords.screenX, y: coords.screenY };
    panStartCamera = { x: renderer.panX, y: renderer.panY };
    canvas.style.cursor = 'grabbing';
    return;
  }

  if (e.button !== 0) return;

  isMouseDown = true;
  dragStartWorld = { x: coords.snapX, y: coords.snapY };

  const clickedItem = findItemAt(coords.worldX, coords.worldY);

  // In Simulation Mode or Direct Click: Toggle interactive thermal/mechanical elements
  if (clickedItem && (isSimulating || (activeTool === 'select' && !e.shiftKey))) {
    if (
      clickedItem instanceof HeatExchanger ||
      clickedItem instanceof RegeneratorMatrix ||
      clickedItem instanceof ThermalBlock ||
      clickedItem instanceof Reservoir ||
      clickedItem instanceof Emitter ||
      clickedItem instanceof Sink ||
      clickedItem instanceof Regulator ||
      (clickedItem instanceof Piston && (clickedItem.mode === 'motorized' || clickedItem.mode === 'damper'))
    ) {
      if (isSimulating) {
        clickedItem.toggle();
        updateElementsList();
        return;
      }
    }
  }

  // Polyline Wall Placement & Closing (must precede handle dragging & selection to allow closing loop on start vertex)
  if (!isSimulating && activeTool === 'wall' && toolConfigs.wall.shape === 'polygon') {
    const pt = { x: coords.snapX, y: coords.snapY };
    if (polygonPoints.length === 0) {
      polygonGroupId = 'g_poly_' + Math.random().toString(36).substring(2, 9);
      polygonWalls = [];
      polygonPoints.push(pt);
    } else {
      const p0 = polygonPoints[0];
      const closeDist = 18 / renderer.zoom;
      const isCloseToStart = polygonPoints.length >= 2 && (
        Math.hypot(coords.worldX - p0.x, coords.worldY - p0.y) < closeDist ||
        (coords.snapX === p0.x && coords.snapY === p0.y)
      );

      const targetPt = isCloseToStart ? { x: p0.x, y: p0.y } : pt;
      const prev = polygonPoints[polygonPoints.length - 1];

      if (prev.x !== targetPt.x || prev.y !== targetPt.y) {
        recordUndoState();
        const cfg = toolConfigs.wall;
        const w = engine.addWall(prev.x, prev.y, targetPt.x, targetPt.y, {
          conductivity: cfg.conductivity,
          thickness: cfg.thickness,
          groupId: polygonGroupId
        });
        polygonWalls.push(w);

        if (isCloseToStart) {
          selectedItems = [...polygonWalls];
          resetPolygonDraft();
          updateElementsList();
        } else {
          polygonPoints.push(targetPt);
          updateElementsList();
        }
      }
    }
    return;
  }

  // Handle Resize / Stroke Limit Handle Dragging (handles take precedence over tool creation)
  if (!isSimulating) {
    const handleHitRadius = 16 / renderer.zoom;

    // Check handles of currently selected items first
    for (const item of selectedItems) {
      const handles = renderer.getResizeHandles(item);
      for (let i = 0; i < handles.length; i++) {
        const h = handles[i];
        if (Math.hypot(coords.worldX - h.x, coords.worldY - h.y) < handleHitRadius) {
          recordUndoState();
          draggingHandle = { item, handleId: h.id };
          return;
        }
      }
    }

    // Check if clicking directly on handles of unselected item
    if (clickedItem && !selectedItems.includes(clickedItem)) {
      const handles = renderer.getResizeHandles(clickedItem);
      for (let i = 0; i < handles.length; i++) {
        const h = handles[i];
        if (Math.hypot(coords.worldX - h.x, coords.worldY - h.y) < handleHitRadius) {
          selectedItems = [clickedItem];
          updateElementsList();
          recordUndoState();
          draggingHandle = { item: clickedItem, handleId: h.id };
          return;
        }
      }
    }
  }

  // Select & Move (supports Shift + Click multi-selection, Group auto-selection & Particle selection)
  if (!isSimulating && (activeTool === 'select' || e.shiftKey)) {
    if (clickedItem) {
      const itemsToToggle = clickedItem.groupId ? getAllGroupItems(clickedItem) : [clickedItem];
      if (e.shiftKey) {
        const isAnySelected = itemsToToggle.some(i => selectedItems.includes(i));
        if (isAnySelected) {
          selectedItems = selectedItems.filter(i => !itemsToToggle.includes(i));
        } else {
          selectedItems = [...selectedItems, ...itemsToToggle];
        }
      } else {
        selectedItems = itemsToToggle;
      }
      recordUndoState();
      isMovingSelection = true;
      moveStartWorld = { x: coords.snapX, y: coords.snapY };
      updateElementsList();
      return;
    } else {
      // Check if clicking a single particle
      const clickedP = engine.findParticleAt(coords.worldX, coords.worldY, 14 / renderer.zoom);
      if (clickedP) {
        if (!e.shiftKey) {
          engine.particles.forEach(p => { p.selected = false; });
          selectedItems = [];
        }
        clickedP.selected = !clickedP.selected;
        if (clickedP.selected) selectedItems.push(clickedP);
        else selectedItems = selectedItems.filter(i => i !== clickedP);
        updateElementsList();
        return;
      } else if (!e.shiftKey) {
        engine.particles.forEach(p => { p.selected = false; });
        selectedItems = [];
        updateElementsList();
      }
    }
  }

  // Text Tool
  if (!isSimulating && activeTool === 'text') {
    const txt = prompt('Enter text note:', toolConfigs.text.text || 'Annotation');
    if (txt) {
      recordUndoState();
      const l = engine.addTextLabel(coords.snapX, coords.snapY, txt, { fontSize: toolConfigs.text.fontSize });
      selectedItems = [l];
      updateElementsList();
    }
    return;
  }

  // Arc Wall: 3 Clicks
  if (!isSimulating && activeTool === 'wall' && toolConfigs.wall.shape === 'arc') {
    arcSteps.push({ x: coords.snapX, y: coords.snapY });
    if (arcSteps.length === 3) {
      recordUndoState();
      createArcWall(arcSteps[0], arcSteps[1], arcSteps[2]);
      arcSteps = [];
      updateElementsList();
    }
    return;
  }
});

window.addEventListener('mousemove', (e) => {
  const coords = getCoords(e);
  currentCursorWorld = { x: coords.snapX, y: coords.snapY };
  renderer.snapCursor = { x: coords.snapX, y: coords.snapY, isVertex: coords.isVertex };

  if (isPanning) {
    renderer.panX = panStartCamera.x + (coords.screenX - panStartScreen.x);
    renderer.panY = panStartCamera.y + (coords.screenY - panStartScreen.y);
    updatePopupPosition();
    return;
  }

  // Update live draft preview info in renderer
  if (isMouseDown && dragStartWorld && !isSimulating && !draggingHandle && !isMovingSelection) {
    renderer.draftInfo = {
      isDrafting: true,
      tool: activeTool,
      shape: (activeTool === 'wall' && toolConfigs.wall) ? toolConfigs.wall.shape : 'line',
      vtype: (activeTool === 'valve' && toolConfigs.valve) ? toolConfigs.valve.type : '',
      start: dragStartWorld,
      current: currentCursorWorld
    };
  } else {
    renderer.draftInfo = null;
  }

  // Dragging Handles
  if (!isSimulating && draggingHandle) {
    const { item, handleId } = draggingHandle;
    if (item instanceof Wall) {
      if (handleId === 'p1') { item.p1.x = coords.snapX; item.p1.y = coords.snapY; }
      else if (handleId === 'p2') { item.p2.x = coords.snapX; item.p2.y = coords.snapY; }
      item._updateGeometry();
    } else if (item instanceof ThrottleValve) {
      if (handleId === 'p1') { item.p1.x = coords.snapX; item.p1.y = coords.snapY; item._updateGeometry(); }
      else if (handleId === 'p2') { item.p2.x = coords.snapX; item.p2.y = coords.snapY; item._updateGeometry(); }
      else if (handleId === 'gap1' || handleId === 'gap2') {
        const mid = item.midPoint;
        const dx = coords.snapX - mid.x;
        const dy = coords.snapY - mid.y;
        const proj = Math.abs(dx * item.unitDir.x + dy * item.unitDir.y);
        const halfLen = item.length * 0.5;
        if (halfLen > 0) {
          const ratio = Math.max(0.02, Math.min(0.98, (proj * 2.0) / item.length));
          item.setOpenRatio(ratio);
        }
      }
    } else if (item instanceof Piston) {
      const halfThick = (item.orientation === 'horizontal' ? item.width : item.height) * 0.5;
      if (item.orientation === 'horizontal') {
        if (handleId === 'minPos') {
          item.minPos = Math.min(item.maxPos - halfThick * 2 - 10, coords.snapX);
        } else {
          item.maxPos = Math.max(item.minPos + halfThick * 2 + 10, coords.snapX);
        }
        item.setPos(item.x);
      } else {
        if (handleId === 'minPos') {
          item.minPos = Math.min(item.maxPos - halfThick * 2 - 10, coords.snapY);
        } else {
          item.maxPos = Math.max(item.minPos + halfThick * 2 + 10, coords.snapY);
        }
        item.setPos(item.y);
      }
      item.amplitude = Math.max(0, (item.maxPos - item.minPos - halfThick * 2) * 0.5);
      item.centerPos = (item.minPos + item.maxPos) * 0.5;
    } else if (item instanceof TextLabel) {
      if (handleId === 'br') {
        item.width = Math.max(40, coords.snapX - item.x);
        item.height = Math.max(16, coords.snapY - item.y);
        item.fontSize = Math.max(10, Math.min(48, Math.round(item.height - 8)));
      } else if (handleId === 'tr') {
        const newH = item.y + item.height - coords.snapY;
        if (newH >= 16) { item.y = coords.snapY; item.height = newH; item.fontSize = Math.max(10, Math.min(48, Math.round(item.height - 8))); }
        item.width = Math.max(40, coords.snapX - item.x);
      } else if (handleId === 'tl') {
        const newW = item.x + item.width - coords.snapX;
        const newH = item.y + item.height - coords.snapY;
        if (newW >= 40) { item.x = coords.snapX; item.width = newW; }
        if (newH >= 16) { item.y = coords.snapY; item.height = newH; item.fontSize = Math.max(10, Math.min(48, Math.round(item.height - 8))); }
      } else if (handleId === 'bl') {
        const newW = item.x + item.width - coords.snapX;
        if (newW >= 40) { item.x = coords.snapX; item.width = newW; }
        item.height = Math.max(16, coords.snapY - item.y);
        item.fontSize = Math.max(10, Math.min(48, Math.round(item.height - 8)));
      }
    } else if (item.x !== undefined && item.y !== undefined && item.width !== undefined && item.height !== undefined) {
      if (handleId === 'br') {
        item.width = Math.max(20, coords.snapX - item.x);
        item.height = Math.max(20, coords.snapY - item.y);
      } else if (handleId === 'tr') {
        const newH = item.y + item.height - coords.snapY;
        if (newH >= 20) { item.y = coords.snapY; item.height = newH; }
        item.width = Math.max(20, coords.snapX - item.x);
      } else if (handleId === 'tl') {
        const newW = item.x + item.width - coords.snapX;
        const newH = item.y + item.height - coords.snapY;
        if (newW >= 20) { item.x = coords.snapX; item.width = newW; }
        if (newH >= 20) { item.y = coords.snapY; item.height = newH; }
      } else if (handleId === 'bl') {
        const newW = item.x + item.width - coords.snapX;
        if (newW >= 20) { item.x = coords.snapX; item.width = newW; }
        item.height = Math.max(20, coords.snapY - item.y);
      }
    }
    updatePopupPosition();
    return;
  }

  // Move selected items
  if (!isSimulating && isMovingSelection && moveStartWorld) {
    const dx = coords.snapX - moveStartWorld.x;
    const dy = coords.snapY - moveStartWorld.y;
    if (dx !== 0 || dy !== 0) {
      moveSelectedItems(dx, dy);
      moveStartWorld = { x: coords.snapX, y: coords.snapY };
      updatePopupPosition();
    }
    return;
  }

  // Cursor in Select Mode
  if (!isSimulating && activeTool === 'select' && !isMouseDown) {
    if (selectedItems.length === 1) {
      const handles = renderer.getResizeHandles(selectedItems[0]);
      const hitRadius = 14 / renderer.zoom;
      const isOverHandle = handles.some(h => Math.hypot(coords.worldX - h.x, coords.worldY - h.y) < hitRadius);
      if (isOverHandle) {
        canvas.style.cursor = 'crosshair';
        return;
      }
    }
    const itemUnderCursor = findItemAt(coords.worldX, coords.worldY);
    if (itemUnderCursor && selectedItems.includes(itemUnderCursor)) {
      canvas.style.cursor = 'move';
    } else if (itemUnderCursor) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }
});

window.addEventListener('mouseup', (e) => {
  if (isPanning) {
    isPanning = false;
    canvas.style.cursor = 'crosshair';
  }

  const wasDraggingHandle = !!draggingHandle;
  const wasMovingSelection = isMovingSelection;

  if (draggingHandle) draggingHandle = null;
  if (isMovingSelection) isMovingSelection = false;

  if (!isMouseDown) return;
  isMouseDown = false;
  renderer.draftInfo = null;

  if (wasDraggingHandle || wasMovingSelection) {
    return;
  }

  const coords = getCoords(e);

  if (!isSimulating && dragStartWorld) {
    const s = dragStartWorld;
    const c = { x: coords.snapX, y: coords.snapY };
    const minX = Math.min(s.x, c.x), minY = Math.min(s.y, c.y);
    const w = Math.abs(c.x - s.x), h = Math.abs(c.y - s.y);

    // Marquee Selection (Objects + Particles)
    if (activeTool === 'select' && (w >= 10 || h >= 10)) {
      const boxItems = findItemsInBox(minX, minY, minX + w, minY + h);
      const boxParticles = engine.findParticlesInRect(minX, minY, minX + w, minY + h);
      boxParticles.forEach(p => { p.selected = true; });
      selectedItems = [...boxItems, ...boxParticles];
      updateElementsList();

    // Wall Rectangle
    } else if (activeTool === 'wall' && toolConfigs.wall.shape === 'rect' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.wall;
      const gid = 'g_rect_' + Math.random().toString(36).substring(2, 9);
      const w1 = engine.addWall(minX, minY, minX + w, minY, { conductivity: cfg.conductivity, thickness: cfg.thickness, groupId: gid });
      const w2 = engine.addWall(minX + w, minY, minX + w, minY + h, { conductivity: cfg.conductivity, thickness: cfg.thickness, groupId: gid });
      const w3 = engine.addWall(minX + w, minY + h, minX, minY + h, { conductivity: cfg.conductivity, thickness: cfg.thickness, groupId: gid });
      const w4 = engine.addWall(minX, minY + h, minX, minY, { conductivity: cfg.conductivity, thickness: cfg.thickness, groupId: gid });
      selectedItems = [w1, w2, w3, w4];
      updateElementsList();

    // Wall Circle
    } else if (activeTool === 'wall' && toolConfigs.wall.shape === 'circle') {
      const radius = Math.hypot(c.x - s.x, c.y - s.y);
      if (radius >= 12) {
        recordUndoState();
        createCircleWall(s, radius);
        updateElementsList();
      }

    // Piston
    } else if (activeTool === 'piston' && (w >= 20 || h >= 20)) {
      recordUndoState();
      const cfg = toolConfigs.piston;
      const isVertical = h >= w;
      const p = engine.addPiston({
        label: 'P', orientation: isVertical ? 'horizontal' : 'vertical',
        x: (s.x + c.x) * 0.5, y: (s.y + c.y) * 0.5,
        width: Math.max(16, w), height: Math.max(16, h),
        minPos: isVertical ? (s.x + c.x) * 0.5 - 140 : (s.y + c.y) * 0.5 - 140,
        maxPos: isVertical ? (s.x + c.x) * 0.5 + 140 : (s.y + c.y) * 0.5 + 140,
        mode: cfg.mode, mass: cfg.mass, springK: cfg.springK,
        frequency: cfg.frequency, amplitude: cfg.amplitude, phase: cfg.phase,
        dampingCoeff: cfg.dampingCoeff, conductivity: cfg.conductivity
      });
      selectedItems = [p];
      updateElementsList();

    // Isotherm-Block (Solid Constant-T Reservoir)
    } else if ((activeTool === 'solid_res' || activeTool === 'reservoir') && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.solid_res || toolConfigs.reservoir;
      const r = engine.addReservoir(minX, minY, w, h, {
        label: `Isotherm (${Math.round(cfg.temperature)}K)`, temperature: cfg.temperature, conductance: cfg.conductance
      });
      selectedItems = [r];
      updateElementsList();

    // Permeable Heat Exchanger (Cross-hatch constant-T)
    } else if (activeTool === 'heat_exchanger' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.heat_exchanger;
      const hx = engine.addHeatExchanger(minX, minY, w, h, {
        temperature: cfg.temperature, conductivity: cfg.conductivity
      });
      selectedItems = [hx];
      updateElementsList();

    // Permeable Regenerator Matrix (Multi-slice gradient with directional parallel lines)
    } else if ((activeTool === 'regenerator' || activeTool === 'matrix') && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.regenerator || toolConfigs.matrix;
      const isHoriz = cfg.orientation ? cfg.orientation === 'horizontal' : (w >= h);
      const reg = engine.addRegeneratorMatrix(minX, minY, w, h, {
        orientation: isHoriz ? 'horizontal' : 'vertical',
        temperature: cfg.temperature, heatCapacity: cfg.heatCapacity,
        conductivity: cfg.conductivity, sliceCount: 10
      });
      selectedItems = [reg];
      updateElementsList();

    // Solid Thermal Storage Block (Finite heat capacity C)
    } else if ((activeTool === 'storage_block' || activeTool === 'solidblock') && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.storage_block || toolConfigs.solidblock;
      const sb = engine.addThermalBlock(minX, minY, w, h, {
        temperature: cfg.temperature, heatCapacity: cfg.heatCapacity, conductivity: cfg.conductivity
      });
      selectedItems = [sb];
      updateElementsList();

    // Valve (Manual, Check, or Relief)
    } else if (activeTool === 'valve' && (s.x !== c.x || s.y !== c.y)) {
      recordUndoState();
      const cfg = toolConfigs.valve;
      const v = engine.addWall(s.x, s.y, c.x, c.y, {
        type: cfg.type,
        thickness: cfg.thickness || 4,
        conductivity: cfg.conductivity,
        allowedDirection: cfg.allowedDirection,
        triggerPressure: cfg.triggerPressure,
        pressureHysteresis: cfg.pressureHysteresis,
        reliefMode: cfg.reliefMode
      });
      selectedItems = [v];
      updateElementsList();

    // Throttle Valve (Variable Opening Orifice)
    } else if (activeTool === 'throttle_valve' && (s.x !== c.x || s.y !== c.y)) {
      recordUndoState();
      const cfg = toolConfigs.throttle_valve;
      const tv = engine.addThrottleValve(s.x, s.y, c.x, c.y, {
        openRatio: cfg.openRatio,
        thickness: cfg.thickness || 6,
        conductivity: cfg.conductivity || 0
      });
      selectedItems = [tv];
      updateElementsList();

    // Particle Spawner
    } else if (activeTool === 'gas' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.gas;
      const group = engine.spawnGasRaster(minX, minY, w, h, cfg.count, cfg.mass, cfg.temperature, cfg.velocityMode);
      selectedItems = [group];
      updateElementsList();

    // Particle Regulator Zone
    } else if (activeTool === 'regulator' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.regulator;
      const reg = engine.addRegulator(minX, minY, w, h, {
        targetCount: cfg.targetCount,
        hysteresis: cfg.hysteresis,
        temperature: cfg.temperature,
        mass: cfg.mass,
        rate: cfg.rate
      });
      selectedItems = [reg];
      updateElementsList();

    // Emitter (Source)
    } else if (activeTool === 'emitter' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.emitter;
      const em = engine.addEmitter(minX, minY, w, h, {
        rate: cfg.rate,
        temperature: cfg.temperature,
        mass: cfg.mass || 1.0,
        direction: cfg.direction,
        maxParticles: cfg.maxParticles
      });
      selectedItems = [em];
      updateElementsList();

    // Sink (Absorber)
    } else if (activeTool === 'sink' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.sink;
      const sk = engine.addSink(minX, minY, w, h, {
        absorptionEfficiency: cfg.absorptionEfficiency,
        direction: cfg.direction,
        maxParticles: cfg.maxParticles,
        tempFilterMode: cfg.tempFilterMode,
        filterTemperature: cfg.filterTemperature
      });
      selectedItems = [sk];
      updateElementsList();

    // Sensor Zone
    } else if (activeTool === 'sensor' && w >= 20 && h >= 20) {
      recordUndoState();
      const letter = String.fromCharCode(65 + engine.sensors.length);
      const sZone = engine.addSensor({
        label: `${toolConfigs.sensor.label} ${letter}`,
        x: minX, y: minY, width: w, height: h,
        color: toolConfigs.sensor.color || '#38bdf8'
      });
      selectedItems = [sZone];
      updateElementsList();
    }
  }

  dragStartWorld = null;
});

// Circle Wall Generator
function createCircleWall(center, radius) {
  if (radius < 10) return [];
  const cfg = toolConfigs.wall;
  const numSegments = Math.max(20, Math.min(64, Math.round(radius * 0.45)));
  const angleStep = (Math.PI * 2) / numSegments;
  const createdWalls = [];
  const gid = 'g_circle_' + Math.random().toString(36).substring(2, 9);

  for (let i = 0; i < numSegments; i++) {
    const a1 = i * angleStep;
    const a2 = (i + 1) * angleStep;
    const x1 = center.x + radius * Math.cos(a1);
    const y1 = center.y + radius * Math.sin(a1);
    const x2 = center.x + radius * Math.cos(a2);
    const y2 = center.y + radius * Math.sin(a2);
    const w = engine.addWall(x1, y1, x2, y2, {
      conductivity: cfg.conductivity,
      thickness: cfg.thickness,
      groupId: gid
    });
    createdWalls.push(w);
  }
  selectedItems = createdWalls;
  return createdWalls;
}

// Arc Generator
function createArcWall(center, pStart, pEnd) {
  const radius = Math.hypot(pStart.x - center.x, pStart.y - center.y);
  if (radius < 10) return [];

  const startAngle = Math.atan2(pStart.y - center.y, pStart.x - center.x);
  let endAngle = Math.atan2(pEnd.y - center.y, pEnd.x - center.x);
  if (endAngle <= startAngle) endAngle += Math.PI * 2;

  const numSegments = 16;
  const angleStep = (endAngle - startAngle) / numSegments;
  const cfg = toolConfigs.wall;
  const gid = 'g_arc_' + Math.random().toString(36).substring(2, 9);
  const createdWalls = [];

  for (let i = 0; i < numSegments; i++) {
    const a1 = startAngle + i * angleStep;
    const a2 = startAngle + (i + 1) * angleStep;
    const x1 = center.x + radius * Math.cos(a1);
    const y1 = center.y + radius * Math.sin(a1);
    const x2 = center.x + radius * Math.cos(a2);
    const y2 = center.y + radius * Math.sin(a2);
    const w = engine.addWall(x1, y1, x2, y2, {
      conductivity: cfg.conductivity,
      thickness: cfg.thickness,
      groupId: gid
    });
    createdWalls.push(w);
  }
  selectedItems = createdWalls;
  return createdWalls;
}

// Item Search & Box Selection
function findItemAt(wx, wy) {
  for (let i = 0; i < engine.pistons.length; i++) {
    const p = engine.pistons[i], b = p.getBounds();
    if (wx >= b.left - 8 && wx <= b.right + 8 && wy >= b.top - 8 && wy <= b.bottom + 8) return p;
  }
  for (let i = 0; i < engine.reservoirs.length; i++) {
    if (engine.reservoirs[i].contains(wx, wy)) return engine.reservoirs[i];
  }
  for (let i = 0; i < engine.heatExchangers.length; i++) {
    if (engine.heatExchangers[i].contains(wx, wy)) return engine.heatExchangers[i];
  }
  for (let i = 0; i < engine.regenerators.length; i++) {
    if (engine.regenerators[i].contains(wx, wy)) return engine.regenerators[i];
  }
  for (let i = 0; i < engine.thermalBlocks.length; i++) {
    if (engine.thermalBlocks[i].contains(wx, wy)) return engine.thermalBlocks[i];
  }
  for (let i = 0; i < engine.emitters.length; i++) {
    if (engine.emitters[i].contains(wx, wy)) return engine.emitters[i];
  }
  for (let i = 0; i < engine.sinks.length; i++) {
    if (engine.sinks[i].contains(wx, wy)) return engine.sinks[i];
  }
  for (let i = 0; i < engine.regulators.length; i++) {
    if (engine.regulators[i].contains(wx, wy)) return engine.regulators[i];
  }
  for (let i = 0; i < engine.textLabels.length; i++) {
    if (engine.textLabels[i].contains(wx, wy)) return engine.textLabels[i];
  }
  for (let i = 0; i < engine.walls.length; i++) {
    const w = engine.walls[i], c = w.getClosestPoint(new Vector2(wx, wy));
    if (Math.hypot(c.x - wx, c.y - wy) < 14 / renderer.zoom) return w;
  }
  for (let i = 0; i < (engine.throttleValves || []).length; i++) {
    const tv = engine.throttleValves[i];
    const c = tv._closestPointOnSegment(new Vector2(wx, wy), tv.p1, tv.p2);
    if (Math.hypot(c.x - wx, c.y - wy) < 14 / renderer.zoom) return tv;
  }
  for (let i = 0; i < engine.sensors.length; i++) {
    if (engine.sensors[i].contains(new Vector2(wx, wy))) return engine.sensors[i];
  }
  return null;
}

function findItemsInBox(x1, y1, x2, y2) {
  const items = [];
  engine.walls.forEach(w => {
    if (w.p1.x >= x1 && w.p1.x <= x2 && w.p1.y >= y1 && w.p1.y <= y2) items.push(w);
  });
  (engine.throttleValves || []).forEach(tv => {
    if (tv.p1.x >= x1 && tv.p1.x <= x2 && tv.p1.y >= y1 && tv.p1.y <= y2) items.push(tv);
  });
  engine.pistons.forEach(p => {
    if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) items.push(p);
  });
  engine.reservoirs.forEach(r => {
    if (r.x >= x1 && r.x <= x2 && r.y >= y1 && r.y <= y2) items.push(r);
  });
  engine.heatExchangers.forEach(h => {
    if (h.x >= x1 && h.x <= x2 && h.y >= y1 && h.y <= y2) items.push(h);
  });
  engine.regenerators.forEach(reg => {
    if (reg.x >= x1 && reg.x <= x2 && reg.y >= y1 && reg.y <= y2) items.push(reg);
  });
  engine.thermalBlocks.forEach(b => {
    if (b.x >= x1 && b.x <= x2 && b.y >= y1 && b.y <= y2) items.push(b);
  });
  engine.emitters.forEach(e => {
    if (e.x >= x1 && e.x <= x2 && e.y >= y1 && e.y <= y2) items.push(e);
  });
  engine.sinks.forEach(s => {
    if (s.x >= x1 && s.x <= x2 && s.y >= y1 && s.y <= y2) items.push(s);
  });
  engine.regulators.forEach(r => {
    if (r.x >= x1 && r.x <= x2 && r.y >= y1 && r.y <= y2) items.push(r);
  });
  engine.textLabels.forEach(l => {
    if (l.x >= x1 && l.x <= x2 && l.y >= y1 && l.y <= y2) items.push(l);
  });
  engine.sensors.forEach(s => {
    if (s.x >= x1 && s.x <= x2 && s.y >= y1 && s.y <= y2) items.push(s);
  });
  return items;
}

function moveSelectedItems(dx, dy) {
  selectedItems.forEach(item => {
    if (item instanceof Wall) {
      item.p1.x += dx; item.p1.y += dy; item.p2.x += dx; item.p2.y += dy;
      item._updateGeometry();
    } else if (item instanceof ThrottleValve) {
      item.p1.x += dx; item.p1.y += dy; item.p2.x += dx; item.p2.y += dy;
      item._updateGeometry();
    } else if (item instanceof Piston) {
      item.x += dx; item.y += dy;
      item.minPos += (item.orientation === 'horizontal' ? dx : dy);
      item.maxPos += (item.orientation === 'horizontal' ? dx : dy);
      item.centerPos = (item.minPos + item.maxPos) * 0.5;
    } else if (item instanceof Reservoir || item instanceof HeatExchanger || item instanceof RegeneratorMatrix || item instanceof ThermalBlock || item instanceof Emitter || item instanceof Sink || item instanceof Regulator || item instanceof SensorZone || item instanceof TextLabel) {
      item.x += dx; item.y += dy;
    }
  });
}

function deleteSelectedItems() {
  if (selectedItems.length === 0) return;
  recordUndoState();
  const deleteSet = new Set(selectedItems);
  engine.walls = engine.walls.filter(w => !deleteSet.has(w));
  engine.throttleValves = (engine.throttleValves || []).filter(tv => !deleteSet.has(tv));
  engine.pistons = engine.pistons.filter(p => !deleteSet.has(p));
  engine.reservoirs = engine.reservoirs.filter(r => !deleteSet.has(r));
  engine.heatExchangers = engine.heatExchangers.filter(h => !deleteSet.has(h));
  engine.regenerators = engine.regenerators.filter(reg => !deleteSet.has(reg));
  engine.sensors = engine.sensors.filter(s => !deleteSet.has(s));
  engine.emitters = engine.emitters.filter(e => !deleteSet.has(e));
  engine.sinks = engine.sinks.filter(s => !deleteSet.has(s));
  engine.regulators = (engine.regulators || []).filter(r => !deleteSet.has(r));
  engine.thermalBlocks = engine.thermalBlocks.filter(b => !deleteSet.has(b));
  engine.textLabels = engine.textLabels.filter(l => !deleteSet.has(l));
  engine.particleGroups = (engine.particleGroups || []).filter(g => !deleteSet.has(g));
  engine.elements = (engine.elements || []).filter(el => !deleteSet.has(el));

  // Delete particles belonging to deleted groups
  const groupsToDelete = Array.from(deleteSet).filter(item => item instanceof ParticleGroup);
  for (const g of groupsToDelete) {
    const pts = engine.particles.filter(p => p.groupId === g.id);
    engine.deleteParticles(pts);
  }

  // Delete selected particles
  const particlesToDelete = engine.particles.filter(p => p.selected || deleteSet.has(p));
  if (particlesToDelete.length > 0) {
    engine.deleteParticles(particlesToDelete);
  }

  selectedItems = [];
  closePopup();
  closeContextMenu();
  updateElementsList();
}

// Element Popup Logic
function openPopup(item) {
  popupTargetItem = item;
  renderPopupContent(item);
  updatePopupPosition();
  elementPopup.style.display = 'flex';
}

function closePopup() {
  popupTargetItem = null;
  elementPopup.style.display = 'none';
}

btnPopupClose.addEventListener('click', closePopup);

function updatePopupPosition() {
  if (!popupTargetItem || elementPopup.style.display === 'none') return;
  let wx = 0, wy = 0;
  if (popupTargetItem instanceof Wall) {
    wx = (popupTargetItem.p1.x + popupTargetItem.p2.x) * 0.5;
    wy = (popupTargetItem.p1.y + popupTargetItem.p2.y) * 0.5;
  } else if (popupTargetItem instanceof Piston) {
    wx = popupTargetItem.x;
    wy = popupTargetItem.y - popupTargetItem.height * 0.5;
  } else if (popupTargetItem.x !== undefined && popupTargetItem.y !== undefined) {
    wx = popupTargetItem.x + (popupTargetItem.width || 0) * 0.5;
    wy = popupTargetItem.y;
  }
  const screen = renderer.worldToScreen(wx, wy);
  elementPopup.style.left = `${Math.max(300, Math.min(window.innerWidth - 400, screen.x))}px`;
  elementPopup.style.top = `${Math.max(100, Math.min(window.innerHeight - 100, screen.y))}px`;
}

function renderPopupContent(item) {
  if (item instanceof Piston) {
    popupTitle.textContent = `Piston [${item.label}]`;
    popupBody.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Mass m</span> <span id="popPMassVal" class="field-num">${item.mass}</span></div>
        <input type="range" id="popPMass" min="0" max="150" step="5" value="${item.mass}" class="styled-slider">
      </div>
      <div class="field-row">
        <div class="field-label"><span>Conductivity κ</span> <span id="popPKappaVal" class="field-num">${item.conductivity.toFixed(2)}</span></div>
        <input type="range" id="popPKappa" min="0" max="1" step="0.05" value="${item.conductivity}" class="styled-slider">
      </div>
      <button id="popDeleteBtn" class="btn-pill btn-danger" style="margin-top:4px; width:100%; justify-content:center;">Delete Piston</button>
    `;
    document.getElementById('popPMass').addEventListener('input', (e) => {
      item.mass = parseInt(e.target.value, 10);
      document.getElementById('popPMassVal').textContent = item.mass;
    });
    document.getElementById('popPKappa').addEventListener('input', (e) => {
      item.conductivity = parseFloat(e.target.value);
      document.getElementById('popPKappaVal').textContent = item.conductivity.toFixed(2);
    });
    document.getElementById('popDeleteBtn').addEventListener('click', () => {
      recordUndoState();
      engine.pistons = engine.pistons.filter(p => p !== item);
      selectedItems = [];
      closePopup();
      updateElementsList();
    });

  } else if (item instanceof Wall) {
    popupTitle.textContent = item.type === 'manual_valve' ? 'Valve' : 'Wall';
    popupBody.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Conductivity κ</span> <span id="popWKappaVal" class="field-num">${item.conductivity.toFixed(2)}</span></div>
        <input type="range" id="popWKappa" min="0" max="1" step="0.05" value="${item.conductivity}" class="styled-slider">
      </div>
      <button id="popDeleteBtn" class="btn-pill btn-danger" style="margin-top:4px; width:100%; justify-content:center;">Delete Wall</button>
    `;
    document.getElementById('popWKappa').addEventListener('input', (e) => {
      item.conductivity = parseFloat(e.target.value);
      document.getElementById('popWKappaVal').textContent = item.conductivity.toFixed(2);
    });
    document.getElementById('popDeleteBtn').addEventListener('click', () => {
      recordUndoState();
      engine.walls = engine.walls.filter(w => w !== item);
      selectedItems = [];
      closePopup();
      updateElementsList();
    });

  } else if (item instanceof Reservoir) {
    popupTitle.textContent = 'Thermal Reservoir';
    popupBody.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Temperature T</span> <span id="popResTVal" class="field-num">${Math.round(item.temperature)} K</span></div>
        <input type="range" id="popResT" min="50" max="800" step="25" value="${item.temperature}" class="styled-slider">
      </div>
      <button id="popDeleteBtn" class="btn-pill btn-danger" style="margin-top:4px; width:100%; justify-content:center;">Delete Reservoir</button>
    `;
    document.getElementById('popResT').addEventListener('input', (e) => {
      item.temperature = parseInt(e.target.value, 10);
      item.label = `${item.temperature}K`;
      document.getElementById('popResTVal').textContent = `${item.temperature} K`;
    });
    document.getElementById('popDeleteBtn').addEventListener('click', () => {
      recordUndoState();
      engine.reservoirs = engine.reservoirs.filter(r => r !== item);
      selectedItems = [];
      closePopup();
      updateElementsList();
    });

  } else if (item instanceof SensorZone) {
    popupTitle.textContent = 'Chamber Sensor';
    popupBody.innerHTML = `
      <div class="field-row">
        <div class="field-label"><span>Chamber Name</span></div>
        <input type="text" id="popSensName" value="${item.label}" class="styled-select" style="width:100%;">
      </div>
      <button id="popDeleteBtn" class="btn-pill btn-danger" style="margin-top:4px; width:100%; justify-content:center;">Delete Sensor</button>
    `;
    document.getElementById('popSensName').addEventListener('input', (e) => {
      item.label = e.target.value.trim() || 'Chamber';
      updateElementsList();
    });
    document.getElementById('popDeleteBtn').addEventListener('click', () => {
      recordUndoState();
      engine.sensors = engine.sensors.filter(s => s !== item);
      selectedItems = [];
      closePopup();
      updateElementsList();
    });

  } else {
    popupTitle.textContent = 'Component';
    popupBody.innerHTML = `
      <button id="popDeleteBtn" class="btn-pill btn-danger" style="width:100%; justify-content:center;">Delete Element</button>
    `;
    document.getElementById('popDeleteBtn').addEventListener('click', () => {
      deleteSelectedItems();
      closePopup();
      updateElementsList();
    });
  }
}

// Finish Wall Polygon / Arc
canvas.addEventListener('dblclick', () => { resetPolygonDraft(); arcSteps = []; });

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  if (e.ctrlKey && e.code === 'KeyZ') {
    e.preventDefault();
    if (e.shiftKey) performRedo();
    else performUndo();
    return;
  }
  if (e.ctrlKey && e.code === 'KeyY') {
    e.preventDefault();
    performRedo();
    return;
  }
  if (e.ctrlKey && e.code === 'KeyD') {
    e.preventDefault();
    ctxDuplicate.click();
    return;
  }
  if (e.ctrlKey && e.code === 'KeyO') {
    e.preventDefault();
    fileImportInput.click();
    return;
  }
  if (e.ctrlKey && e.code === 'KeyS') {
    e.preventDefault();
    openSaveModal();
    return;
  }

  if (e.code === 'Delete' || e.code === 'Backspace') {
    deleteSelectedItems();
  } else if (e.code === 'Space') {
    e.preventDefault();
    btnPlayPause.click();
  } else if (e.code === 'KeyS') {
    btnStep.click();
  } else if (e.code === 'Enter') {
    if (activeTool === 'wall' && toolConfigs.wall.shape === 'polygon' && polygonPoints.length >= 2) {
      const p0 = polygonPoints[0];
      const prev = polygonPoints[polygonPoints.length - 1];
      if (prev.x !== p0.x || prev.y !== p0.y) {
        recordUndoState();
        const cfg = toolConfigs.wall;
        const w = engine.addWall(prev.x, prev.y, p0.x, p0.y, {
          conductivity: cfg.conductivity,
          thickness: cfg.thickness,
          groupId: polygonGroupId
        });
        polygonWalls.push(w);
        selectedItems = [...polygonWalls];
        resetPolygonDraft();
        updateElementsList();
      }
    }
    if (activeTool !== 'select') {
      document.getElementById('toolSelect')?.click();
    }
  } else if (e.code === 'Escape') {
    if (isSplashActive) {
      if (hasActiveSession) {
        hideSplashScreen();
      }
      return;
    }
    if (activeTool !== 'select') {
      document.getElementById('toolSelect')?.click();
    }
    resetPolygonDraft();
    arcSteps = [];
    closePopup();
    closeContextMenu();
    closeAllMenus();
    closeSaveModal();
  }
});

// Info Modal
btnInfoClose.addEventListener('click', () => { infoModal.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.style.display = 'none'; });

// Chart Tabs
tabTemp.addEventListener('click', () => {
  tabTemp.classList.add('active');
  tabPV.classList.remove('active');
  tempChart.setMode('temp');
});
tabPV.addEventListener('click', () => {
  tabPV.classList.add('active');
  tabTemp.classList.remove('active');
  tempChart.setMode('pv');
});

// System Stats
function updateSystemStats() {
  const stats = engine.stats;
  if (statN) statN.textContent = stats.particleCount;
  if (statT) statT.textContent = `${Math.round(stats.systemTemperature)} K`;
  if (statE) statE.textContent = `${(stats.totalKineticEnergy / 1000).toFixed(1)} kJ`;
  if (statV) statV.textContent = `${Math.round(stats.meanSpeed)} px/s`;
}

// Chamber Cards (DOM Reuse / Zero-Thrashing)
let lastSensorSignature = '';

function updateChamberCards() {
  if (!chamberCardsContainer) return;
  const sensors = engine.sensors;
  if (sensors.length === 0) {
    if (lastSensorSignature !== 'empty') {
      chamberCardsContainer.innerHTML = '<p class="empty-cell" style="padding:10px 0;">No measurement zones placed</p>';
      lastSensorSignature = 'empty';
    }
    return;
  }

  const currentSignature = sensors.map(s => `${s.id}_${s.label}`).join('|');
  const dotClasses = ['blue', 'red', 'green', 'amber'];

  if (lastSensorSignature !== currentSignature) {
    let html = '';
    for (let i = 0; i < sensors.length; i++) {
      const s = sensors[i];
      const dot = dotClasses[i % dotClasses.length];
      const isOpen = openChamberCardIds.has(s.id);
      html += `
        <div class="chamber-card-item ${isOpen ? 'open' : ''}" data-sensorid="${s.id}" id="card_${s.id}">
          <div class="chamber-card-header" data-toggle="${s.id}">
            <div class="chamber-card-title">
              <span class="dot-indicator ${dot}"></span>
              <span>${s.label}</span>
            </div>
            <span class="chamber-badge" id="badge_${s.id}">-</span>
          </div>
          <div class="chamber-card-body">
            <div class="chamber-inline-metrics" id="metrics_${s.id}">
              <span>T: <b class="val-t">-</b></span>
              <span>p: <b class="val-p">-</b></span>
              <span>N: <b class="val-n">-</b></span>
              <span>Drift: <b class="val-drift">-</b></span>
            </div>
            <canvas class="chamber-chart-canvas" id="chart_${s.id}" width="320" height="60"></canvas>
          </div>
        </div>
      `;
    }
    chamberCardsContainer.innerHTML = html;

    chamberCardsContainer.querySelectorAll('[data-toggle]').forEach(header => {
      header.addEventListener('click', () => {
        const id = header.dataset.toggle;
        if (openChamberCardIds.has(id)) openChamberCardIds.delete(id);
        else openChamberCardIds.add(id);
        const card = document.getElementById(`card_${id}`);
        if (card) card.classList.toggle('open', openChamberCardIds.has(id));
      });
    });

    lastSensorSignature = currentSignature;
  }

  // Update in-place metrics
  for (let i = 0; i < sensors.length; i++) {
    const s = sensors[i];
    const pFormatted = s.pressure >= 1000 ? `${(s.pressure / 1000).toFixed(1)} kPa` : `${s.pressure.toFixed(0)} Pa`;
    const hasDrift = s.displayDriftSpeed && s.displayDriftSpeed > 0;
    const driftAngleDeg = hasDrift ? Math.round((s.driftAngle * 180) / Math.PI) : 0;
    const driftText = hasDrift ? `${s.displayDriftSpeed.toFixed(1)} px/s (${driftAngleDeg}°)` : '0.0 (Equilibrium)';

    const badge = document.getElementById(`badge_${s.id}`);
    if (badge) badge.textContent = `${Math.round(s.temperature)} K | ${s.particleCount} N`;

    const metrics = document.getElementById(`metrics_${s.id}`);
    if (metrics) {
      const elT = metrics.querySelector('.val-t');
      if (elT) elT.textContent = `${Math.round(s.temperature)} K`;
      const elP = metrics.querySelector('.val-p');
      if (elP) elP.textContent = pFormatted;
      const elN = metrics.querySelector('.val-n');
      if (elN) elN.textContent = s.particleCount;
      const elDrift = metrics.querySelector('.val-drift');
      if (elDrift) {
        elDrift.textContent = driftText;
        elDrift.style.color = hasDrift ? '#22c55e' : 'var(--text-dim)';
      }
    }

    if (openChamberCardIds.has(s.id)) {
      const cCanvas = document.getElementById(`chart_${s.id}`);
      if (cCanvas) ChamberChart.render(cCanvas, s, 'temp');
    }
  }
}

// Live Previews
function renderLiveToolPreviews() {
  const ctx = renderer.ctx;
  ctx.save();
  ctx.translate(renderer.panX, renderer.panY);
  ctx.scale(renderer.zoom, renderer.zoom);

  // Polygon Line Preview
  if (!isSimulating && activeTool === 'wall' && toolConfigs.wall.shape === 'polygon' && polygonPoints.length > 0 && currentCursorWorld) {
    const last = polygonPoints[polygonPoints.length - 1];
    const p0 = polygonPoints[0];
    const closeDist = 18 / renderer.zoom;
    const isNearStart = polygonPoints.length >= 2 && (
      Math.hypot(currentCursorWorld.x - p0.x, currentCursorWorld.y - p0.y) < closeDist ||
      (renderer.snapCursor && renderer.snapCursor.x === p0.x && renderer.snapCursor.y === p0.y)
    );

    const targetX = isNearStart ? p0.x : currentCursorWorld.x;
    const targetY = isNearStart ? p0.y : currentCursorWorld.y;

    // Draw dashed connecting line
    ctx.save();
    ctx.strokeStyle = isNearStart ? '#38bdf8' : '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Draw vertex markers for placed points
    for (let i = 0; i < polygonPoints.length; i++) {
      const pt = polygonPoints[i];
      const isStart = (i === 0);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isStart ? 6 / renderer.zoom : 4 / renderer.zoom, 0, Math.PI * 2);
      ctx.fillStyle = isStart ? (isNearStart ? '#38bdf8' : '#eab308') : '#22c55e';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 / renderer.zoom;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // Highlight start node when hovering to close
    if (isNearStart) {
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, 11 / renderer.zoom, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5 / renderer.zoom;
      ctx.setLineDash([]);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${Math.max(11, 13 / renderer.zoom)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Click to close', p0.x, p0.y - (14 / renderer.zoom));
    }

    ctx.restore();
  }

  // Arc Preview
  if (!isSimulating && activeTool === 'wall' && toolConfigs.wall.shape === 'arc' && arcSteps.length > 0 && currentCursorWorld) {
    const c = arcSteps[0];
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    if (arcSteps.length === 1) {
      const r = Math.hypot(currentCursorWorld.x - c.x, currentCursorWorld.y - c.y);
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
    } else if (arcSteps.length === 2) {
      const p1 = arcSteps[1];
      const r = Math.hypot(p1.x - c.x, p1.y - c.y);
      const a1 = Math.atan2(p1.y - c.y, p1.x - c.x);
      const a2 = Math.atan2(currentCursorWorld.y - c.y, currentCursorWorld.x - c.x);
      ctx.beginPath(); ctx.arc(c.x, c.y, r, a1, a2); ctx.stroke();
    }
  }

  ctx.restore();
}

// ============================================================================
// Custom Multi-Chart Dashboard Management
// ============================================================================
let customChartCounter = 1;

function openCustomChartModal() {
  if (!selectChartTarget) return;
  selectChartTarget.innerHTML = `
    <option value="global">Global System</option>
    ${engine.sensors.map(s => `<option value="${s.id}">${s.label || 'Chamber'}</option>`).join('')}
  `;
  chartModal.style.display = 'flex';
}

function closeCustomChartModal() {
  if (chartModal) chartModal.style.display = 'none';
}

function addCustomChart(targetVal, metricVal) {
  if (!customChartsContainer) return;
  const chartId = `custom_chart_${customChartCounter++}`;
  const targetObj = targetVal === 'global' ? 'global' : (engine.sensors.find(s => s.id === targetVal) || 'global');

  const card = document.createElement('div');
  card.className = 'custom-chart-card';
  card.id = `card_${chartId}`;

  const chartObj = new DashboardChart(chartId, targetObj, metricVal, null);

  card.innerHTML = `
    <div class="custom-chart-header">
      <div class="custom-chart-title">
        <span class="custom-chart-icon">📈</span>
        <span>${chartObj.getTitle()}</span>
      </div>
      <button class="custom-chart-close-btn" data-remove="${chartId}" title="Remove Chart">✕</button>
    </div>
    <canvas class="custom-chart-canvas" id="canvas_${chartId}" width="310" height="95"></canvas>
  `;

  customChartsContainer.appendChild(card);
  const chartCanvas = document.getElementById(`canvas_${chartId}`);
  chartObj.canvas = chartCanvas;
  chartObj.ctx = chartCanvas.getContext('2d');

  customCharts.push(chartObj);

  card.querySelector(`[data-remove="${chartId}"]`)?.addEventListener('click', () => {
    const idx = customCharts.findIndex(c => c.id === chartId);
    if (idx !== -1) customCharts.splice(idx, 1);
    card.remove();
  });

  chartObj.render(engine);
}

btnAddCustomChart?.addEventListener('click', openCustomChartModal);
btnChartModalClose?.addEventListener('click', closeCustomChartModal);
btnChartCancel?.addEventListener('click', closeCustomChartModal);
btnChartConfirm?.addEventListener('click', () => {
  const targetVal = selectChartTarget ? selectChartTarget.value : 'global';
  const metricVal = selectChartMetric ? selectChartMetric.value : 'temp';
  addCustomChart(targetVal, metricVal);
  closeCustomChartModal();
});
window.addEventListener('click', (e) => {
  if (e.target === chartModal) closeCustomChartModal();
});

// ============================================================================
// Splash Screen / Welcome Dashboard Controller
// ============================================================================
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'recently';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getRecentProfiles() {
  try {
    const raw = localStorage.getItem('thermo_recent_profiles');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function addRecentProfile(name, stateData) {
  try {
    let list = getRecentProfiles();
    const particleCount = stateData.particles ? stateData.particles.length : (stateData.gasRasters ? stateData.gasRasters.reduce((s, r) => s + (r.count || 0), 0) : 0);
    const elementCount = (stateData.walls?.length || 0) +
      (stateData.pistons?.length || 0) +
      (stateData.reservoirs?.length || 0) +
      (stateData.emitters?.length || 0) +
      (stateData.sinks?.length || 0) +
      (stateData.thermalBlocks?.length || 0) +
      (stateData.heatExchangers?.length || 0) +
      (stateData.regenerators?.length || 0) +
      (stateData.sensors?.length || 0) +
      (stateData.throttleValves?.length || 0);

    const cleanName = (name || 'Untitled Simulation').trim();
    list = list.filter(item => item.name !== cleanName);
    list.unshift({
      id: 'rec_' + Date.now(),
      name: cleanName,
      timestamp: Date.now(),
      particleCount,
      elementCount,
      data: stateData
    });
    if (list.length > 8) list = list.slice(0, 8);
    localStorage.setItem('thermo_recent_profiles', JSON.stringify(list));
    renderRecentProfiles();
  } catch (err) {
    console.warn('Failed to save recent profile:', err);
  }
}

function clearRecentProfiles() {
  localStorage.removeItem('thermo_recent_profiles');
  renderRecentProfiles();
}

function renderRecentProfiles() {
  if (!splashRecentContainer) return;
  const list = getRecentProfiles();
  if (list.length === 0) {
    splashRecentContainer.innerHTML = `
      <div class="splash-empty-state">
        <p>No recent profiles yet</p>
        <span>Profiles you save or open will appear here</span>
      </div>
    `;
    return;
  }

  splashRecentContainer.innerHTML = '';
  list.forEach(item => {
    const el = document.createElement('div');
    el.className = 'splash-recent-item';
    el.innerHTML = `
      <div class="splash-recent-left">
        <span class="splash-recent-name">${item.name}</span>
        <div class="splash-recent-meta">
          <span class="splash-recent-badge">${item.particleCount || 0} particles</span>
          <span class="splash-recent-badge">${item.elementCount || 0} elements</span>
          <span>${formatTimeAgo(item.timestamp)}</span>
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    `;
    el.addEventListener('click', () => {
      loadProfileData(item.name, item.data);
    });
    splashRecentContainer.appendChild(el);
  });
}

function renderSplashPresets() {
  if (!splashPresetsContainer) return;
  const presetsObj = window.Presets || Presets || {};
  const keys = Object.keys(presetsObj);
  if (keys.length === 0) {
    splashPresetsContainer.innerHTML = '<div class="splash-empty-state"><p>No presets available</p></div>';
    return;
  }

  splashPresetsContainer.innerHTML = '';
  keys.forEach(key => {
    const p = presetsObj[key];
    const card = document.createElement('div');
    card.className = 'splash-preset-card';
    card.innerHTML = `
      <div class="splash-preset-info">
        <div class="splash-preset-top">
          <span class="splash-preset-name">${p.name}</span>
          <span class="splash-preset-badge">${p.category || 'Thermodynamics'}</span>
        </div>
        <p class="splash-preset-desc">${p.description}</p>
      </div>
      <div class="splash-preset-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `;
    card.addEventListener('click', () => {
      stopAndResetSimulationForNewScene();
      p.load(engine);
      currentProjectName = p.name;
      headerProjectTitle.textContent = `${currentProjectName}.json`;
      const state = engine.exportState(p.name);
      engine.setLoadedProfile(state);
      addRecentProfile(p.name, state);
      updateElementsList();
      renderToolProperties(activeTool);
      updateModelToggleUI();
      updateGravityUI();
      sequencerUI?.render();
      hasActiveSession = true;
      hideSplashScreen();
    });
    splashPresetsContainer.appendChild(card);
  });
}

function loadProfileData(name, data) {
  stopAndResetSimulationForNewScene();
  currentProjectName = name;
  headerProjectTitle.textContent = `${name}.json`;
  engine.setLoadedProfile(data);
  updateElementsList();
  renderToolProperties(activeTool);
  updateModelToggleUI();
  updateGravityUI();
  sequencerUI?.render();
  hasActiveSession = true;
  hideSplashScreen();
}

function setupAmbientScene() {
  engine.clear();
  engine.timeScale = 1.0;
  engine.isPaused = false;
  isAmbientSim = true;
  
  // Calculate world area corresponding to current viewport
  const tl = renderer.screenToWorld ? renderer.screenToWorld(0, 0) : { x: -400, y: -250 };
  const br = renderer.screenToWorld ? renderer.screenToWorld(canvas.width || window.innerWidth || 1400, canvas.height || window.innerHeight || 900) : { x: 1400, y: 850 };
  
  const spanX = Math.max(800, br.x - tl.x);
  const spanY = Math.max(500, br.y - tl.y);
  
  // Vibrant ambient particle cloud drifting freely across the whole screen - NO walls/box borders!
  engine.spawnGasRaster(tl.x + 20, tl.y + 20, spanX - 40, spanY - 40, 220, 1.2, 440, 'maxwell_boltzmann');
  
  // Clear element & group tracking so ambient background has 0 elements
  engine.particleGroups = [];
  engine.elements = [];
  
  // Soft Brownian colloidal particles drifting around
  for (let i = 0; i < 6; i++) {
    const px = tl.x + spanX * (0.12 + 0.15 * i);
    const py = tl.y + spanY * (0.18 + 0.14 * (i % 5));
    const vx = (Math.random() - 0.5) * 55;
    const vy = (Math.random() - 0.5) * 55;
    const col = engine.addParticle(px, py, vx, vy, 8.0 + (i % 3) * 3.5);
    col.tag = 'colloid';
  }
}

function showSplashScreen(options = {}) {
  isSplashActive = true;
  document.body.classList.add('splash-mode');
  if (splashOverlay) {
    splashOverlay.classList.remove('hidden');
    splashOverlay.style.display = 'flex';
  }
  
  const isReturning = options.isReturning || hasActiveSession;
  if (btnSplashResume) {
    btnSplashResume.style.display = isReturning ? 'flex' : 'none';
  }
  if (btnSplashClose) {
    btnSplashClose.style.display = isReturning ? 'flex' : 'none';
  }
  
  renderRecentProfiles();
  renderSplashPresets();
}

function hideSplashScreen() {
  isSplashActive = false;
  isAmbientSim = false;
  hasActiveSession = true;
  document.body.classList.remove('splash-mode');
  if (splashOverlay) {
    splashOverlay.classList.add('hidden');
    splashOverlay.style.display = 'none';
  }
}

// Splash Screen Action Event Listeners
btnSplashNew?.addEventListener('click', () => {
  stopAndResetSimulationForNewScene();
  engine.clear();
  engine.gravityEnabled = false;
  
  currentProjectName = 'Untitled Simulation';
  headerProjectTitle.textContent = 'Untitled Simulation.json';
  const state = engine.exportState('Untitled Simulation');
  engine.setLoadedProfile(state);
  updateElementsList();
  renderToolProperties(activeTool);
  updateModelToggleUI();
  updateGravityUI();
  sequencerUI?.render();
  hideSplashScreen();
});

btnSplashOpen?.addEventListener('click', () => {
  fileImportInput.click();
});

btnSplashResume?.addEventListener('click', () => {
  hideSplashScreen();
});

btnSplashClose?.addEventListener('click', () => {
  hideSplashScreen();
});

brandBadge?.addEventListener('click', () => {
  showSplashScreen({ isReturning: hasActiveSession });
});

brandTitle?.addEventListener('click', () => {
  showSplashScreen({ isReturning: hasActiveSession });
});

btnClearRecent?.addEventListener('click', (e) => {
  e.stopPropagation();
  clearRecentProfiles();
});

splashOverlay?.addEventListener('click', (e) => {
  if (e.target === splashOverlay && hasActiveSession) {
    hideSplashScreen();
  }
});

// App Startup: Launch in Ambient Splash Mode
setupAmbientScene();
showSplashScreen({ isReturning: false });
updateViewMenuLabels();
const defaultToolBtn = document.getElementById('toolSelect');
if (defaultToolBtn) selectToolButton(defaultToolBtn);
else renderToolProperties(activeTool);
updateElementsList();

// Master Animation Loop
let lastTime = performance.now();
let historyTimer = 0;
let telemetryTimer = 0;
let chartTimer = 0;

function animate(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if ((!engine.isPaused && isSimulating) || (isSplashActive && isAmbientSim)) {
    if (isSimulating) {
      historyTimer += dt;
      if (historyTimer >= 0.05) {
        pushHistoryFrame();
        historyTimer = 0;
      }
    }
    engine.step(dt);

    if (isSplashActive && isAmbientSim) {
      // Keep ambient particles floating seamlessly within visible screen area without needing walls
      const tl = renderer.screenToWorld(0, 0);
      const br = renderer.screenToWorld(canvas.width, canvas.height);
      const pad = 50;
      const minX = tl.x - pad, maxX = br.x + pad;
      const minY = tl.y - pad, maxY = br.y + pad;

      for (let i = 0; i < engine.particles.length; i++) {
        const p = engine.particles[i];
        if (p.pos.x < minX) {
          p.pos.x = minX;
          p.vel.x = Math.abs(p.vel.x);
        } else if (p.pos.x > maxX) {
          p.pos.x = maxX;
          p.vel.x = -Math.abs(p.vel.x);
        }
        if (p.pos.y < minY) {
          p.pos.y = minY;
          p.vel.y = Math.abs(p.vel.y);
        } else if (p.pos.y > maxY) {
          p.pos.y = maxY;
          p.vel.y = -Math.abs(p.vel.y);
        }
      }
    }
  }

  renderer.render(engine, selectedItems);
  renderLiveToolPreviews();
  sequencerUI?.updateLive();

  // Throttled Chart Updates (~15 Hz) to keep UI and Render loop at max FPS
  chartTimer += dt;
  if (chartTimer >= 0.066) {
    tempChart.render(engine);
    velChart.render(engine);

    for (let i = 0; i < customCharts.length; i++) {
      customCharts[i].render(engine);
    }
    chartTimer = 0;
  }

  timeVal.textContent = `${engine.totalTime.toFixed(2)} s`;
  updateSystemStats();

  telemetryTimer += dt;
  if (telemetryTimer >= 0.15) {
    updateChamberCards();
    telemetryTimer = 0;
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
