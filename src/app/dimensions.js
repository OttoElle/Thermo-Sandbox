// Dimensions while drawing: live length/size readouts next to the draft and
// typed input (start typing a number while drawing, Enter applies it).
import { canvas } from './dom.js';
import { renderer } from './core.js';
import { app, pointer } from './state.js';
import { toolConfigs } from './toolPanel.js';
import { createFromDrag, isDragTool, placePolylinePoint } from './canvasInput.js';
import { recordUndoState } from './history.js';
import { updateElementsList } from './elementTree.js';
import { getSelectionSizeText, getSingleSegment, setSegmentGeometry, setSelectionSize } from './transform.js';

const LINE_TOOLS = new Set(['valve', 'throttle_valve']);

// Screen angle convention: 0° points right, counter-clockwise positive.
export function formatLengthAngle(dx, dy) {
  const deg = Math.round(-Math.atan2(dy, dx) * 1800 / Math.PI) / 10;
  return `${Math.round(Math.hypot(dx, dy))} px  ${deg}°`;
}

function draftKind() {
  if (app.activeTool === 'wall') return toolConfigs.wall.shape;
  if (LINE_TOOLS.has(app.activeTool)) return 'line';
  return 'box';
}

// { x, y, text } for the HUD label of the current draft, or null.
export function getDraftMeasurement() {
  if (app.isSimulating || !pointer.currentCursorWorld) return null;
  const cur = pointer.currentCursorWorld;
  const z = renderer.zoom;
  const kind = draftKind();

  if (kind === 'polygon' && pointer.polygonPoints.length > 0) {
    const last = pointer.polygonPoints[pointer.polygonPoints.length - 1];
    return { x: cur.x, y: cur.y + 24 / z, text: formatLengthAngle(cur.x - last.x, cur.y - last.y) };
  }
  if (kind === 'arc' && pointer.arcSteps.length > 0) {
    const c = pointer.arcSteps[0];
    if (pointer.arcSteps.length === 1) return { x: cur.x, y: cur.y + 24 / z, text: `R ${Math.round(Math.hypot(cur.x - c.x, cur.y - c.y))} px` };
    const p1 = pointer.arcSteps[1];
    let sweep = Math.atan2(cur.y - c.y, cur.x - c.x) - Math.atan2(p1.y - c.y, p1.x - c.x);
    if (sweep <= 0) sweep += Math.PI * 2;
    return { x: cur.x, y: cur.y + 24 / z, text: `${Math.round(sweep * 180 / Math.PI)}°` };
  }

  const d = renderer.draftInfo;
  if (!d || !d.start || !d.current || d.tool === 'select') return null;
  const s = d.start, c = d.current;
  if (kind === 'circle') return { x: c.x, y: c.y + 24 / z, text: `R ${Math.round(Math.hypot(c.x - s.x, c.y - s.y))} px` };
  if (kind === 'line') return { x: c.x, y: c.y + 24 / z, text: formatLengthAngle(c.x - s.x, c.y - s.y) };
  return {
    x: (s.x + c.x) * 0.5,
    y: Math.max(s.y, c.y) + 18 / z,
    text: `${Math.round(Math.abs(c.x - s.x))} × ${Math.round(Math.abs(c.y - s.y))}`
  };
}

// ---------------------------------------------------------------------------
// Typed input
// ---------------------------------------------------------------------------
export function hasActiveDraft() {
  if (app.isSimulating) return false;
  if (pointer.pendingStart) return true;
  if (pointer.isMouseDown && pointer.dragStartWorld && isDragTool()) return true;
  return app.activeTool === 'wall' && toolConfigs.wall.shape === 'polygon' && pointer.polygonPoints.length > 0;
}

function inputHint() {
  const kind = draftKind();
  if (kind === 'polygon' || kind === 'line') return 'length, angle°';
  if (kind === 'circle') return 'radius';
  return 'width, height';
}

let dimInput = null;
let inputMode = 'draft'; // 'draft' | 'selection'

function ensureInput() {
  if (dimInput) return dimInput;
  dimInput = document.createElement('input');
  dimInput.type = 'text';
  dimInput.className = 'dim-input';
  dimInput.spellcheck = false;
  dimInput.autocomplete = 'off';
  document.body.appendChild(dimInput);
  dimInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      if (inputMode === 'selection') applySelectionSize(dimInput.value);
      else applyDimensionInput(dimInput.value);
      closeDimensionInput();
    } else if (e.key === 'Escape') {
      closeDimensionInput();
    }
  });
  dimInput.addEventListener('blur', closeDimensionInput);
  return dimInput;
}

export function openDimensionInput(firstChar) {
  // A drag in progress becomes a click-move-click draft, so releasing the
  // mouse while typing doesn't create the element.
  if (pointer.isMouseDown && pointer.dragStartWorld) {
    pointer.pendingStart = pointer.dragStartWorld;
    pointer.isMouseDown = false;
    pointer.dragStartWorld = null;
  }
  inputMode = 'draft';
  showInput(inputHint(), firstChar);
}

// Click on the size label of the selection: edit "W, H" or "length, angle".
export function openSelectionSizeInput() {
  inputMode = 'selection';
  showInput(getSingleSegment() ? 'length, angle°' : 'width, height', getSelectionSizeText());
  dimInput.select();
}

function showInput(placeholder, value) {
  const input = ensureInput();
  const cur = pointer.currentCursorWorld || { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  input.style.left = `${rect.left + cur.x * renderer.zoom + renderer.panX + 14}px`;
  input.style.top = `${rect.top + cur.y * renderer.zoom + renderer.panY + 14}px`;
  input.placeholder = placeholder;
  input.value = value;
  input.style.display = 'block';
  input.focus();
}

function parseNumbers(text) {
  return text.split(/[,;\s×x*]+/).filter(Boolean).map(Number);
}

function applySelectionSize(text) {
  const v = parseNumbers(text);
  if (v.length === 0 || !Number.isFinite(v[0]) || v[0] <= 0) return;
  recordUndoState();
  const seg = getSingleSegment();
  if (seg) {
    const cur = parseNumbers(getSelectionSizeText());
    setSegmentGeometry(seg, v[0], Number.isFinite(v[1]) ? v[1] : cur[1]);
  } else {
    setSelectionSize(v[0], Number.isFinite(v[1]) && v[1] > 0 ? v[1] : 0);
  }
  updateElementsList();
}

function closeDimensionInput() {
  if (dimInput) dimInput.style.display = 'none';
}

// Direction of the cursor relative to p (unit vector; +x if on top of it).
function cursorDirection(p) {
  const cur = pointer.currentCursorWorld || p;
  const len = Math.hypot(cur.x - p.x, cur.y - p.y);
  return len > 0.5 ? { x: (cur.x - p.x) / len, y: (cur.y - p.y) / len } : { x: 1, y: 0 };
}

function pointAt(p, length, angleDeg) {
  if (Number.isFinite(angleDeg)) {
    const a = angleDeg * Math.PI / 180;
    return { x: p.x + Math.cos(a) * length, y: p.y - Math.sin(a) * length };
  }
  const d = cursorDirection(p);
  return { x: p.x + d.x * length, y: p.y + d.y * length };
}

export function applyDimensionInput(text) {
  const v = parseNumbers(text);
  if (v.length === 0 || !Number.isFinite(v[0]) || v[0] <= 0) return;
  const kind = draftKind();

  if (kind === 'polygon') {
    const last = pointer.polygonPoints[pointer.polygonPoints.length - 1];
    if (last) placePolylinePoint(pointAt(last, v[0], v[1]));
    return;
  }
  const s = pointer.pendingStart;
  if (!s) return;
  let end;
  if (kind === 'line') end = pointAt(s, v[0], v[1]);
  else if (kind === 'circle') end = { x: s.x + v[0], y: s.y };
  else {
    const cur = pointer.currentCursorWorld || s;
    const sx = cur.x < s.x ? -1 : 1, sy = cur.y < s.y ? -1 : 1;
    const h = Number.isFinite(v[1]) && v[1] > 0 ? v[1] : v[0];
    end = { x: s.x + sx * v[0], y: s.y + sy * h };
  }
  createFromDrag(s, end);
  pointer.pendingStart = null;
  renderer.draftInfo = null;
}
