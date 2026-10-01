// Transform frame for the selection: resize (8 handles / frame edges),
// rotate (handle above the frame or just outside a corner) and the
// linked-vertex editing of wall shapes. Geometry is always recomputed from
// the snapshot taken at drag start, so repeated moves don't accumulate error.
import { Wall } from '../physics/Wall.js';
import { Piston } from '../physics/Piston.js';
import { SensorZone } from '../physics/SensorZone.js';
import { TextLabel } from '../physics/TextLabel.js';
import { ThrottleValve } from '../physics/ThrottleValve.js';
import { ParticleGroup } from '../physics/ParticleGroup.js';
import { Particle } from '../physics/Particle.js';
import { engine, renderer } from './core.js';
import { app, pointer } from './state.js';
import { snapToGrid } from './fields.js';
import { formatLengthAngle } from './dimensions.js';
import { groupName } from '../model/elementNames.js';

const FRAME_PAD_PX = 8;       // frame drawn this far outside the content
const HANDLE_HIT_PX = 7;
const EDGE_HIT_PX = 5;
const ROT_ZONE_PX = 22;       // band outside a corner that rotates
const ROT_HANDLE_PX = 26;     // rotate handle distance above the frame
const ROT_SNAP = Math.PI / 12; // 15°
const MIN_SIZE = 10;
const VERTEX_EPS = 0.01;

const DIRS = ['right', 'down', 'left', 'up'];

// ---------------------------------------------------------------------------
// Item classification & bounds
// ---------------------------------------------------------------------------
function itemKind(item) {
  if (item instanceof Wall || item instanceof ThrottleValve) return 'segment';
  if (item instanceof Piston) return 'piston';
  if (item instanceof TextLabel) return 'label';
  if (item instanceof ParticleGroup || item instanceof Particle) return null;
  if (item.x !== undefined && item.width !== undefined) return 'box';
  return null;
}

// Wall shape kind from the group id prefix set by the drawing tools.
export function shapeKind(groupId) {
  if (!groupId) return null;
  const m = /^g_(rect|circle|arc|poly)_/.exec(groupId);
  return m ? m[1] : 'group';
}

function transformTargets() {
  return app.selectedItems.filter(i => itemKind(i) !== null);
}

function addItemBounds(item, b) {
  const kind = itemKind(item);
  if (kind === 'segment') {
    b.minX = Math.min(b.minX, item.p1.x, item.p2.x);
    b.maxX = Math.max(b.maxX, item.p1.x, item.p2.x);
    b.minY = Math.min(b.minY, item.p1.y, item.p2.y);
    b.maxY = Math.max(b.maxY, item.p1.y, item.p2.y);
  } else if (kind === 'piston' || kind === 'label') {
    const r = item.getBounds();
    b.minX = Math.min(b.minX, r.left);
    b.maxX = Math.max(b.maxX, r.right);
    b.minY = Math.min(b.minY, r.top);
    b.maxY = Math.max(b.maxY, r.bottom);
  } else if (kind === 'box') {
    b.minX = Math.min(b.minX, item.x);
    b.maxX = Math.max(b.maxX, item.x + item.width);
    b.minY = Math.min(b.minY, item.y);
    b.maxY = Math.max(b.maxY, item.y + item.height);
  }
}

export function getContentBounds(items = transformTargets()) {
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  items.forEach(i => addItemBounds(i, b));
  if (b.minX > b.maxX) return null;
  return { ...b, width: b.maxX - b.minX, height: b.maxY - b.minY, cx: (b.minX + b.maxX) * 0.5, cy: (b.minY + b.maxY) * 0.5 };
}

// A single wall, throttle valve or piston keeps its own handles instead.
function usesFrame(targets) {
  if (targets.length === 0) return false;
  if (targets.length === 1 && (itemKind(targets[0]) === 'segment' || itemKind(targets[0]) === 'piston')) return false;
  return true;
}

// Only segments rotate freely; axis-aligned elements turn in 90° steps.
function canRotateFreely(targets) {
  return targets.every(i => itemKind(i) === 'segment');
}

// ---------------------------------------------------------------------------
// Frame geometry (world coordinates, pad/handle sizes constant on screen)
// ---------------------------------------------------------------------------
function frameGeometry(bounds) {
  const pad = FRAME_PAD_PX / renderer.zoom;
  const x0 = bounds.minX - pad, x1 = bounds.maxX + pad;
  const y0 = bounds.minY - pad, y1 = bounds.maxY + pad;
  const mx = (x0 + x1) * 0.5, my = (y0 + y1) * 0.5;
  return {
    x0, y0, x1, y1,
    handles: [
      { id: 'nw', x: x0, y: y0 }, { id: 'n', x: mx, y: y0 }, { id: 'ne', x: x1, y: y0 },
      { id: 'e', x: x1, y: my }, { id: 'se', x: x1, y: y1 }, { id: 's', x: mx, y: y1 },
      { id: 'sw', x: x0, y: y1 }, { id: 'w', x: x0, y: my }
    ],
    rot: { x: mx, y: y0 - ROT_HANDLE_PX / renderer.zoom }
  };
}

// Vertex handles of wall shapes that may be edited point by point.
function vertexHandles(targets) {
  const walls = targets.filter(i => i instanceof Wall);
  if (walls.length === 0 || walls.length > 32) return [];
  const kinds = new Set(walls.map(w => shapeKind(w.groupId)));
  if (kinds.has('circle') || kinds.has('arc')) return [];
  const pts = [];
  walls.forEach(w => {
    for (const id of ['p1', 'p2']) {
      if (!pts.some(p => Math.abs(p.x - w[id].x) < VERTEX_EPS && Math.abs(p.y - w[id].y) < VERTEX_EPS)) {
        pts.push({ item: w, handleId: id, x: w[id].x, y: w[id].y });
      }
    }
  });
  return pts;
}

// What the renderer draws for the current selection (null: no frame).
export function getTransformFrame() {
  if (app.isSimulating || app.activeTool !== 'select') return null;
  const targets = transformTargets();
  if (!usesFrame(targets)) return null;
  const bounds = getContentBounds(targets);
  if (!bounds) return null;
  const geo = frameGeometry(bounds);
  const groupIds = new Set(targets.map(i => i.groupId || null));
  const gid = groupIds.size === 1 ? [...groupIds][0] : null;
  let label = `${Math.round(bounds.width)} × ${Math.round(bounds.height)}`;
  if (active?.mode === 'rotate') label = `${formatAngle(active.appliedAngle)}`;
  return {
    ...geo,
    vertices: vertexHandles(targets),
    label,
    badge: gid ? shapeBadge(gid, targets.length) : (targets.length > 1 ? `${targets.length} items` : null)
  };
}

export function frameLabelPos(frame) {
  return { x: (frame.x0 + frame.x1) * 0.5, y: frame.y1 + 16 / renderer.zoom, text: frame.label };
}

// Approximate hit box of a HUD label (renderer draws 10.5 px monospace).
function hitsLabel(label, wx, wy) {
  const z = renderer.zoom;
  const halfW = (label.text.length * 6.4 + 12) / z / 2;
  return Math.abs(wx - label.x) < halfW && Math.abs(wy - label.y) < 9 / z;
}

// Length/angle label of a single selected segment, or of the endpoint being dragged.
export function getSelectionHud() {
  if (app.isSimulating || app.activeTool !== 'select') return null;
  const drag = pointer.draggingHandle;
  if (drag?.links) {
    const p = drag.item[drag.handleId];
    return { x: p.x, y: p.y - 22 / renderer.zoom, text: segmentLabel(drag.item) };
  }
  const targets = transformTargets();
  if (targets.length !== 1 || itemKind(targets[0]) !== 'segment') return null;
  const it = targets[0];
  return { x: (it.p1.x + it.p2.x) * 0.5, y: (it.p1.y + it.p2.y) * 0.5 + 18 / renderer.zoom, text: segmentLabel(it) };
}

function shapeBadge(gid, n) {
  return `${groupName(gid, engine)} (${n})`;
}

function formatAngle(rad) {
  let deg = rad * 180 / Math.PI;
  deg = Math.round(deg * 10) / 10;
  return `${deg > 0 ? '+' : ''}${deg}°`;
}

// ---------------------------------------------------------------------------
// Hit testing & cursors
// ---------------------------------------------------------------------------
// Returns { kind: 'resize', handle } | { kind: 'rotate' } | { kind: 'vertex', item, handleId } | null
export function hitTestTransform(wx, wy) {
  const z = renderer.zoom;
  const hud = getSelectionHud();
  if (hud && hitsLabel(hud, wx, wy)) return { kind: 'label' };
  const frame = getTransformFrame();
  if (!frame) return null;
  if (frame.label && hitsLabel(frameLabelPos(frame), wx, wy)) return { kind: 'label' };
  const hit = HANDLE_HIT_PX / z;
  const candidates = [];
  const d = (x, y) => Math.hypot(wx - x, wy - y);

  frame.vertices.forEach(v => candidates.push({ dist: d(v.x, v.y) * 0.9, res: { kind: 'vertex', item: v.item, handleId: v.handleId } }));
  frame.handles.forEach(h => candidates.push({ dist: d(h.x, h.y), res: { kind: 'resize', handle: h.id } }));
  candidates.push({ dist: d(frame.rot.x, frame.rot.y), res: { kind: 'rotate' } });
  const best = candidates.filter(c => c.dist < hit).sort((a, b) => a.dist - b.dist)[0];
  if (best) return best.res;

  // Frame edges resize
  const edge = EDGE_HIT_PX / z;
  const inX = wx > frame.x0 && wx < frame.x1, inY = wy > frame.y0 && wy < frame.y1;
  if (inX && Math.abs(wy - frame.y0) < edge) return { kind: 'resize', handle: 'n' };
  if (inX && Math.abs(wy - frame.y1) < edge) return { kind: 'resize', handle: 's' };
  if (inY && Math.abs(wx - frame.x0) < edge) return { kind: 'resize', handle: 'w' };
  if (inY && Math.abs(wx - frame.x1) < edge) return { kind: 'resize', handle: 'e' };

  // Band just outside a corner rotates
  const band = ROT_ZONE_PX / z;
  for (const c of [[frame.x0, frame.y0, -1, -1], [frame.x1, frame.y0, 1, -1], [frame.x1, frame.y1, 1, 1], [frame.x0, frame.y1, -1, 1]]) {
    const ox = (wx - c[0]) * c[2], oy = (wy - c[1]) * c[3];
    if (ox >= -hit && oy >= -hit && (ox > 0 || oy > 0) && ox < band && oy < band) return { kind: 'rotate' };
  }
  return null;
}

const ROTATE_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="#000" stroke-width="4"/><path d="M20 4v5h-5" stroke="#000" stroke-width="4"/>' +
  '<path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="#fff" stroke-width="2"/><path d="M20 4v5h-5" stroke="#fff" stroke-width="2"/></g></svg>'
)}") 12 12, grab`;

export function cursorForHit(hit) {
  if (!hit) return null;
  if (hit.kind === 'label') return 'text';
  if (hit.kind === 'rotate') return ROTATE_CURSOR;
  if (hit.kind === 'vertex') return 'move';
  return { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' }[hit.handle];
}

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------
function snapshotItem(item) {
  const kind = itemKind(item);
  if (kind === 'segment') return { item, kind, p1: { x: item.p1.x, y: item.p1.y }, p2: { x: item.p2.x, y: item.p2.y } };
  if (kind === 'piston') {
    return { item, kind, x: item.x, y: item.y, width: item.width, height: item.height, orientation: item.orientation, minPos: item.minPos, maxPos: item.maxPos };
  }
  return {
    item, kind, x: item.x, y: item.y, width: item.width, height: item.height,
    direction: item.direction, orientation: item.orientation
  };
}

let active = null;

export function isTransforming() {
  return !!active;
}

export function beginTransform(hit, wx, wy) {
  const targets = transformTargets();
  const bounds = getContentBounds(targets);
  if (!bounds) return false;
  active = {
    mode: hit.kind,
    handle: hit.handle,
    bounds,
    snaps: targets.map(snapshotItem),
    startAngle: Math.atan2(wy - bounds.cy, wx - bounds.cx),
    appliedAngle: 0,
    freeRotation: canRotateFreely(targets)
  };
  return true;
}

export function endTransform() {
  if (!active) return;
  // Sensor zones follow their piston binding; re-anchor it to the new box.
  active.snaps.forEach(s => {
    if (s.item instanceof SensorZone) {
      s.item.volume = s.item.width * s.item.height;
      if (active.mode === 'rotate' && s.item.pistonBinding) s.item.unbindPiston();
      else if (s.item.pistonBinding) updateSensorBinding(s.item);
    }
  });
  active = null;
}

function updateSensorBinding(zone) {
  const pb = zone.pistonBinding;
  if (pb.edge === 'right') pb.fixedOpposite = zone.x;
  else if (pb.edge === 'left') pb.fixedOpposite = zone.x + zone.width;
  else if (pb.edge === 'bottom') pb.fixedOpposite = zone.y;
  else if (pb.edge === 'top') pb.fixedOpposite = zone.y + zone.height;
}

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------
export function updateTransform(wx, wy, mods) {
  if (!active) return;
  if (active.mode === 'resize') applyResize(wx, wy, mods);
  else if (active.mode === 'rotate') applyRotate(wx, wy, mods);
}

function applyResize(wx, wy, mods) {
  const { bounds: b, handle } = active;
  const pad = FRAME_PAD_PX / renderer.zoom;
  const hx = handle.includes('e') ? 1 : (handle.includes('w') ? -1 : 0);
  const hy = handle.includes('s') ? 1 : (handle.includes('n') ? -1 : 0);
  const fromCenter = mods.alt;
  const ax = fromCenter ? b.cx : (hx > 0 ? b.minX : b.maxX);
  const ay = fromCenter ? b.cy : (hy > 0 ? b.minY : b.maxY);

  let sx = 1, sy = 1;
  if (hx !== 0 && b.width > 0.5) {
    const edgeX = snapToGrid(wx - hx * pad);
    const orig = hx > 0 ? b.maxX : b.minX;
    sx = (edgeX - ax) / (orig - ax);
  }
  if (hy !== 0 && b.height > 0.5) {
    const edgeY = snapToGrid(wy - hy * pad);
    const orig = hy > 0 ? b.maxY : b.minY;
    sy = (edgeY - ay) / (orig - ay);
  }
  // No flipping through the anchor; keep a minimum size.
  if (b.width > 0.5) sx = Math.max(sx, MIN_SIZE / b.width);
  if (b.height > 0.5) sy = Math.max(sy, MIN_SIZE / b.height);
  if (mods.shift && hx !== 0 && hy !== 0) sx = sy = Math.max(sx, sy);
  else if (mods.shift && hx !== 0) sy = sx;
  else if (mods.shift && hy !== 0) sx = sy;

  const map = (x, y) => ({ x: ax + (x - ax) * sx, y: ay + (y - ay) * sy });
  active.snaps.forEach(s => scaleItem(s, map, sx, sy));
}

function scaleItem(s, map, sx, sy) {
  const it = s.item;
  if (s.kind === 'segment') {
    const a = map(s.p1.x, s.p1.y), c = map(s.p2.x, s.p2.y);
    it.setPoints(a.x, a.y, c.x, c.y);
  } else if (s.kind === 'piston') {
    const c = map(s.x, s.y);
    it.x = c.x;
    it.y = c.y;
    it.width = Math.max(4, s.width * sx);
    it.height = Math.max(4, s.height * sy);
    if (s.orientation === 'horizontal') {
      it.minPos = map(s.minPos, s.y).x;
      it.maxPos = map(s.maxPos, s.y).x;
    } else {
      it.minPos = map(s.x, s.minPos).y;
      it.maxPos = map(s.x, s.maxPos).y;
    }
    it.centerPos = (it.minPos + it.maxPos) * 0.5;
  } else if (s.kind === 'label') {
    const c = map(s.x, s.y);
    it.x = c.x;
    it.y = c.y;
  } else {
    const a = map(s.x, s.y), c = map(s.x + s.width, s.y + s.height);
    it.x = Math.min(a.x, c.x);
    it.y = Math.min(a.y, c.y);
    it.width = Math.max(MIN_SIZE, Math.abs(c.x - a.x));
    it.height = Math.max(MIN_SIZE, Math.abs(c.y - a.y));
  }
}

// ---------------------------------------------------------------------------
// Rotate
// ---------------------------------------------------------------------------
function applyRotate(wx, wy, mods) {
  const { bounds: b } = active;
  let angle = Math.atan2(wy - b.cy, wx - b.cx) - active.startAngle;
  angle = Math.atan2(Math.sin(angle), Math.cos(angle));
  if (!active.freeRotation) angle = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
  else if (!mods.shift) angle = Math.round(angle / ROT_SNAP) * ROT_SNAP;
  active.appliedAngle = angle;
  rotateSnapshots(active.snaps, b.cx, b.cy, angle);
}

function rotateSnapshots(snaps, cx, cy, angle) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const rot = (x, y) => ({ x: cx + (x - cx) * cos - (y - cy) * sin, y: cy + (x - cx) * sin + (y - cy) * cos });
  const quarter = ((Math.round(angle / (Math.PI / 2)) % 4) + 4) % 4;
  snaps.forEach(s => {
    const it = s.item;
    if (s.kind === 'segment') {
      const a = rot(s.p1.x, s.p1.y), c = rot(s.p2.x, s.p2.y);
      it.setPoints(a.x, a.y, c.x, c.y);
    } else if (s.kind === 'piston') {
      const c = rot(s.x, s.y);
      const odd = quarter % 2 === 1;
      it.x = c.x;
      it.y = c.y;
      it.width = odd ? s.height : s.width;
      it.height = odd ? s.width : s.height;
      it.orientation = odd ? (s.orientation === 'horizontal' ? 'vertical' : 'horizontal') : s.orientation;
      const ends = s.orientation === 'horizontal'
        ? [rot(s.minPos, s.y), rot(s.maxPos, s.y)]
        : [rot(s.x, s.minPos), rot(s.x, s.maxPos)];
      const along = ends.map(p => (it.orientation === 'horizontal' ? p.x : p.y));
      it.minPos = Math.min(...along);
      it.maxPos = Math.max(...along);
      it.centerPos = (it.minPos + it.maxPos) * 0.5;
    } else {
      const odd = quarter % 2 === 1;
      const w = (s.kind === 'box' && odd) ? s.height : s.width;
      const h = (s.kind === 'box' && odd) ? s.width : s.height;
      const c = rot(s.x + s.width * 0.5, s.y + s.height * 0.5);
      it.x = c.x - w * 0.5;
      it.y = c.y - h * 0.5;
      if (s.kind === 'box') {
        it.width = w;
        it.height = h;
        if (s.direction && DIRS.includes(s.direction)) it.direction = DIRS[(DIRS.indexOf(s.direction) + quarter) % 4];
        if (s.orientation) it.orientation = odd ? (s.orientation === 'horizontal' ? 'vertical' : 'horizontal') : s.orientation;
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Exact dimensions (typed on the size label)
// ---------------------------------------------------------------------------
// Current values for the size input: "W, H" of the frame or "L, angle" of a segment.
export function getSelectionSizeText() {
  const seg = getSingleSegment();
  if (seg) {
    const dx = seg.p2.x - seg.p1.x, dy = seg.p2.y - seg.p1.y;
    return `${Math.round(Math.hypot(dx, dy))}, ${Math.round(-Math.atan2(dy, dx) * 1800 / Math.PI) / 10}`;
  }
  const b = getContentBounds();
  return b ? `${Math.round(b.width)}, ${Math.round(b.height)}` : '';
}

// Resizes the selection to w x h, anchored at its top-left corner.
export function setSelectionSize(w, h) {
  const targets = transformTargets();
  const b = getContentBounds(targets);
  if (!b) return;
  const sx = b.width > 0.5 && w > 0 ? w / b.width : 1;
  const sy = b.height > 0.5 && h > 0 ? h / b.height : 1;
  const map = (x, y) => ({ x: b.minX + (x - b.minX) * sx, y: b.minY + (y - b.minY) * sy });
  active = { mode: 'resize', snaps: targets.map(snapshotItem) };
  active.snaps.forEach(s => scaleItem(s, map, sx, sy));
  endTransform();
}

// Sets a single segment to length / angle (degrees), keeping p1 in place.
export function setSegmentGeometry(item, length, angleDeg) {
  const a = angleDeg * Math.PI / 180;
  moveEndpoints(getLinkedEndpoints(item, 'p2'), item.p1.x + Math.cos(a) * length, item.p1.y - Math.sin(a) * length);
}

export function getSingleSegment() {
  const targets = transformTargets();
  return (targets.length === 1 && itemKind(targets[0]) === 'segment') ? targets[0] : null;
}

// ---------------------------------------------------------------------------
// Linked vertices of wall shapes
// ---------------------------------------------------------------------------
// All segment endpoints of the same group sitting on the dragged vertex.
export function getLinkedEndpoints(item, handleId) {
  const p = item[handleId];
  const links = [{ item, handleId }];
  if (!item.groupId) return links;
  const segments = [...engine.walls, ...(engine.throttleValves || [])];
  for (const s of segments) {
    if (s.groupId !== item.groupId) continue;
    for (const id of ['p1', 'p2']) {
      if (s === item && id === handleId) continue;
      if (Math.abs(s[id].x - p.x) < VERTEX_EPS && Math.abs(s[id].y - p.y) < VERTEX_EPS) links.push({ item: s, handleId: id });
    }
  }
  return links;
}

export function moveEndpoints(links, x, y) {
  links.forEach(({ item, handleId }) => {
    item[handleId].x = x;
    item[handleId].y = y;
    item._updateGeometry();
  });
}

// Shift while dragging a segment endpoint: angle in 15° steps around the other end.
export function constrainEndpoint(item, handleId, x, y) {
  const other = handleId === 'p1' ? item.p2 : item.p1;
  const len = Math.hypot(x - other.x, y - other.y);
  const a = Math.round(Math.atan2(y - other.y, x - other.x) / ROT_SNAP) * ROT_SNAP;
  return { x: other.x + Math.cos(a) * len, y: other.y + Math.sin(a) * len };
}

// Length / angle readout for a segment.
export function segmentLabel(item) {
  return formatLengthAngle(item.p2.x - item.p1.x, item.p2.y - item.p1.y);
}
