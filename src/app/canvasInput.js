// Canvas mouse interaction: coordinates, snapping, context menu, drawing and dragging.
import { Vector2 } from '../physics/Vector2.js';
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
import { Regulator } from '../physics/Regulator.js';
import { ThrottleValve } from '../physics/ThrottleValve.js';
import { canvas, contextMenu, ctxBringForward, ctxBringFront, ctxDelete, ctxDuplicate, ctxGroup, ctxSendBack, ctxSendBackward } from './dom.js';
import { engine, renderer } from './core.js';
import { app, pointer, resetPolygonDraft } from './state.js';
import { recordUndoState } from './history.js';
import { snapToGrid } from './fields.js';
import { toolConfigs } from './toolPanel.js';
import { updateElementsList } from './elementTree.js';
import { closeAllMenus } from './menus.js';
import { updateZoomText } from './playback.js';
import { createArcWall, createCircleWall, deleteSelectedItems, findItemAt, findItemsInBox, findPistonSnap, getAllGroupItems, moveSelectedItems, toggleGroupSelection } from './selection.js';
import { updatePopupPosition } from './popup.js';

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
  const isDrawingTool = app.activeTool === 'wall' || app.activeTool === 'valve' || app.activeTool === 'throttle_valve';
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
  pointer.arcSteps = [];

  if (app.isSimulating) return;

  const item = findItemAt(coords.worldX, coords.worldY);
  if (item) {
    if (!app.selectedItems.includes(item)) app.selectedItems = [item];
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

export function closeContextMenu() {
  contextMenu.style.display = 'none';
}

window.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target)) closeContextMenu();
});

ctxDelete?.addEventListener('click', () => {
  deleteSelectedItems();
  closeContextMenu();
});

ctxDuplicate?.addEventListener('click', () => {
  if (app.selectedItems.length === 0) return;
  recordUndoState();
  const newItems = [];
  app.selectedItems.forEach(item => {
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
  app.selectedItems = newItems;
  updateElementsList();
  closeContextMenu();
});

ctxGroup?.addEventListener('click', () => {
  toggleGroupSelection();
  closeContextMenu();
});

ctxBringFront?.addEventListener('click', () => {
  if (app.selectedItems.length === 0) return;
  recordUndoState();
  app.selectedItems.forEach(item => engine.bringToFront(item));
  updateElementsList();
  closeContextMenu();
});

ctxBringForward?.addEventListener('click', () => {
  if (app.selectedItems.length === 0) return;
  recordUndoState();
  app.selectedItems.forEach(item => engine.bringForward(item));
  updateElementsList();
  closeContextMenu();
});

ctxSendBackward?.addEventListener('click', () => {
  if (app.selectedItems.length === 0) return;
  recordUndoState();
  app.selectedItems.forEach(item => engine.sendBackward(item));
  updateElementsList();
  closeContextMenu();
});

ctxSendBack?.addEventListener('click', () => {
  if (app.selectedItems.length === 0) return;
  recordUndoState();
  app.selectedItems.forEach(item => engine.sendToBack(item));
  updateElementsList();
  closeContextMenu();
});

// ============================================================================
// Canvas Mouse Interactions
// ============================================================================
canvas.addEventListener('mousedown', (e) => {
  closeContextMenu();
  closeAllMenus();
  const coords = getCoords(e);
  pointer.currentCursorWorld = { x: coords.snapX, y: coords.snapY };

  // Direct Click during Simulation: Toggle manual valves & emitters
  if (app.isSimulating) {
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
    pointer.isPanning = true;
    pointer.panStartScreen = { x: coords.screenX, y: coords.screenY };
    pointer.panStartCamera = { x: renderer.panX, y: renderer.panY };
    canvas.style.cursor = 'grabbing';
    return;
  }

  if (e.button !== 0) return;

  pointer.isMouseDown = true;
  pointer.dragStartWorld = { x: coords.snapX, y: coords.snapY };

  const clickedItem = findItemAt(coords.worldX, coords.worldY);

  // Sequencer Element Picking Interceptor
  if (clickedItem && window.sequencerUI && window.sequencerUI.handleItemPicked(clickedItem)) {
    pointer.isMouseDown = false;
    return;
  }

  // In Simulation Mode or Direct Click: Toggle interactive thermal/mechanical elements
  if (clickedItem && (app.isSimulating || (app.activeTool === 'select' && !e.shiftKey))) {
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
      if (app.isSimulating) {
        clickedItem.toggle();
        updateElementsList();
        return;
      }
    }
  }

  // Polyline Wall Placement & Closing (must precede handle dragging & selection to allow closing loop on start vertex)
  if (!app.isSimulating && app.activeTool === 'wall' && toolConfigs.wall.shape === 'polygon') {
    const pt = { x: coords.snapX, y: coords.snapY };
    if (pointer.polygonPoints.length === 0) {
      pointer.polygonGroupId = 'g_poly_' + Math.random().toString(36).substring(2, 9);
      pointer.polygonWalls = [];
      pointer.polygonPoints.push(pt);
    } else {
      const p0 = pointer.polygonPoints[0];
      const closeDist = 18 / renderer.zoom;
      const isCloseToStart = pointer.polygonPoints.length >= 2 && (
        Math.hypot(coords.worldX - p0.x, coords.worldY - p0.y) < closeDist ||
        (coords.snapX === p0.x && coords.snapY === p0.y)
      );

      const targetPt = isCloseToStart ? { x: p0.x, y: p0.y } : pt;
      const prev = pointer.polygonPoints[pointer.polygonPoints.length - 1];

      if (prev.x !== targetPt.x || prev.y !== targetPt.y) {
        recordUndoState();
        const cfg = toolConfigs.wall;
        const w = engine.addWall(prev.x, prev.y, targetPt.x, targetPt.y, {
          conductivity: cfg.conductivity,
          thickness: cfg.thickness,
          groupId: pointer.polygonGroupId
        });
        pointer.polygonWalls.push(w);

        if (isCloseToStart) {
          app.selectedItems = [...polygonWalls];
          resetPolygonDraft();
          updateElementsList();
        } else {
          pointer.polygonPoints.push(targetPt);
          updateElementsList();
        }
      }
    }
    return;
  }

  // Handle Resize / Stroke Limit Handle Dragging (handles take precedence over tool creation)
  if (!app.isSimulating) {
    const handleHitRadius = 16 / renderer.zoom;

    // Check handles of currently selected items first
    for (const item of app.selectedItems) {
      const handles = renderer.getResizeHandles(item);
      for (let i = 0; i < handles.length; i++) {
        const h = handles[i];
        if (Math.hypot(coords.worldX - h.x, coords.worldY - h.y) < handleHitRadius) {
          recordUndoState();
          pointer.draggingHandle = { item, handleId: h.id };
          return;
        }
      }
    }

    // Check if clicking directly on handles of unselected item
    if (clickedItem && !app.selectedItems.includes(clickedItem)) {
      const handles = renderer.getResizeHandles(clickedItem);
      for (let i = 0; i < handles.length; i++) {
        const h = handles[i];
        if (Math.hypot(coords.worldX - h.x, coords.worldY - h.y) < handleHitRadius) {
          app.selectedItems = [clickedItem];
          updateElementsList();
          recordUndoState();
          pointer.draggingHandle = { item: clickedItem, handleId: h.id };
          return;
        }
      }
    }
  }

  // Select & Move (supports Shift + Click multi-selection, Group auto-selection & Particle selection)
  if (!app.isSimulating && (app.activeTool === 'select' || e.shiftKey)) {
    if (clickedItem) {
      const itemsToToggle = clickedItem.groupId ? getAllGroupItems(clickedItem) : [clickedItem];
      if (e.shiftKey) {
        const isAnySelected = itemsToToggle.some(i => app.selectedItems.includes(i));
        if (isAnySelected) {
          app.selectedItems = app.selectedItems.filter(i => !itemsToToggle.includes(i));
        } else {
          app.selectedItems = [...selectedItems, ...itemsToToggle];
        }
      } else {
        app.selectedItems = itemsToToggle;
      }
      recordUndoState();
      pointer.isMovingSelection = true;
      pointer.moveStartWorld = { x: coords.snapX, y: coords.snapY };
      updateElementsList();
      return;
    } else {
      // Check if clicking a single particle
      const clickedP = engine.findParticleAt(coords.worldX, coords.worldY, 14 / renderer.zoom);
      if (clickedP) {
        if (!e.shiftKey) {
          engine.particles.forEach(p => { p.selected = false; });
          app.selectedItems = [];
        }
        clickedP.selected = !clickedP.selected;
        if (clickedP.selected) app.selectedItems.push(clickedP);
        else app.selectedItems = app.selectedItems.filter(i => i !== clickedP);
        updateElementsList();
        return;
      } else if (!e.shiftKey) {
        engine.particles.forEach(p => { p.selected = false; });
        app.selectedItems = [];
        updateElementsList();
      }
    }
  }

  // Text Tool
  if (!app.isSimulating && app.activeTool === 'text') {
    const txt = prompt('Enter text note:', toolConfigs.text.text || 'Annotation');
    if (txt) {
      recordUndoState();
      const l = engine.addTextLabel(coords.snapX, coords.snapY, txt, { fontSize: toolConfigs.text.fontSize });
      app.selectedItems = [l];
      updateElementsList();
    }
    return;
  }

  // Arc Wall: 3 Clicks
  if (!app.isSimulating && app.activeTool === 'wall' && toolConfigs.wall.shape === 'arc') {
    pointer.arcSteps.push({ x: coords.snapX, y: coords.snapY });
    if (pointer.arcSteps.length === 3) {
      recordUndoState();
      createArcWall(pointer.arcSteps[0], pointer.arcSteps[1], pointer.arcSteps[2]);
      pointer.arcSteps = [];
      updateElementsList();
    }
    return;
  }
});

window.addEventListener('mousemove', (e) => {
  const coords = getCoords(e);
  pointer.currentCursorWorld = { x: coords.snapX, y: coords.snapY };
  renderer.snapCursor = { x: coords.snapX, y: coords.snapY, isVertex: coords.isVertex };

  if (pointer.isPanning) {
    renderer.panX = pointer.panStartCamera.x + (coords.screenX - pointer.panStartScreen.x);
    renderer.panY = pointer.panStartCamera.y + (coords.screenY - pointer.panStartScreen.y);
    updatePopupPosition();
    return;
  }

  // Sequencer Element Picking Hover Highlight
  if (window.sequencerUI?.actionDialog?.isPicking) {
    const hoveredItem = findItemAt(coords.worldX, coords.worldY);
    const isValid = hoveredItem && window.sequencerUI.actionDialog.isPickable(hoveredItem);
    renderer.highlightedSequencerItem = isValid ? hoveredItem : null;
    canvas.style.cursor = isValid ? 'pointer' : 'crosshair';
    return;
  }

  // Update live draft preview info in renderer
  if (pointer.isMouseDown && pointer.dragStartWorld && !app.isSimulating && !pointer.draggingHandle && !pointer.isMovingSelection) {
    renderer.draftInfo = {
      isDrafting: true,
      tool: app.activeTool,
      shape: (app.activeTool === 'wall' && toolConfigs.wall) ? toolConfigs.wall.shape : 'line',
      vtype: (app.activeTool === 'valve' && toolConfigs.valve) ? toolConfigs.valve.type : '',
      start: pointer.dragStartWorld,
      current: pointer.currentCursorWorld
    };
  } else {
    renderer.draftInfo = null;
  }

  // Dragging Handles
  if (!app.isSimulating && pointer.draggingHandle) {
    const { item, handleId } = pointer.draggingHandle;
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
      if (item instanceof SensorZone) {
        item.volume = item.width * item.height;
        if (item.pistonBinding && item.pistonBinding.pistonId) {
          const pb = item.pistonBinding;
          if (pb.edge === 'right') pb.fixedOpposite = item.x;
          else if (pb.edge === 'left') pb.fixedOpposite = item.x + item.width;
          else if (pb.edge === 'bottom') pb.fixedOpposite = item.y;
          else if (pb.edge === 'top') pb.fixedOpposite = item.y + item.height;
        }
      }
    }
    updatePopupPosition();
    return;
  }

  // Move selected items
  if (!app.isSimulating && pointer.isMovingSelection && pointer.moveStartWorld) {
    const dx = coords.snapX - pointer.moveStartWorld.x;
    const dy = coords.snapY - pointer.moveStartWorld.y;
    if (dx !== 0 || dy !== 0) {
      moveSelectedItems(dx, dy);
      pointer.moveStartWorld = { x: coords.snapX, y: coords.snapY };
      updatePopupPosition();
    }
    return;
  }

  // Cursor in Select Mode
  if (!app.isSimulating && app.activeTool === 'select' && !pointer.isMouseDown) {
    if (app.selectedItems.length === 1) {
      const handles = renderer.getResizeHandles(app.selectedItems[0]);
      const hitRadius = 14 / renderer.zoom;
      const isOverHandle = handles.some(h => Math.hypot(coords.worldX - h.x, coords.worldY - h.y) < hitRadius);
      if (isOverHandle) {
        canvas.style.cursor = 'crosshair';
        return;
      }
    }
    const itemUnderCursor = findItemAt(coords.worldX, coords.worldY);
    if (itemUnderCursor && app.selectedItems.includes(itemUnderCursor)) {
      canvas.style.cursor = 'move';
    } else if (itemUnderCursor) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }
});

window.addEventListener('mouseup', (e) => {
  if (pointer.isPanning) {
    pointer.isPanning = false;
    canvas.style.cursor = 'crosshair';
  }

  const wasDraggingHandle = !!pointer.draggingHandle;
  const wasMovingSelection = pointer.isMovingSelection;
  const draggedHandleItem = pointer.draggingHandle?.item;

  if (pointer.draggingHandle) pointer.draggingHandle = null;
  if (pointer.isMovingSelection) pointer.isMovingSelection = false;

  if (!pointer.isMouseDown) return;
  pointer.isMouseDown = false;
  renderer.draftInfo = null;

  if (wasDraggingHandle || wasMovingSelection) {
    if (draggedHandleItem instanceof SensorZone && !draggedHandleItem.pistonBinding) {
      const snap = findPistonSnap(draggedHandleItem.x, draggedHandleItem.y, draggedHandleItem.width, draggedHandleItem.height);
      if (snap) {
        draggedHandleItem.bindToPiston(snap.piston, snap.edge, true);
        updateElementsList();
      }
    } else if (wasMovingSelection) {
      app.selectedItems.forEach(it => {
        if (it instanceof SensorZone && !it.pistonBinding) {
          const snap = findPistonSnap(it.x, it.y, it.width, it.height);
          if (snap) {
            it.bindToPiston(snap.piston, snap.edge, true);
          }
        }
      });
      updateElementsList();
    }
    updatePopupPosition();
    return;
  }

  const coords = getCoords(e);

  if (!app.isSimulating && pointer.dragStartWorld) {
    const s = pointer.dragStartWorld;
    const c = { x: coords.snapX, y: coords.snapY };
    const minX = Math.min(s.x, c.x), minY = Math.min(s.y, c.y);
    const w = Math.abs(c.x - s.x), h = Math.abs(c.y - s.y);

    // Marquee Selection (Objects + Particles)
    if (app.activeTool === 'select' && (w >= 10 || h >= 10)) {
      const boxItems = findItemsInBox(minX, minY, minX + w, minY + h);
      const boxParticles = engine.findParticlesInRect(minX, minY, minX + w, minY + h);
      boxParticles.forEach(p => { p.selected = true; });
      app.selectedItems = [...boxItems, ...boxParticles];
      updateElementsList();

    // Wall Rectangle
    } else if (app.activeTool === 'wall' && toolConfigs.wall.shape === 'rect' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.wall;
      const gid = 'g_rect_' + Math.random().toString(36).substring(2, 9);
      const w1 = engine.addWall(minX, minY, minX + w, minY, { conductivity: cfg.conductivity, thickness: cfg.thickness, groupId: gid });
      const w2 = engine.addWall(minX + w, minY, minX + w, minY + h, { conductivity: cfg.conductivity, thickness: cfg.thickness, groupId: gid });
      const w3 = engine.addWall(minX + w, minY + h, minX, minY + h, { conductivity: cfg.conductivity, thickness: cfg.thickness, groupId: gid });
      const w4 = engine.addWall(minX, minY + h, minX, minY, { conductivity: cfg.conductivity, thickness: cfg.thickness, groupId: gid });
      app.selectedItems = [w1, w2, w3, w4];
      updateElementsList();

    // Wall Circle
    } else if (app.activeTool === 'wall' && toolConfigs.wall.shape === 'circle') {
      const radius = Math.hypot(c.x - s.x, c.y - s.y);
      if (radius >= 12) {
        recordUndoState();
        createCircleWall(s, radius);
        updateElementsList();
      }

    // Piston
    } else if (app.activeTool === 'piston' && (w >= 20 || h >= 20)) {
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
      app.selectedItems = [p];
      updateElementsList();

    // Isotherm-Block (Solid Constant-T Reservoir)
    } else if ((app.activeTool === 'solid_res' || app.activeTool === 'reservoir') && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.solid_res || toolConfigs.reservoir;
      const r = engine.addReservoir(minX, minY, w, h, {
        label: `Isotherm (${Math.round(cfg.temperature)}K)`, temperature: cfg.temperature, conductance: cfg.conductance
      });
      app.selectedItems = [r];
      updateElementsList();

    // Permeable Heat Exchanger (Cross-hatch constant-T)
    } else if (app.activeTool === 'heat_exchanger' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.heat_exchanger;
      const hx = engine.addHeatExchanger(minX, minY, w, h, {
        temperature: cfg.temperature, conductivity: cfg.conductivity
      });
      app.selectedItems = [hx];
      updateElementsList();

    // Permeable Regenerator Matrix (Multi-slice gradient with directional parallel lines)
    } else if ((app.activeTool === 'regenerator' || app.activeTool === 'matrix') && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.regenerator || toolConfigs.matrix;
      const isHoriz = cfg.orientation ? cfg.orientation === 'horizontal' : (w >= h);
      const reg = engine.addRegeneratorMatrix(minX, minY, w, h, {
        orientation: isHoriz ? 'horizontal' : 'vertical',
        temperature: cfg.temperature, heatCapacity: cfg.heatCapacity,
        conductivity: cfg.conductivity, sliceCount: 10
      });
      app.selectedItems = [reg];
      updateElementsList();

    // Solid Thermal Storage Block (Finite heat capacity C)
    } else if ((app.activeTool === 'storage_block' || app.activeTool === 'solidblock') && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.storage_block || toolConfigs.solidblock;
      const sb = engine.addThermalBlock(minX, minY, w, h, {
        temperature: cfg.temperature, heatCapacity: cfg.heatCapacity, conductivity: cfg.conductivity
      });
      app.selectedItems = [sb];
      updateElementsList();

    // Valve (Manual, Check, or Relief)
    } else if (app.activeTool === 'valve' && (s.x !== c.x || s.y !== c.y)) {
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
      app.selectedItems = [v];
      updateElementsList();

    // Throttle Valve (Variable Opening Orifice)
    } else if (app.activeTool === 'throttle_valve' && (s.x !== c.x || s.y !== c.y)) {
      recordUndoState();
      const cfg = toolConfigs.throttle_valve;
      const tv = engine.addThrottleValve(s.x, s.y, c.x, c.y, {
        openRatio: cfg.openRatio,
        thickness: cfg.thickness || 6,
        conductivity: cfg.conductivity || 0
      });
      app.selectedItems = [tv];
      updateElementsList();

    // Particle Spawner
    } else if (app.activeTool === 'gas' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.gas;
      const group = engine.spawnGasRaster(minX, minY, w, h, cfg.count, cfg.mass, cfg.temperature, cfg.velocityMode);
      app.selectedItems = [group];
      updateElementsList();

    // Particle Regulator Zone
    } else if (app.activeTool === 'regulator' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.regulator;
      const reg = engine.addRegulator(minX, minY, w, h, {
        targetCount: cfg.targetCount,
        hysteresis: cfg.hysteresis,
        temperature: cfg.temperature,
        mass: cfg.mass,
        rate: cfg.rate
      });
      app.selectedItems = [reg];
      updateElementsList();

    // Emitter (Source)
    } else if (app.activeTool === 'emitter' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.emitter;
      const em = engine.addEmitter(minX, minY, w, h, {
        rate: cfg.rate,
        temperature: cfg.temperature,
        mass: cfg.mass || 1.0,
        direction: cfg.direction,
        maxParticles: cfg.maxParticles
      });
      app.selectedItems = [em];
      updateElementsList();

    // Sink (Absorber)
    } else if (app.activeTool === 'sink' && w >= 20 && h >= 20) {
      recordUndoState();
      const cfg = toolConfigs.sink;
      const sk = engine.addSink(minX, minY, w, h, {
        absorptionEfficiency: cfg.absorptionEfficiency,
        direction: cfg.direction,
        maxParticles: cfg.maxParticles,
        tempFilterMode: cfg.tempFilterMode,
        filterTemperature: cfg.filterTemperature
      });
      app.selectedItems = [sk];
      updateElementsList();

    // Sensor Zone
    } else if (app.activeTool === 'sensor' && w >= 20 && h >= 20) {
      recordUndoState();
      const letter = String.fromCharCode(65 + engine.sensors.length);
      const sZone = engine.addSensor({
        label: `${toolConfigs.sensor.label} ${letter}`,
        x: minX, y: minY, width: w, height: h,
        color: toolConfigs.sensor.color || '#38bdf8'
      });
      const snap = findPistonSnap(minX, minY, w, h);
      if (snap) {
        sZone.bindToPiston(snap.piston, snap.edge, true);
      }
      app.selectedItems = [sZone];
      updateElementsList();
    }
  }

  pointer.dragStartWorld = null;
});

// Finish Wall Polygon / Arc
canvas.addEventListener('dblclick', () => { resetPolygonDraft(); pointer.arcSteps = []; });
