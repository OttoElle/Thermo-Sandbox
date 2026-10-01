// Menu bar (File/Edit/View/Simulation/Help), scene loading/saving and the Save As dialog.
import { bgCanvas, btnPlayPause, btnSaveCancel, btnSaveClose, btnSaveDownload, btnStep, btnStepBack, btnStopReset, btnToggleColor, btnToggleGravity, btnToggleGrid, btnToggleSnap, btnToggleVectors, btnToolbarClear, btnToolbarReset, btnZoomIn, btnZoomOut, canvas, ctxDuplicate, fileImportInput, gpuCanvas, headerProjectTitle, infoModal, modelToggleBtns, playIcon, saveFilenamePreview, saveModal, saveProjectNameInput, selectGridSize, timeVal } from './dom.js';
import { engine, renderer, sequencerUI } from './core.js';
import { app, pointer, resetPolygonDraft } from './state.js';
import { clearHistoryBuffer, performRedo, performUndo, recordUndoState, redoStack, undoStack } from './history.js';
import { renderToolProperties } from './toolPanel.js';
import { updateElementsList } from './elementTree.js';
import { fitViewToScene, getVisibleCanvasRect, updateGravityUI, updateModelToggleUI } from './playback.js';
import { closeContextMenu } from './canvasInput.js';
import { canGroupSelection, canUngroupSelection, deleteSelectedItems, groupSelection, ungroupSelection } from './selection.js';
import { addRecentProfile, hideSplashScreen, showSplashScreen } from './splash.js';

// ============================================================================
// Desktop Menu Bar Logic
// ============================================================================
const menuItems = document.querySelectorAll('.menu-item');
let isAnyMenuOpen = false;

export function closeAllMenus() {
  menuItems.forEach(item => item.classList.remove('open'));
  isAnyMenuOpen = false;
}

function openMenu(item) {
  closeAllMenus();
  refreshMenuState();
  item.classList.add('open');
  isAnyMenuOpen = true;
}

menuItems.forEach(item => {
  const btn = item.querySelector('.menu-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (item.classList.contains('open')) closeAllMenus();
    else openMenu(item);
  });

  item.addEventListener('mouseenter', () => {
    if (isAnyMenuOpen && !item.classList.contains('open')) openMenu(item);
  });
});

window.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-item')) {
    closeAllMenus();
  }
});

// Registers a menu entry: closes the menu and runs the action unless disabled.
function onMenu(id, action) {
  const el = document.getElementById(id);
  el?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (el.classList.contains('disabled')) return;
    closeAllMenus();
    action();
  });
}

function setEntry(id, { enabled = true, checked } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('disabled', !enabled);
  if (checked !== undefined) el.classList.toggle('checked', !!checked);
}

// Enabled/checked state of all entries, evaluated whenever a menu opens.
function refreshMenuState() {
  const editing = !app.isSimulating;
  const hasSel = editing && app.selectedItems.length > 0;

  setEntry('menuEntryClear', { enabled: editing });
  setEntry('menuEntryUndo', { enabled: editing && undoStack.length > 0 });
  setEntry('menuEntryRedo', { enabled: editing && redoStack.length > 0 });
  setEntry('menuEntrySelectAll', { enabled: editing && engine.elements.length > 0 });
  setEntry('menuEntryDuplicate', { enabled: hasSel });
  setEntry('menuEntryGroup', { enabled: editing && canGroupSelection() });
  setEntry('menuEntryUngroup', { enabled: editing && canUngroupSelection() });
  setEntry('menuEntryRotate', { enabled: hasSel });
  setEntry('menuEntryFlipH', { enabled: hasSel });
  setEntry('menuEntryFlipV', { enabled: hasSel });
  setEntry('menuEntryDelete', { enabled: hasSel });

  setEntry('menuEntryToggleGrid', { checked: renderer.showGrid });
  setEntry('menuEntryGrid10', { checked: renderer.gridSize === 10 });
  setEntry('menuEntryGrid20', { checked: renderer.gridSize === 20 });
  setEntry('menuEntryGrid40', { checked: renderer.gridSize === 40 });
  setEntry('menuEntryToggleSnap', { checked: renderer.snapToGrid });
  setEntry('menuEntryToggleVectors', { checked: renderer.showVectors });
  setEntry('menuEntryToggleColor', { checked: renderer.colorByVelocity });

  const labelPlay = document.getElementById('labelMenuPlay');
  if (labelPlay) labelPlay.textContent = (app.isSimulating && !engine.isPaused) ? 'Pause' : 'Play';
  setEntry('menuEntryStepBack', { enabled: app.isSimulating });
  setEntry('menuEntryStop', { enabled: app.isSimulating });
  const model = engine.simModel || 'hard_sphere';
  setEntry('menuEntryModelIdeal', { checked: model === 'hard_sphere' });
  setEntry('menuEntryModelReal', { checked: model === 'lennard_jones' });
  setEntry('menuEntryGravity', { checked: engine.gravityEnabled });
  setEntry('menuEntrySequencer', { checked: document.body.classList.contains('sequencer-expanded') });
}

// ============================================================================
// Scene Lifecycle: open, new, revert, save
// ============================================================================
const PLAY_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';

function setProjectName(name) {
  app.currentProjectName = name;
  headerProjectTitle.textContent = `${name}.json`;
}

function refreshSceneUI() {
  closeContextMenu();
  updateElementsList();
  renderToolProperties(app.activeTool);
  updateModelToggleUI();
  updateGravityUI();
  sequencerUI?.render();
}

export function stopAndResetSimulationForNewScene() {
  app.isSimulating = false;
  engine.isPaused = true;
  app.isAmbientSim = false;

  document.querySelector('.ribbon-row-construction')?.classList.remove('simulating-locked');
  btnToolbarClear?.removeAttribute('disabled');

  playIcon.classList.add('is-play');
  playIcon.innerHTML = PLAY_ICON;

  engine.totalTime = 0;
  timeVal.textContent = '0.00 s';
  clearHistoryBuffer();
  undoStack.length = 0;
  redoStack.length = 0;
  app.selectedItems = [];
  resetPolygonDraft();
  pointer.arcSteps = [];
  closeContextMenu();
}

// Loads a scene state as the new document (presets, recent profiles, files).
export function openScene(name, data, { addToRecent = true } = {}) {
  stopAndResetSimulationForNewScene();
  data.profileName = name;
  setProjectName(name);
  engine.setLoadedProfile(data);
  refreshSceneUI();
  if (addToRecent) addRecentProfile(name, data);
  app.hasActiveSession = true;
  hideSplashScreen();
  fitViewToScene();
}

function stopSimulationIfRunning() {
  if (app.isSimulating) btnStopReset.click();
}

// Back to the last opened/saved state. Undoable.
function revertToSaved() {
  stopSimulationIfRunning();
  recordUndoState();
  engine.resetToLoadedProfile();
  if (engine.currentProfileName) setProjectName(engine.currentProfileName);
  app.selectedItems = [];
  resetPolygonDraft();
  pointer.arcSteps = [];
  clearHistoryBuffer();
  timeVal.textContent = '0.00 s';
  refreshSceneUI();
}

// Empty canvas as a new untitled document. Undoable (restores the elements).
function newCanvas() {
  if (app.isSimulating) return;
  recordUndoState();
  engine.clear();
  resetPolygonDraft();
  pointer.arcSteps = [];
  app.selectedItems = [];
  clearHistoryBuffer();
  setProjectName('Untitled Simulation');
  engine.currentProfileName = app.currentProjectName;
  engine.loadedProfileJSON = JSON.stringify(engine.exportState(app.currentProjectName));
  refreshSceneUI();
}

// The design as built: while simulating that is the state at play time.
function getSaveState(name) {
  const state = (app.isSimulating && engine.simStartSnapshot)
    ? JSON.parse(engine.simStartSnapshot)
    : engine.exportState(name);
  state.profileName = name;
  return state;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

const safeFileName = (name) => name.replace(/[^a-zA-Z0-9_-]/g, '_');

export function saveProject(name = app.currentProjectName) {
  setProjectName(name);
  const state = getSaveState(name);
  engine.currentProfileName = name;
  engine.loadedProfileJSON = JSON.stringify(state);
  addRecentProfile(name, state);
  downloadBlob(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), `${safeFileName(name)}.json`);
}

// PNG of the visible canvas area (background, particles and geometry layers).
export function exportCanvasPNG() {
  const rect = getVisibleCanvasRect();
  const w = Math.round(rect.right - rect.left);
  const h = Math.round(rect.bottom - rect.top);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-app').trim() || '#101216';
  ctx.fillRect(0, 0, w, h);
  // Re-render first so the WebGPU canvas still holds this frame's image.
  renderer.render(engine, app.selectedItems, !app.isSimulating);
  for (const layer of [bgCanvas, gpuCanvas, canvas]) {
    if (layer) ctx.drawImage(layer, rect.left, rect.top, w, h, 0, 0, w, h);
  }
  out.toBlob(blob => { if (blob) downloadBlob(blob, `${safeFileName(app.currentProjectName)}.png`); }, 'image/png');
}

// File Menu
onMenu('menuEntryClear', newCanvas);
onMenu('menuEntryImport', () => fileImportInput.click());
onMenu('menuEntryWelcome', () => showSplashScreen({ isReturning: true }));
onMenu('menuEntrySave', () => saveProject());
onMenu('menuEntrySaveAs', openSaveModal);
onMenu('menuEntryExportPNG', exportCanvasPNG);
onMenu('menuEntryReset', revertToSaved);

btnToolbarReset.addEventListener('click', revertToSaved);
btnToolbarClear.addEventListener('click', newCanvas);

// Edit Menu
export function selectAllElements() {
  if (app.isSimulating) return;
  app.selectedItems = [...engine.elements];
  updateElementsList();
}

onMenu('menuEntryUndo', performUndo);
onMenu('menuEntryRedo', performRedo);
onMenu('menuEntrySelectAll', selectAllElements);
onMenu('menuEntryDuplicate', () => ctxDuplicate.click());
onMenu('menuEntryGroup', groupSelection);
onMenu('menuEntryUngroup', ungroupSelection);
onMenu('menuEntryRotate', () => document.getElementById('btnRotate90')?.click());
onMenu('menuEntryFlipH', () => document.getElementById('btnFlipH')?.click());
onMenu('menuEntryFlipV', () => document.getElementById('btnFlipV')?.click());
onMenu('menuEntryDelete', deleteSelectedItems);

// View Menu + ribbon toggles (both sync through updateViewMenuLabels)
export function updateViewMenuLabels() {
  btnToggleGrid.classList.toggle('active', renderer.showGrid);
  btnToggleSnap.classList.toggle('active', renderer.snapToGrid);
  btnToggleVectors.classList.toggle('active', renderer.showVectors);
  btnToggleColor?.classList.toggle('active', renderer.colorByVelocity);
  selectGridSize.value = String(renderer.gridSize);

  const floatingVelLegend = document.getElementById('floatingVelLegend');
  if (floatingVelLegend) {
    floatingVelLegend.style.display = renderer.colorByVelocity ? 'flex' : 'none';
  }
}

export function toggleVectors() {
  renderer.showVectors = !renderer.showVectors;
  updateViewMenuLabels();
}

function toggleGrid() { renderer.showGrid = !renderer.showGrid; updateViewMenuLabels(); }
function toggleSnap() { renderer.snapToGrid = !renderer.snapToGrid; updateViewMenuLabels(); }
function toggleColor() { renderer.colorByVelocity = !renderer.colorByVelocity; updateViewMenuLabels(); }
function setGridSize(size) { renderer.gridSize = size; updateViewMenuLabels(); }

onMenu('menuEntryToggleGrid', toggleGrid);
onMenu('menuEntryGrid10', () => setGridSize(10));
onMenu('menuEntryGrid20', () => setGridSize(20));
onMenu('menuEntryGrid40', () => setGridSize(40));
onMenu('menuEntryToggleSnap', toggleSnap);
onMenu('menuEntryToggleVectors', toggleVectors);
onMenu('menuEntryToggleColor', toggleColor);
onMenu('menuEntryZoomIn', () => btnZoomIn.click());
onMenu('menuEntryZoomOut', () => btnZoomOut.click());
onMenu('menuEntryResetView', fitViewToScene);

btnToggleGrid.addEventListener('click', toggleGrid);
btnToggleSnap.addEventListener('click', toggleSnap);
btnToggleVectors.addEventListener('click', toggleVectors);
btnToggleColor?.addEventListener('click', toggleColor);
selectGridSize.addEventListener('change', (e) => setGridSize(parseInt(e.target.value, 10)));

// Simulation Menu (delegates to the playback dock controls)
function selectModel(model) {
  [...modelToggleBtns].find(b => b.dataset.model === model)?.click();
}

onMenu('menuEntryPlay', () => btnPlayPause.click());
onMenu('menuEntryStep', () => btnStep.click());
onMenu('menuEntryStepBack', () => btnStepBack.click());
onMenu('menuEntryStop', () => btnStopReset.click());
onMenu('menuEntryModelIdeal', () => selectModel('hard_sphere'));
onMenu('menuEntryModelReal', () => selectModel('lennard_jones'));
onMenu('menuEntryGravity', () => btnToggleGravity?.click());
onMenu('menuEntrySequencer', () => document.getElementById('btnToggleSequencer')?.click());

// Help Menu
export function openShortcutsModal() {
  const modal = document.getElementById('shortcutsModal');
  if (modal) modal.style.display = 'flex';
}

onMenu('menuEntryGuide', () => { infoModal.style.display = 'flex'; });
onMenu('menuEntryShortcuts', openShortcutsModal);

// ============================================================================
// Save Project As Dialog Workflow
// ============================================================================
function updateSaveFilePreview() {
  const name = saveProjectNameInput.value.trim() || 'Project';
  saveFilenamePreview.textContent = `${safeFileName(name)}.json`;
}

export function openSaveModal() {
  saveProjectNameInput.value = app.currentProjectName;
  updateSaveFilePreview();
  saveModal.style.display = 'flex';
  setTimeout(() => saveProjectNameInput.select(), 50);
}

export function closeSaveModal() {
  saveModal.style.display = 'none';
}

saveProjectNameInput.addEventListener('input', updateSaveFilePreview);
saveProjectNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnSaveDownload.click();
});
btnSaveClose.addEventListener('click', closeSaveModal);
btnSaveCancel.addEventListener('click', closeSaveModal);
window.addEventListener('click', (e) => { if (e.target === saveModal) closeSaveModal(); });

btnSaveDownload.addEventListener('click', () => {
  saveProject(saveProjectNameInput.value.trim() || 'Project');
  closeSaveModal();
});

fileImportInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      openScene(data.profileName || file.name.replace(/\.json$/i, ''), data);
    } catch (err) {
      console.warn('Import failed:', err);
      alert('Invalid JSON configuration file.');
    }
  };
  reader.readAsText(file);
  fileImportInput.value = '';
});
