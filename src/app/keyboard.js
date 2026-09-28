// Keyboard shortcuts, info modal and chart tabs.
import { btnInfoClose, btnPlayPause, btnStep, ctxDuplicate, fileImportInput, infoModal, tabPV, tabTemp } from './dom.js';
import { engine, tempChart } from './core.js';
import { app, pointer, resetPolygonDraft } from './state.js';
import { performRedo, performUndo, recordUndoState } from './history.js';
import { toolConfigs } from './toolPanel.js';
import { updateElementsList } from './elementTree.js';
import { closeAllMenus, closeSaveModal, openSaveModal } from './menus.js';
import { closeContextMenu } from './canvasInput.js';
import { deleteSelectedItems } from './selection.js';
import { closePopup } from './popup.js';
import { hideSplashScreen } from './splash.js';

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
    if (app.activeTool === 'wall' && toolConfigs.wall.shape === 'polygon' && pointer.polygonPoints.length >= 2) {
      const p0 = pointer.polygonPoints[0];
      const prev = pointer.polygonPoints[pointer.polygonPoints.length - 1];
      if (prev.x !== p0.x || prev.y !== p0.y) {
        recordUndoState();
        const cfg = toolConfigs.wall;
        const w = engine.addWall(prev.x, prev.y, p0.x, p0.y, {
          conductivity: cfg.conductivity,
          thickness: cfg.thickness,
          groupId: pointer.polygonGroupId
        });
        pointer.polygonWalls.push(w);
        app.selectedItems = [...polygonWalls];
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
