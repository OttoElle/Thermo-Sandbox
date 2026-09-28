// Playback controls, physics model/gravity toggles and zoom.
import { btnPlayPause, btnResetView, btnStep, btnStepBack, btnStopReset, btnToggleGravity, btnZoomIn, btnZoomOut, canvas, modelToggleBtns, playIcon, speedSlider, speedVal, timeVal, toolDialogPanel, zoomDisplay } from './dom.js';
import { engine, renderer } from './core.js';
import { app, pointer, resetPolygonDraft } from './state.js';
import { clearHistoryBuffer, popHistoryFrame, pushHistoryFrame } from './history.js';
import { renderToolProperties, ribbonToolBtns } from './toolPanel.js';
import { updateElementsList } from './elementTree.js';
import { closeContextMenu } from './canvasInput.js';
import { closePopup, updatePopupPosition } from './popup.js';

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

export function updateModelToggleUI() {
  modelToggleBtns.forEach(btn => {
    if (btn.dataset.model === (engine.simModel || 'hard_sphere')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

export function updateGravityUI() {
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
  if (!app.isSimulating) {
    engine.saveSimStartSnapshot();
    app.isSimulating = true;
    engine.syncParticlesToGPU();
    engine.syncWallsToGPU();
    document.querySelector('.ribbon-row-construction')?.classList.add('simulating-locked');
    document.getElementById('btnToolbarClear')?.setAttribute('disabled', 'true');
    app.activeTool = 'select';
    ribbonToolBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('toolSelect')?.classList.add('active');
    if (toolDialogPanel) toolDialogPanel.style.display = 'none';
    app.selectedItems = [];
    resetPolygonDraft();
    pointer.arcSteps = [];
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
  if (!app.isSimulating) {
    engine.saveSimStartSnapshot();
    app.isSimulating = true;
    engine.syncParticlesToGPU();
    engine.syncWallsToGPU();
    document.querySelector('.ribbon-row-construction')?.classList.add('simulating-locked');
    document.getElementById('btnToolbarClear')?.setAttribute('disabled', 'true');
    app.activeTool = 'select';
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
  app.isSimulating = false;
  engine.isPaused = true;
  document.querySelector('.ribbon-row-construction')?.classList.remove('simulating-locked');
  document.getElementById('btnToolbarClear')?.removeAttribute('disabled');
  
  engine.restoreSimStartSnapshot();
  
  app.selectedItems = [];
  clearHistoryBuffer();
  
  playIcon.classList.add('is-play');
  playIcon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 19 12 6 20 6 4"/></svg>';
  
  closePopup();
  closeContextMenu();
  updateElementsList();
  renderToolProperties(app.activeTool);
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
export function updateZoomText() {
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
