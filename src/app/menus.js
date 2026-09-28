// Menu bar (File/Edit/View/Help) and the Save As dialog.
import { btnSaveCancel, btnSaveClose, btnSaveDownload, btnToggleColor, btnToggleGrid, btnToggleSnap, btnToggleVectors, btnToolbarClear, btnToolbarReset, canvas, ctxDuplicate, ctxGroup, fileImportInput, headerProjectTitle, infoModal, playIcon, saveFilenamePreview, saveModal, saveProjectNameInput, selectGridSize, timeVal } from './dom.js';
import { engine, renderer } from './core.js';
import { app, pointer, resetPolygonDraft } from './state.js';
import { clearHistoryBuffer, performRedo, performUndo, recordUndoState, redoStack, undoStack } from './history.js';
import { renderToolProperties } from './toolPanel.js';
import { updateElementsList } from './elementTree.js';
import { updateGravityUI, updateModelToggleUI, updateZoomText } from './playback.js';
import { closeContextMenu } from './canvasInput.js';
import { deleteSelectedItems } from './selection.js';
import { closePopup } from './popup.js';
import { addRecentProfile, hideSplashScreen } from './splash.js';

// ============================================================================
// Desktop Menu Bar Logic (File, Edit, View, Help)
// ============================================================================
const menuItems = document.querySelectorAll('.menu-item');
let isAnyMenuOpen = false;

export function closeAllMenus() {
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

export function stopAndResetSimulationForNewScene() {
  app.isSimulating = false;
  engine.isPaused = true;
  app.isAmbientSim = false;
  
  document.querySelector('.ribbon-row-construction')?.classList.remove('simulating-locked');
  document.getElementById('btnToolbarClear')?.removeAttribute('disabled');
  
  playIcon.classList.add('is-play');
  playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';
  
  engine.totalTime = 0;
  timeVal.textContent = '0.00 s';
  clearHistoryBuffer();
  undoStack.length = 0;
  redoStack.length = 0;
  app.selectedItems = [];
  resetPolygonDraft();
  pointer.arcSteps = [];
  closePopup();
  closeContextMenu();
}

function resetToLoadedProfile() {
  app.isSimulating = false;
  engine.isPaused = true;
  document.querySelector('.ribbon-row-construction')?.classList.remove('simulating-locked');
  document.getElementById('btnToolbarClear')?.removeAttribute('disabled');
  
  engine.resetToLoadedProfile();
  
  if (engine.currentProfileName) {
    app.currentProjectName = engine.currentProfileName;
    headerProjectTitle.textContent = `${app.currentProjectName}.json`;
  }
  
  app.selectedItems = [];
  resetPolygonDraft();
  pointer.arcSteps = [];
  clearHistoryBuffer();
  undoStack.length = 0;
  redoStack.length = 0;
  
  playIcon.classList.add('is-play');
  playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';
  
  closePopup();
  closeContextMenu();
  updateElementsList();
  renderToolProperties(app.activeTool);
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
  pointer.arcSteps = [];
  app.selectedItems = [];
  clearHistoryBuffer();
  closePopup();
  closeContextMenu();
  updateElementsList();
  renderToolProperties(app.activeTool);
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
export function updateViewMenuLabels() {
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
btnSaveClose.addEventListener('click', closeSaveModal);
btnSaveCancel.addEventListener('click', closeSaveModal);
window.addEventListener('click', (e) => { if (e.target === saveModal) closeSaveModal(); });

btnSaveDownload.addEventListener('click', () => {
  const chosenName = saveProjectNameInput.value.trim() || 'Project';
  app.currentProjectName = chosenName;
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
        app.currentProjectName = data.profileName;
      } else {
        app.currentProjectName = file.name.replace(/\.json$/i, '');
        data.profileName = app.currentProjectName;
      }
      headerProjectTitle.textContent = `${app.currentProjectName}.json`;
      engine.setLoadedProfile(data);
      updateElementsList();
      renderToolProperties(app.activeTool);
      updateModelToggleUI();
      updateGravityUI();
      addRecentProfile(app.currentProjectName, data);
      app.hasActiveSession = true;
      hideSplashScreen();
    } catch (err) {
      alert('Invalid JSON configuration file.');
    }
  };
  reader.readAsText(file);
  fileImportInput.value = '';
});
