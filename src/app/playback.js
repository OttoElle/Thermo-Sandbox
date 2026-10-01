// Playback controls, physics model/gravity toggles and zoom.
import { btnPlayPause, btnResetView, btnStep, btnStepBack, btnStopReset, btnToggleGravity, btnZoomIn, btnZoomOut, canvas, modelToggleBtns, playIcon, speedSlider, speedVal, timeVal, toolDialogPanel, zoomDisplay } from './dom.js';
import { engine, renderer } from './core.js';
import { app, pointer, resetPolygonDraft } from './state.js';
import { clearHistoryBuffer, popHistoryFrame, pushHistoryFrame } from './history.js';
import { renderToolProperties, ribbonToolBtns } from './toolPanel.js';
import { updateElementsList } from './elementTree.js';
import { closeContextMenu } from './canvasInput.js';

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
});
btnZoomOut.addEventListener('click', () => {
  renderer.zoomAt(canvas.width * 0.5, canvas.height * 0.5, 0.83);
  updateZoomText();
});
btnResetView.addEventListener('click', fitViewToScene);

// World-space bounding box of all scene elements and edit-time particles.
function getSceneBounds() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };
  for (const item of engine.elements) {
    if (item.p1 && item.p2) {
      add(item.p1.x, item.p1.y);
      add(item.p2.x, item.p2.y);
    } else if (typeof item.getBounds === 'function') {
      const b = item.getBounds();
      add(b.left, b.top);
      add(b.right, b.bottom);
    } else if (item.x !== undefined && item.width !== undefined) {
      add(item.x, item.y);
      add(item.x + item.width, item.y + item.height);
    }
    if (typeof item.getHandlePositions === 'function') {
      const h = item.getHandlePositions();
      add(h.minHandle.x, h.minHandle.y);
      add(h.maxHandle.x, h.maxHandle.y);
    }
  }
  for (const p of engine.particles) add(p.pos.x, p.pos.y);
  return minX <= maxX ? { minX, minY, maxX, maxY } : null;
}

// Screen rectangle not covered by the floating header, sidebars and dock.
// Uses offset* (layout) values so running CSS transitions don't skew it.
export function getVisibleCanvasRect() {
  let left = 0, top = 0, right = canvas.width, bottom = canvas.height;
  const header = document.querySelector('.floating-header');
  const sideL = document.getElementById('sidebarLeft');
  const sideR = document.querySelector('.floating-sidebar.floating-right');
  const dock = document.getElementById('unifiedBottomDock');
  if (header?.offsetWidth) top = header.offsetTop + header.offsetHeight;
  if (sideL?.offsetWidth) left = sideL.offsetLeft + sideL.offsetWidth;
  if (sideR?.offsetWidth) right = sideR.offsetLeft;
  if (dock?.offsetWidth) bottom = dock.offsetTop;
  if (right - left < 200 || bottom - top < 150) return { left: 0, top: 0, right: canvas.width, bottom: canvas.height };
  return { left, top, right, bottom };
}

// Zoom and pan so the whole scene fits into the visible canvas area.
export function fitViewToScene() {
  const view = getVisibleCanvasRect();
  const bounds = getSceneBounds();
  const margin = 40;
  const viewW = view.right - view.left - margin * 2;
  const viewH = view.bottom - view.top - margin * 2;
  const cx = (view.left + view.right) * 0.5;
  const cy = (view.top + view.bottom) * 0.5;
  if (viewW < 50 || viewH < 50) return; // canvas not laid out yet (hidden window)
  if (!bounds) {
    renderer.setViewport(cx, cy, 1.0);
  } else {
    const w = Math.max(bounds.maxX - bounds.minX, 50);
    const h = Math.max(bounds.maxY - bounds.minY, 50);
    renderer.setViewport(0, 0, Math.min(viewW / w, viewH / h, 1.5));
    const z = renderer.zoom;
    renderer.setViewport(cx - (bounds.minX + bounds.maxX) * 0.5 * z, cy - (bounds.minY + bounds.maxY) * 0.5 * z, z);
  }
  updateZoomText();
}
