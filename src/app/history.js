// Edit-mode undo/redo and the playback history used by Step Back.
import { btnRedo, btnUndo } from './dom.js';
import { engine } from './core.js';
import { app } from './state.js';
import { renderToolProperties } from './toolPanel.js';
import { updateElementsList } from './elementTree.js';
import { closeContextMenu } from './canvasInput.js';

// Undo & Redo Stacks for Edit Mode
export const undoStack = [];
export const redoStack = [];
const MAX_UNDO = 40;

// refreshList = false records without re-rendering the sidebar (used while a
// property field is being edited, so the field keeps focus).
export function recordUndoState(refreshList = true) {
  if (app.isSimulating) return;
  const snapshot = engine.exportState(app.currentProjectName);
  undoStack.push(JSON.stringify(snapshot));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
  if (refreshList) updateElementsList();
}

export function performUndo() {
  if (app.isSimulating || undoStack.length === 0) return;
  const current = engine.exportState(app.currentProjectName);
  redoStack.push(JSON.stringify(current));
  const prevJSON = undoStack.pop();
  engine.importState(JSON.parse(prevJSON), false);
  app.selectedItems = [];
  closeContextMenu();
  updateElementsList();
  renderToolProperties(app.activeTool);
}

export function performRedo() {
  if (app.isSimulating || redoStack.length === 0) return;
  const current = engine.exportState(app.currentProjectName);
  undoStack.push(JSON.stringify(current));
  const nextJSON = redoStack.pop();
  engine.importState(JSON.parse(nextJSON), false);
  app.selectedItems = [];
  closeContextMenu();
  updateElementsList();
  renderToolProperties(app.activeTool);
}

btnUndo.addEventListener('click', performUndo);
btnRedo.addEventListener('click', performRedo);

// Playback History buffer for Step Back (⏮)
// In GPU mode particle state lives in VRAM, so frames hold GPU-side buffer
// snapshots (gpuSlot) instead of CPU particle copies.
const historyBuffer = [];
const MAX_HISTORY = 120;

function releaseHistoryFrame(frame) {
  if (frame && frame.gpuSlot && engine.gpuCompute) engine.gpuCompute.releaseHistory(frame.gpuSlot);
}

export function clearHistoryBuffer() {
  for (let i = 0; i < historyBuffer.length; i++) releaseHistoryFrame(historyBuffer[i]);
  historyBuffer.length = 0;
}

export function pushHistoryFrame() {
  if (historyBuffer.length >= MAX_HISTORY) releaseHistoryFrame(historyBuffer.shift());
  const gpuMode = engine.isGPUSimulating();
  const gpuSlot = gpuMode ? engine.gpuCompute.captureHistory() : null;
  const shouldSaveParticles = !gpuMode && engine.particles.length <= 2000;
  historyBuffer.push({
    time: engine.totalTime,
    gpuSlot,
    particles: shouldSaveParticles ? engine.particles.map(p => ({ x: p.pos.x, y: p.pos.y, vx: p.vel.x, vy: p.vel.y })) : [],
    pistons: engine.pistons.map(p => ({ x: p.x, y: p.y, v: p.velocity, temp: p.temperature })),
    walls: engine.walls.map(w => ({ temp: w.temperature, isOpen: w.isOpen })),
    thermalBlocks: engine.thermalBlocks.map(b => ({ temp: b.temperature }))
  });
}

export function popHistoryFrame() {
  if (historyBuffer.length === 0) {
    engine.restoreInitialSnapshot();
    return;
  }
  const frame = historyBuffer.pop();
  engine.totalTime = frame.time;
  for (let i = 0; i < Math.min(engine.pistons.length, frame.pistons.length); i++) {
    engine.pistons[i].x = frame.pistons[i].x;
    engine.pistons[i].y = frame.pistons[i].y;
    engine.pistons[i].velocity = frame.pistons[i].v;
    engine.pistons[i].temperature = frame.pistons[i].temp;
  }
  for (let i = 0; i < Math.min(engine.walls.length, frame.walls.length); i++) {
    engine.walls[i].temperature = frame.walls[i].temp;
    engine.walls[i].isOpen = frame.walls[i].isOpen;
  }
  for (let i = 0; i < Math.min(engine.thermalBlocks.length, frame.thermalBlocks.length); i++) {
    engine.thermalBlocks[i].temperature = frame.thermalBlocks[i].temp;
  }
  if (frame.gpuSlot) {
    engine.restoreGPUHistory(frame.gpuSlot);
  } else if (frame.particles.length > 0) {
    for (let i = 0; i < Math.min(engine.particles.length, frame.particles.length); i++) {
      engine.particles[i].pos.set(frame.particles[i].x, frame.particles[i].y);
      engine.particles[i].vel.set(frame.particles[i].vx, frame.particles[i].vy);
    }
    engine.syncParticlesToGPU();
  }
  engine.syncWallsToGPU();
}
