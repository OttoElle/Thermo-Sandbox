// Keyboard shortcuts, info modal and chart tabs.
import { btnInfoClose, btnPlayPause, btnRotate90, btnStep, btnToolbarClear, btnZoomIn, btnZoomOut, ctxDuplicate, fileImportInput, infoModal, tabPV, tabTemp } from './dom.js';
import { engine, tempChart } from './core.js';
import { app, pointer, resetPolygonDraft } from './state.js';
import { performRedo, performUndo, recordUndoState } from './history.js';
import { toolConfigs, wallOptions } from './toolPanel.js';
import { updateElementsList } from './elementTree.js';
import { closeAllMenus, closeSaveModal, openSaveModal, openShortcutsModal, saveProject, selectAllElements, toggleVectors } from './menus.js';
import { closeContextMenu } from './canvasInput.js';
import { deleteSelectedItems, groupSelection, ungroupSelection } from './selection.js';
import { hideSplashScreen } from './splash.js';
import { fitViewToScene } from './playback.js';
import { hasActiveDraft, openDimensionInput } from './dimensions.js';

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  const t = e.target;
  if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
  if (app.isSplashActive && e.code !== 'Escape') return;

  if (e.ctrlKey || e.metaKey) {
    const handled = {
      KeyZ: () => (e.shiftKey ? performRedo() : performUndo()),
      KeyY: performRedo,
      KeyD: () => ctxDuplicate.click(),
      KeyO: () => fileImportInput.click(),
      KeyS: () => (e.shiftKey ? openSaveModal() : saveProject()),
      KeyA: selectAllElements,
      KeyG: () => (e.shiftKey ? ungroupSelection() : groupSelection()),
      KeyN: () => { if (e.altKey) btnToolbarClear.click(); }
    }[e.code];
    if (handled) {
      e.preventDefault();
      handled();
    }
    return;
  }
  if (e.altKey) return;

  // Typing a number while drawing enters exact dimensions
  if (/^[0-9.]$/.test(e.key) && hasActiveDraft()) {
    e.preventDefault();
    openDimensionInput(e.key);
    return;
  }

  if (e.key === '?') {
    openShortcutsModal();
  } else if (e.key === '+' || e.key === '=') {
    btnZoomIn.click();
  } else if (e.key === '-') {
    btnZoomOut.click();
  } else if (e.code === 'KeyF') {
    fitViewToScene();
  } else if (e.code === 'KeyV') {
    toggleVectors();
  } else if (e.code === 'KeyR' && app.selectedItems.length > 0) {
    btnRotate90.click();
  } else if (e.code === 'Delete' || e.code === 'Backspace') {
    deleteSelectedItems();
  } else if (e.code === 'Space') {
    e.preventDefault();
    btnPlayPause.click();
  } else if (e.code === 'KeyS') {
    btnStep.click();
  } else if (e.code === 'Enter') {
    if (app.activeTool === 'wall' && toolConfigs.wall.shape === 'polygon' && pointer.polygonPoints.length >= 2) {
      const p0 = pointer.polygonPoints[0];
      const prev = pointer.polygonPoints[pointer.polygonPoints.length - 1];
      if (prev.x !== p0.x || prev.y !== p0.y) {
        recordUndoState();
        const w = engine.addWall(prev.x, prev.y, p0.x, p0.y, wallOptions({ groupId: pointer.polygonGroupId }));
        pointer.polygonWalls.push(w);
        app.selectedItems = [...pointer.polygonWalls];
        resetPolygonDraft();
        updateElementsList();
      }
    }
    if (app.activeTool !== 'select') {
      document.getElementById('toolSelect')?.click();
    }
  } else if (e.code === 'Escape') {
    if (app.isSplashActive) {
      if (app.hasActiveSession) {
        hideSplashScreen();
      }
      return;
    }
    if (app.activeTool !== 'select') {
      document.getElementById('toolSelect')?.click();
    }
    resetPolygonDraft();
    pointer.arcSteps = [];
    closeContextMenu();
    closeAllMenus();
    closeSaveModal();
    infoModal.style.display = 'none';
    shortcutsModal.style.display = 'none';
  }
});

// Info & Shortcuts Modals
const shortcutsModal = document.getElementById('shortcutsModal');
btnInfoClose.addEventListener('click', () => { infoModal.style.display = 'none'; });
document.getElementById('btnShortcutsClose')?.addEventListener('click', () => { shortcutsModal.style.display = 'none'; });
window.addEventListener('click', (e) => {
  if (e.target === infoModal) infoModal.style.display = 'none';
  if (e.target === shortcutsModal) shortcutsModal.style.display = 'none';
});

// Chart Tabs
tabTemp.addEventListener('click', () => {
  tabTemp.classList.add('active');
  tabPV.classList.remove('active');
  tempChart.setSpec({ metric: 'temp' });
});
tabPV.addEventListener('click', () => {
  tabPV.classList.add('active');
  tabTemp.classList.remove('active');
  tempChart.setSpec({ metric: 'pv' });
});
