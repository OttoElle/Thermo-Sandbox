// Selection transforms, item hit-testing, wall generators, move and delete.
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
import { ParticleGroup } from '../physics/ParticleGroup.js';
import { Particle } from '../physics/Particle.js';
import { Regulator } from '../physics/Regulator.js';
import { ThrottleValve } from '../physics/ThrottleValve.js';
import { btnFlipH, btnFlipV, btnGroupSelected, btnRotate90 } from './dom.js';
import { engine, renderer } from './core.js';
import { app } from './state.js';
import { recordUndoState } from './history.js';
import { wallOptions } from './toolPanel.js';
import { updateElementsList } from './elementTree.js';
import { closeContextMenu } from './canvasInput.js';

// ============================================================================
// Canvas Selection & Multi-Item Transforms
// ============================================================================
function getSelectionBounds() {
  if (app.selectedItems.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const item of app.selectedItems) {
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
  if (app.selectedItems.length === 0 || app.isSimulating) return;
  recordUndoState();
  const bounds = getSelectionBounds();
  if (!bounds) return;
  const { cx, cy } = bounds;

  for (const item of app.selectedItems) {
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
  if (app.selectedItems.length === 0 || app.isSimulating) return;
  recordUndoState();
  const bounds = getSelectionBounds();
  if (!bounds) return;
  const { cx } = bounds;

  for (const item of app.selectedItems) {
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
  if (app.selectedItems.length === 0 || app.isSimulating) return;
  recordUndoState();
  const bounds = getSelectionBounds();
  if (!bounds) return;
  const { cy } = bounds;

  for (const item of app.selectedItems) {
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

export function getAllGroupItems(item) {
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

export function toggleGroupSelection() {
  if (app.selectedItems.length === 0 || app.isSimulating) return;
  recordUndoState();
  const allSameGroup = app.selectedItems.length > 1 && app.selectedItems.every(i => i.groupId && i.groupId === app.selectedItems[0].groupId);
  if (allSameGroup) {
    app.selectedItems.forEach(i => { delete i.groupId; });
  } else {
    const gid = 'g_' + Math.random().toString(36).substring(2, 8);
    app.selectedItems.forEach(i => { i.groupId = gid; });
  }
  updateElementsList();
}

export function canGroupSelection() {
  const sel = app.selectedItems;
  return sel.length > 1 && !sel.every(i => i.groupId && i.groupId === sel[0].groupId);
}

export function canUngroupSelection() {
  return app.selectedItems.some(i => i.groupId);
}

export function groupSelection() {
  if (app.isSimulating || !canGroupSelection()) return;
  recordUndoState();
  const gid = 'g_' + Math.random().toString(36).substring(2, 8);
  app.selectedItems.forEach(i => { i.groupId = gid; });
  updateElementsList();
}

export function ungroupSelection() {
  if (app.isSimulating || !canUngroupSelection()) return;
  recordUndoState();
  app.selectedItems.forEach(i => { delete i.groupId; });
  updateElementsList();
}

btnRotate90?.addEventListener('click', rotateSelection90);
btnFlipH?.addEventListener('click', flipSelectionH);
btnFlipV?.addEventListener('click', flipSelectionV);
btnGroupSelected?.addEventListener('click', toggleGroupSelection);

// Piston Snap Detector for Sensor Chambers
export function findPistonSnap(x, y, width, height, threshold = 22) {
  if (!engine.pistons || engine.pistons.length === 0) return null;
  const cLeft = x, cRight = x + width, cTop = y, cBottom = y + height;
  let best = null;
  let minDiff = threshold + 1;

  for (let i = 0; i < engine.pistons.length; i++) {
    const p = engine.pistons[i];
    const pb = p.getBounds();

    if (p.orientation === 'horizontal') {
      const yOverlap = (cTop <= pb.bottom + threshold && cBottom >= pb.top - threshold);
      const dRight = Math.abs(cRight - pb.left);
      if (yOverlap && dRight < minDiff) {
        minDiff = dRight;
        best = { piston: p, edge: 'right', snappedCoord: pb.left };
      }
      const dLeft = Math.abs(cLeft - pb.right);
      if (yOverlap && dLeft < minDiff) {
        minDiff = dLeft;
        best = { piston: p, edge: 'left', snappedCoord: pb.right };
      }
    } else { // vertical
      const xOverlap = (cLeft <= pb.right + threshold && cRight >= pb.left - threshold);
      const dBottom = Math.abs(cBottom - pb.top);
      if (xOverlap && dBottom < minDiff) {
        minDiff = dBottom;
        best = { piston: p, edge: 'bottom', snappedCoord: pb.top };
      }
      const dTop = Math.abs(cTop - pb.bottom);
      if (xOverlap && dTop < minDiff) {
        minDiff = dTop;
        best = { piston: p, edge: 'top', snappedCoord: pb.bottom };
      }
    }
  }
  return best;
}

// Circle Wall Generator
export function createCircleWall(center, radius) {
  if (radius < 10) return [];
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
    createdWalls.push(engine.addWall(x1, y1, x2, y2, wallOptions({ groupId: gid })));
  }
  app.selectedItems = createdWalls;
  return createdWalls;
}

// Arc Generator
export function createArcWall(center, pStart, pEnd) {
  const radius = Math.hypot(pStart.x - center.x, pStart.y - center.y);
  if (radius < 10) return [];

  const startAngle = Math.atan2(pStart.y - center.y, pStart.x - center.x);
  let endAngle = Math.atan2(pEnd.y - center.y, pEnd.x - center.x);
  if (endAngle <= startAngle) endAngle += Math.PI * 2;

  const numSegments = 16;
  const angleStep = (endAngle - startAngle) / numSegments;
  const gid = 'g_arc_' + Math.random().toString(36).substring(2, 9);
  const createdWalls = [];

  for (let i = 0; i < numSegments; i++) {
    const a1 = startAngle + i * angleStep;
    const a2 = startAngle + (i + 1) * angleStep;
    const x1 = center.x + radius * Math.cos(a1);
    const y1 = center.y + radius * Math.sin(a1);
    const x2 = center.x + radius * Math.cos(a2);
    const y2 = center.y + radius * Math.sin(a2);
    createdWalls.push(engine.addWall(x1, y1, x2, y2, wallOptions({ groupId: gid })));
  }
  app.selectedItems = createdWalls;
  return createdWalls;
}

// Item Search & Box Selection
export function findItemAt(wx, wy) {
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

export function findItemsInBox(x1, y1, x2, y2) {
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

// Copies the selection (offset by one grid step): groups stay groups,
// spawner groups bring their particles, sensors keep bindings to copied pistons.
export function duplicateSelection() {
  if (app.isSimulating) return;
  const sources = app.selectedItems.filter(i => !(i instanceof Particle));
  if (sources.length === 0) return;
  recordUndoState();
  const offset = renderer.gridSize || 20;
  const groupMap = new Map();
  const pistonMap = new Map();
  const copies = [];
  for (const src of sources) {
    const copy = engine.cloneElement(src);
    if (!copy) continue;
    if (src.groupId) {
      if (!groupMap.has(src.groupId)) groupMap.set(src.groupId, src.groupId.replace(/[^_]+$/, '') + Math.random().toString(36).substring(2, 9));
      copy.groupId = groupMap.get(src.groupId);
    }
    if (src instanceof Piston) pistonMap.set(src.id, copy);
    if (src instanceof SensorZone) copy.label = `${src.label} (Copy)`;
    if (src instanceof ParticleGroup) {
      copy.x += offset;
      copy.y += offset;
      engine.particles.filter(p => p.groupId === src.id).forEach(p => {
        engine.addParticle(p.pos.x + offset, p.pos.y + offset, p.vel.x, p.vel.y, p.mass, copy.id);
      });
    }
    engine.addElement(copy);
    copies.push(copy);
  }
  moveItems(copies, offset, offset);
  copies.forEach(c => {
    if (c instanceof SensorZone && c.pistonBinding) {
      const piston = pistonMap.get(c.pistonBinding.pistonId);
      if (piston) c.bindToPiston(piston, c.pistonBinding.edge, true);
      else c.unbindPiston();
    }
  });
  engine.particles.forEach(p => { p.selected = false; });
  app.selectedItems = copies;
  engine.syncParticlesToGPU();
  updateElementsList();
}

export function moveSelectedItems(dx, dy) {
  moveItems(app.selectedItems, dx, dy);
}

function moveItems(items, dx, dy) {
  items.forEach(item => {
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

export function deleteSelectedItems() {
  if (app.selectedItems.length === 0) return;
  recordUndoState();
  const deleteSet = new Set(app.selectedItems);
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

  // Unbind any sensors bound to pistons being deleted
  const deletedPistons = app.selectedItems.filter(item => item instanceof Piston);
  if (deletedPistons.length > 0) {
    const deletedPistonIds = new Set(deletedPistons.map(p => p.id));
    engine.sensors.forEach(s => {
      if (s.pistonBinding && deletedPistonIds.has(s.pistonBinding.pistonId)) {
        s.unbindPiston();
      }
    });
  }

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

  app.selectedItems = [];
  closeContextMenu();
  updateElementsList();
  engine.syncWallsToGPU();
  engine.syncSinksToGPU();
}
