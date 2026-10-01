// Ribbon tools, tool configurations and the floating tool properties dialog.
import { defaultValues, elementTypeOfTool } from '../model/elementSchema.js';
import { btnToolDialogClose, helpArrowIcon, toolDialogBadge, toolDialogHeader, toolDialogHelpPanel, toolDialogPanel, toolDialogTitle, toolPropertiesContainer } from './dom.js';
import { renderer } from './core.js';
import { app, pointer, resetPolygonDraft } from './state.js';
import { closeContextMenu } from './canvasInput.js';
import { renderPropertyForm } from './propertyForm.js';

// Tool defaults for new elements: the schema defaults plus the sub-mode chosen in the ribbon.
export const toolConfigs = {
  wall: { shape: 'polygon', ...defaultValues('wall', 'tool') },
  piston: { mode: 'free', amplitude: 50, ...defaultValues('piston', 'tool') },
  solid_res: defaultValues('reservoir', 'tool'),
  heat_exchanger: defaultValues('heat_exchanger', 'tool'),
  regenerator: { sliceCount: 10, ...defaultValues('regenerator', 'tool') },
  storage_block: defaultValues('thermal_block', 'tool'),
  valve: { ...defaultValues('relief_valve', 'tool'), ...defaultValues('check_valve', 'tool'), ...defaultValues('manual_valve', 'tool'), type: 'manual_valve' },
  throttle_valve: defaultValues('throttle_valve', 'tool'),
  gas: defaultValues('gas', 'tool'),
  regulator: defaultValues('regulator', 'tool'),
  emitter: defaultValues('emitter', 'tool'),
  sink: defaultValues('sink', 'tool'),
  sensor: defaultValues('sensor', 'tool'),
  text: defaultValues('text', 'tool')
};

// Options for new wall segments drawn with the wall tools.
export function wallOptions(extra = {}) {
  const c = toolConfigs.wall;
  return { thickness: c.thickness, conductivity: c.conductivity, temperature: c.temperature, heatCapacity: c.heatCapacity, ...extra };
}

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

const TOOL_TITLES = {
  select: 'Select', text: 'Text', solid_res: 'Heat Bath', heat_exchanger: 'Heat Exchanger', regenerator: 'Regenerator',
  storage_block: 'Thermal Mass', throttle_valve: 'Throttle', gas: 'Spawner', regulator: 'Regulator', emitter: 'Emitter',
  sink: 'Absorber', sensor: 'Sensor'
};
const WALL_TITLES = { polygon: 'Polyline', rect: 'Rectangle', circle: 'Circle', arc: 'Arc' };
const PISTON_TITLES = { free: 'Displacer', spring: 'Accumulator', motorized: 'Compressor', damper: 'Expander' };
const VALVE_TITLES = { manual_valve: 'Manual Valve', check_valve: 'Check Valve', relief_valve: 'Relief Valve' };
const TOOL_BADGES = {
  select: 'TOOLS', text: 'TOOLS', wall: 'WALLS', gas: 'PARTICLES', emitter: 'PARTICLES', sink: 'PARTICLES', regulator: 'PARTICLES',
  solid_res: 'THERMAL', heat_exchanger: 'THERMAL', regenerator: 'THERMAL', storage_block: 'THERMAL',
  piston: 'PISTONS', valve: 'VALVES', throttle_valve: 'VALVES', sensor: 'SENSORS'
};

function toolTitle(tool) {
  if (tool === 'wall') return WALL_TITLES[toolConfigs.wall.shape];
  if (tool === 'piston') return PISTON_TITLES[toolConfigs.piston.mode];
  if (tool === 'valve') return VALVE_TITLES[toolConfigs.valve.type];
  return TOOL_TITLES[tool] || 'Tool';
}

// Tool dialog: defaults for the next element drawn with the active tool.
// (Selected elements are edited in the properties panel, not here.)
export function renderToolProperties(tool) {
  if (!toolPropertiesContainer) return;
  if (toolDialogTitle) toolDialogTitle.textContent = toolTitle(tool);
  if (toolDialogBadge) toolDialogBadge.textContent = TOOL_BADGES[tool] || 'TOOL';
  if (toolDialogHelpPanel) toolDialogHelpPanel.textContent = toolHelpDescriptions[tool] || '';

  // Always reset description to collapsed when switching tools
  isToolHelpOpen = false;
  if (toolDialogHelpPanel) toolDialogHelpPanel.style.display = 'none';
  if (helpArrowIcon) helpArrowIcon.textContent = '▾';

  const type = elementTypeOfTool(tool, toolConfigs[tool]);
  if (app.isSimulating || tool === 'select' || !type) {
    if (toolDialogPanel) toolDialogPanel.style.display = 'none';
    toolPropertiesContainer.innerHTML = '';
    return;
  }

  if (toolDialogPanel) {
    toolDialogPanel.style.display = 'flex';
    toolDialogPanel.style.left = '350px';
    toolDialogPanel.style.top = '176px';
  }
  renderPropertyForm(toolPropertiesContainer, type, toolConfigs[tool], { context: 'tool' });
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
