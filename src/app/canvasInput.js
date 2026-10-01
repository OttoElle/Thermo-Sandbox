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
import { Regulator } from '../physics/Regulator.js';
import { ThrottleValve } from '../physics/ThrottleValve.js';
import { canvas, contextMenu, ctxBringForward, ctxBringFront, ctxDelete, ctxDuplicate, ctxGroup, ctxSendBack, ctxSendBackward } from './dom.js';
import { engine, renderer } from './core.js';
import { app, pointer, resetPolygonDraft } from './state.js';
import { recordUndoState } from './history.js';
import { snapToGrid } from './fields.js';
import { toolConfigs, wallOptions } from './toolPanel.js';
import { defaultValues } from '../model/elementSchema.js';
import { sensorColor } from '../analytics/chartData.js';
import { updateElementsList } from './elementTree.js';
import { closeAllMenus } from './menus.js';
import { updateZoomText } from './playback.js';
import { createArcWall, createCircleWall, deleteSelectedItems, duplicateSelection, findItemAt, findItemsInBox, findPistonSnap, getAllGroupItems, moveSelectedItems, toggleGroupSelection } from './selection.js';
import { beginTransform, constrainEndpoint, cursorForHit, endTransform, getLinkedEndpoints, hitTestTransform, isTransforming, moveEndpoints, updateTransform } from './transform.js';
import { openSelectionSizeInput } from './dimensions.js';

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

// Tools that create their element from a drag (or click-move-click).
const DRAG_TOOLS = new Set(['piston', 'solid_res', 'reservoir', 'heat_exchanger', 'regenerator', 'matrix', 'storage_block',
  'solidblock', 'valve', 'throttle_valve', 'gas', 'regulator', 'emitter', 'sink', 'sensor']);

export function isDragTool() {
  if (app.activeTool === 'wall') return toolConfigs.wall.shape === 'rect' || toolConfigs.wall.shape === 'circle';
  return DRAG_TOOLS.has(app.activeTool);
}

// Adds the next polyline vertex; landing on the start vertex closes the shape.
export function placePolylinePoint(pt) {
  if (pointer.polygonPoints.length === 0) {
    pointer.polygonGroupId = 'g_poly_' + Math.random().toString(36).substring(2, 9);
    pointer.polygonWalls = [];
    pointer.polygonPoints.push(pt);
    return;
  }
  const p0 = pointer.polygonPoints[0];
  const prev = pointer.polygonPoints[pointer.polygonPoints.length - 1];
  if (prev.x === pt.x && prev.y === pt.y) return;
  recordUndoState();
  const w = engine.addWall(prev.x, prev.y, pt.x, pt.y, wallOptions({ groupId: pointer.polygonGroupId }));
  pointer.polygonWalls.push(w);
  if (pointer.polygonPoints.length >= 2 && pt.x === p0.x && pt.y === p0.y) {
    app.selectedItems = [...pointer.polygonWalls];
    resetPolygonDraft();
  } else {
    pointer.polygonPoints.push(pt);
  }
  updateElementsList();
}

// Starts dragging a segment endpoint; shape vertices move together unless detached (Ctrl).
function startEndpointDrag(item, handleId, detach) {
  const links = detach ? [{ item, handleId }] : getLinkedEndpoints(item, handleId);
  pointer.draggingHandle = { item, handleId, links };
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
  duplicateSelection();
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

  // Second click of a click-move-click drawing
  if (pointer.pendingStart && !app.isSimulating) {
    if (isDragTool()) createFromDrag(pointer.pendingStart, { x: coords.snapX, y: coords.snapY });
    pointer.pendingStart = null;
    renderer.draftInfo = null;
    return;
  }

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
    const p0 = pointer.polygonPoints[0];
    const isCloseToStart = pointer.polygonPoints.length >= 2 && (
      Math.hypot(coords.worldX - p0.x, coords.worldY - p0.y) < 18 / renderer.zoom ||
      (coords.snapX === p0.x && coords.snapY === p0.y)
    );
    placePolylinePoint(isCloseToStart ? { x: p0.x, y: p0.y } : { x: coords.snapX, y: coords.snapY });
    return;
  }

  // Transform frame, shape vertices and item handles: select tool only, so
  // drawing tools never grab nodes of existing elements.
  if (!app.isSimulating && app.activeTool === 'select') {
    const hit = hitTestTransform(coords.worldX, coords.worldY);
    if (hit?.kind === 'label') {
      pointer.isMouseDown = false;
      openSelectionSizeInput();
      return;
    }
    if (hit) {
      recordUndoState();
      if (hit.kind === 'vertex') startEndpointDrag(hit.item, hit.handleId, e.ctrlKey);
      else beginTransform(hit, coords.worldX, coords.worldY);
      return;
    }

    const handleHitRadius = 12 / renderer.zoom;
    const hasOwnHandles = (it) => it instanceof Wall || it instanceof ThrottleValve || it instanceof Piston;
    const candidates = [...app.selectedItems.filter(hasOwnHandles)];
    if (clickedItem && hasOwnHandles(clickedItem) && !app.selectedItems.includes(clickedItem)) candidates.push(clickedItem);
    for (const item of candidates) {
      const h = renderer.getResizeHandles(item).find(h => Math.hypot(coords.worldX - h.x, coords.worldY - h.y) < handleHitRadius);
      if (!h) continue;
      if (!app.selectedItems.includes(item)) {
        app.selectedItems = getAllGroupItems(item);
        updateElementsList();
      }
      recordUndoState();
      if (h.id === 'p1' || h.id === 'p2') startEndpointDrag(item, h.id, e.ctrlKey);
      else pointer.draggingHandle = { item, handleId: h.id };
      return;
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
          app.selectedItems = [...app.selectedItems, ...itemsToToggle];
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
  const isDragging = pointer.isMouseDown && !pointer.draggingHandle && !pointer.isMovingSelection && !isTransforming();
  const draftStart = pointer.pendingStart || (isDragging ? pointer.dragStartWorld : null);
  if (draftStart && !app.isSimulating) {
    renderer.draftInfo = {
      isDrafting: true,
      tool: app.activeTool,
      shape: (app.activeTool === 'wall' && toolConfigs.wall) ? toolConfigs.wall.shape : 'line',
      vtype: (app.activeTool === 'valve' && toolConfigs.valve) ? toolConfigs.valve.type : '',
      start: draftStart,
      current: pointer.currentCursorWorld
    };
  } else {
    renderer.draftInfo = null;
  }

  // Transform frame drag (resize / rotate)
  if (isTransforming()) {
    updateTransform(coords.worldX, coords.worldY, { shift: e.shiftKey, alt: e.altKey });
    return;
  }

  // Dragging Handles
  if (!app.isSimulating && pointer.draggingHandle) {
    const { item, handleId, links } = pointer.draggingHandle;
    if (links) {
      let pt = { x: coords.snapX, y: coords.snapY };
      if (e.shiftKey) pt = constrainEndpoint(item, handleId, coords.worldX, coords.worldY);
      moveEndpoints(links, pt.x, pt.y);
    } else if (item instanceof ThrottleValve && (handleId === 'gap1' || handleId === 'gap2')) {
      const mid = item.midPoint;
      const dx = coords.snapX - mid.x;
      const dy = coords.snapY - mid.y;
      const proj = Math.abs(dx * item.unitDir.x + dy * item.unitDir.y);
      if (item.length > 0) {
        item.setOpenRatio(Math.max(0.02, Math.min(0.98, (proj * 2.0) / item.length)));
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
    }
    return;
  }

  // Move selected items
  if (!app.isSimulating && pointer.isMovingSelection && pointer.moveStartWorld) {
    const dx = coords.snapX - pointer.moveStartWorld.x;
    const dy = coords.snapY - pointer.moveStartWorld.y;
    if (dx !== 0 || dy !== 0) {
      moveSelectedItems(dx, dy);
      pointer.moveStartWorld = { x: coords.snapX, y: coords.snapY };
    }
    return;
  }

  // Cursor in Select Mode
  if (!app.isSimulating && app.activeTool === 'select' && !pointer.isMouseDown) {
    const hitCursor = cursorForHit(hitTestTransform(coords.worldX, coords.worldY));
    if (hitCursor) {
      canvas.style.cursor = hitCursor;
      renderer.hoverItem = null;
      return;
    }
    const handleHitRadius = 12 / renderer.zoom;
    const overHandle = app.selectedItems.some(it => (it instanceof Wall || it instanceof ThrottleValve || it instanceof Piston) &&
      renderer.getResizeHandles(it).some(h => Math.hypot(coords.worldX - h.x, coords.worldY - h.y) < handleHitRadius));
    const itemUnderCursor = findItemAt(coords.worldX, coords.worldY);
    renderer.hoverItem = itemUnderCursor;
    if (overHandle) {
      canvas.style.cursor = 'move';
    } else if (itemUnderCursor && app.selectedItems.includes(itemUnderCursor)) {
      canvas.style.cursor = 'move';
    } else if (itemUnderCursor) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  } else if (!pointer.isMouseDown && !pointer.isPanning) {
    canvas.style.cursor = 'crosshair';
    renderer.hoverItem = null;
  }
});

window.addEventListener('mouseup', (e) => {
  if (pointer.isPanning) {
    pointer.isPanning = false;
    canvas.style.cursor = 'crosshair';
  }

  if (isTransforming()) {
    endTransform();
    pointer.isMouseDown = false;
    pointer.dragStartWorld = null;
    renderer.draftInfo = null;
    updateElementsList();
    return;
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
    return;
  }

  const coords = getCoords(e);

  if (!app.isSimulating && pointer.dragStartWorld) {
    const s = pointer.dragStartWorld;
    const c = { x: coords.snapX, y: coords.snapY };
    const minX = Math.min(s.x, c.x), minY = Math.min(s.y, c.y);
    const w = Math.abs(c.x - s.x), h = Math.abs(c.y - s.y);

    // Marquee Selection (Objects + Particles)
    if (app.activeTool === 'select') {
      if (w >= 10 || h >= 10) {
        const boxItems = findItemsInBox(minX, minY, minX + w, minY + h);
        const boxParticles = engine.findParticlesInRect(minX, minY, minX + w, minY + h);
        boxParticles.forEach(p => { p.selected = true; });
        app.selectedItems = [...boxItems, ...boxParticles];
        updateElementsList();
      }
    } else if (isDragTool() && Math.hypot(c.x - s.x, c.y - s.y) * renderer.zoom < 4) {
      // Click without dragging: the next click sets the opposite corner
      pointer.pendingStart = s;
    } else {
      createFromDrag(s, c);
    }
  }

  pointer.dragStartWorld = null;
});

// Creates the element of the active drawing tool from a drag (start s, end c),
// with all current tool settings (toolConfigs) as its properties.
export function createFromDrag(s, c) {
  const minX = Math.min(s.x, c.x), minY = Math.min(s.y, c.y);
  const w = Math.abs(c.x - s.x), h = Math.abs(c.y - s.y);
  const tool = app.activeTool;
  const isBox = w >= 20 && h >= 20;
  const cfg = { ...toolConfigs[tool] };
  let created = null;

  if (tool === 'wall' && toolConfigs.wall.shape === 'rect' && isBox) {
    recordUndoState();
    const gid = 'g_rect_' + Math.random().toString(36).substring(2, 9);
    const corners = [[minX, minY], [minX + w, minY], [minX + w, minY + h], [minX, minY + h]];
    created = corners.map((p, i) => {
      const q = corners[(i + 1) % 4];
      return engine.addWall(p[0], p[1], q[0], q[1], wallOptions({ groupId: gid }));
    });
  } else if (tool === 'wall' && toolConfigs.wall.shape === 'circle') {
    const radius = Math.hypot(c.x - s.x, c.y - s.y);
    if (radius < 12) return;
    recordUndoState();
    created = createCircleWall(s, radius);
  } else if (tool === 'piston' && (w >= 20 || h >= 20)) {
    recordUndoState();
    // A tall drag makes a piston that moves horizontally and vice versa.
    const movesHorizontally = h >= w;
    const cx = (s.x + c.x) * 0.5, cy = (s.y + c.y) * 0.5;
    const along = movesHorizontally ? cx : cy;
    created = engine.addPiston({
      ...cfg, label: 'P', orientation: movesHorizontally ? 'horizontal' : 'vertical',
      x: cx, y: cy, width: Math.max(16, w), height: Math.max(16, h),
      minPos: along - 140, maxPos: along + 140
    });
  } else if (tool === 'solid_res' && isBox) {
    recordUndoState();
    created = engine.addReservoir(minX, minY, w, h, cfg);
  } else if (tool === 'heat_exchanger' && isBox) {
    recordUndoState();
    created = engine.addHeatExchanger(minX, minY, w, h, cfg);
  } else if (tool === 'regenerator' && isBox) {
    recordUndoState();
    created = engine.addRegeneratorMatrix(minX, minY, w, h, cfg);
  } else if (tool === 'storage_block' && isBox) {
    recordUndoState();
    created = engine.addThermalBlock(minX, minY, w, h, cfg);
  } else if (tool === 'valve' && (s.x !== c.x || s.y !== c.y)) {
    recordUndoState();
    created = engine.addWall(s.x, s.y, c.x, c.y, cfg);
  } else if (tool === 'throttle_valve' && (s.x !== c.x || s.y !== c.y)) {
    recordUndoState();
    created = engine.addThrottleValve(s.x, s.y, c.x, c.y, cfg);
  } else if (tool === 'gas' && isBox) {
    recordUndoState();
    created = engine.spawnGasRaster(minX, minY, w, h, cfg.count, cfg.mass, cfg.temperature, cfg.velocityMode);
  } else if (tool === 'regulator' && isBox) {
    recordUndoState();
    created = engine.addRegulator(minX, minY, w, h, cfg);
  } else if (tool === 'emitter' && isBox) {
    recordUndoState();
    created = engine.addEmitter(minX, minY, w, h, cfg);
  } else if (tool === 'sink' && isBox) {
    recordUndoState();
    created = engine.addSink(minX, minY, w, h, cfg);
  } else if (tool === 'sensor' && isBox) {
    recordUndoState();
    const letter = String.fromCharCode(65 + engine.sensors.length);
    // Untouched default color: next color of the chart palette, so every sensor gets its own.
    const color = cfg.color === defaultValues('sensor', 'tool').color ? sensorColor(engine.sensors.length) : cfg.color;
    created = engine.addSensor({ x: minX, y: minY, width: w, height: h, color, label: `${cfg.label} ${letter}` });
    const snap = findPistonSnap(minX, minY, w, h);
    if (snap) created.bindToPiston(snap.piston, snap.edge, true);
  }

  if (created) {
    app.selectedItems = Array.isArray(created) ? created : [created];
    updateElementsList();
  }
}

// Finish Wall Polygon / Arc
canvas.addEventListener('dblclick', () => { resetPolygonDraft(); pointer.arcSteps = []; });
canvas.addEventListener('mouseleave', () => { renderer.hoverItem = null; });
