// Properties panel for the current selection (left sidebar, below the tree).
// Fields come from the element schema; a selection of several elements of one
// type is edited together. Geometry (position/size or length/angle) on top.
import { SensorZone } from '../physics/SensorZone.js';
import { ParticleGroup } from '../physics/ParticleGroup.js';
import { Particle } from '../physics/Particle.js';
import { ELEMENT_TYPES, elementTypeOf, readValues, fieldsFor, setFieldValue } from '../model/elementSchema.js';
import { engine } from './core.js';
import { app } from './state.js';
import { recordUndoState } from './history.js';
import { renderPropertyForm } from './propertyForm.js';
import { renderElementTree, updateElementsList } from './elementTree.js';
import { canGroupSelection, canUngroupSelection, deleteSelectedItems, duplicateSelection, groupSelection, moveSelectedItems, ungroupSelection } from './selection.js';
import { elementName, groupName } from '../model/elementNames.js';
import { getContentBounds, getSingleSegment, setSegmentGeometry, setSelectionSize, shapeKind } from './transform.js';

const panel = document.getElementById('propertiesPanel');
const tagEl = document.getElementById('propertiesTag');
const titleEl = document.getElementById('propertiesTitle');
const infoEl = document.getElementById('propertiesInfo');
const bodyEl = document.getElementById('propertiesBody');

const SHAPE_NAMES = { rect: 'Rectangle', circle: 'Circle', arc: 'Arc', poly: 'Polygon', group: 'Group' };

let renderedKey = '';
let treeRefreshPending = false;

// Tree labels show live values (temperature, rate, ...); refresh at most once per frame.
function scheduleTreeRefresh() {
  if (treeRefreshPending) return;
  treeRefreshPending = true;
  requestAnimationFrame(() => {
    treeRefreshPending = false;
    renderElementTree();
  });
}

function selectionKey() {
  return app.selectedItems.map(i => i.id ?? '').join('|') + `#${app.selectedItems.length}#${app.isSimulating}`;
}

// Common schema type of the selection, or null when mixed / not editable.
function commonType(items) {
  const types = new Set(items.map(elementTypeOf));
  return types.size === 1 ? [...types][0] : null;
}

function headerFor(items, type) {
  const gids = new Set(items.map(i => i.groupId || null));
  const gid = gids.size === 1 ? [...gids][0] : null;
  if (gid && items.length > 1 && engine.elements.filter(e => e.groupId === gid).length === items.length) {
    const kind = shapeKind(gid);
    const what = type === 'wall' ? 'segments' : 'elements';
    return { tag: kind === 'group' ? 'GROUP' : SHAPE_NAMES[kind].toUpperCase(), title: `${groupName(gid, engine)} · ${items.length} ${what}` };
  }
  if (type) {
    const def = ELEMENT_TYPES[type];
    return { tag: def.tag, title: items.length > 1 ? `${items.length} × ${def.label}` : elementName(items[0], engine) };
  }
  return { tag: 'MIXED', title: `${items.length} elements` };
}

// ---------------------------------------------------------------------------
// Geometry: X/Y/W/H of the selection or length/angle of a single segment
// ---------------------------------------------------------------------------
function geometryValues() {
  const seg = getSingleSegment();
  if (seg) {
    const dx = seg.p2.x - seg.p1.x, dy = seg.p2.y - seg.p1.y;
    return { mode: 'segment', L: Math.round(Math.hypot(dx, dy)), A: Math.round(-Math.atan2(dy, dx) * 1800 / Math.PI) / 10 };
  }
  const b = getContentBounds();
  if (!b) return null;
  return { mode: 'box', X: Math.round(b.minX), Y: Math.round(b.minY), W: Math.round(b.width), H: Math.round(b.height) };
}

function renderGeometry(container) {
  const g = geometryValues();
  if (!g) return;
  const fields = g.mode === 'segment' ? [['L', 'Length', 'px'], ['A', 'Angle', '°']] : [['X', 'X'], ['Y', 'Y'], ['W', 'W'], ['H', 'H']];
  container.insertAdjacentHTML('beforeend', `
    <div class="properties-section">Geometry</div>
    <div class="prop-geometry" id="propGeometry">
      ${fields.map(([k, label]) => `<label class="prop-geo-field" title="${label}">${label.length > 1 ? label.slice(0, 1) : label}
        <input type="number" class="prop-num" data-geo="${k}" value="${g[k]}" step="1"></label>`).join('')}
    </div>`);
  container.querySelectorAll('[data-geo]').forEach(input => {
    input.addEventListener('focus', () => recordUndoState(false));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
    input.addEventListener('change', () => applyGeometry(input.dataset.geo, parseFloat(input.value)));
  });
}

function applyGeometry(key, v) {
  if (!Number.isFinite(v)) return;
  const g = geometryValues();
  if (!g) return;
  if (g.mode === 'segment') {
    setSegmentGeometry(getSingleSegment(), key === 'L' ? Math.max(1, v) : g.L, key === 'A' ? v : g.A);
  } else if (key === 'X' || key === 'Y') {
    moveSelectedItems(key === 'X' ? v - g.X : 0, key === 'Y' ? v - g.Y : 0);
  } else {
    setSelectionSize(key === 'W' ? Math.max(1, v) : g.W, key === 'H' ? Math.max(1, v) : g.H);
  }
  scheduleTreeRefresh();
}

// ---------------------------------------------------------------------------
// Extras for single elements
// ---------------------------------------------------------------------------
const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function renderSensorBinding(container, item) {
  const bound = item.pistonBinding?.pistonId || '';
  const edge = item.pistonBinding?.edge || 'right';
  const bound2 = item.pistonBinding2?.pistonId || '';
  const option = (p, sel) => `<option value="${p.id}" ${sel === p.id ? 'selected' : ''}>${escapeAttr(elementName(p, engine))}</option>`;
  const pistons = engine.pistons.map(p => option(p, bound)).join('');
  const others = engine.pistons.filter(p => p.id !== bound).map(p => option(p, bound2)).join('');
  container.insertAdjacentHTML('beforeend', `
    <div class="properties-section">Piston Binding</div>
    <div class="prop-row"><div class="prop-label"><span>Follows Piston</span></div>
      <select class="prop-select" id="propBindPiston"><option value="">None (static zone)</option>${pistons}</select></div>
    <div class="prop-row" ${bound ? '' : 'hidden'} id="propBindEdgeRow"><div class="prop-label"><span>Moving Edge</span></div>
      <select class="prop-select" id="propBindEdge">
        <option value="right" ${edge === 'right' ? 'selected' : ''}>Right edge (zone left of piston)</option>
        <option value="left" ${edge === 'left' ? 'selected' : ''}>Left edge (zone right of piston)</option>
        <option value="bottom" ${edge === 'bottom' ? 'selected' : ''}>Bottom edge (zone above piston)</option>
        <option value="top" ${edge === 'top' ? 'selected' : ''}>Top edge (zone below piston)</option>
      </select></div>
    <div class="prop-row" ${bound ? '' : 'hidden'}><div class="prop-label"><span>Piston on Opposite Edge</span></div>
      <select class="prop-select" id="propBindPiston2" title="For a chamber between two pistons"><option value="">None (fixed edge)</option>${others}</select></div>`);
  const pistonSel = container.querySelector('#propBindPiston');
  const edgeSel = container.querySelector('#propBindEdge');
  const piston2Sel = container.querySelector('#propBindPiston2');
  const OPPOSITE = { right: 'left', left: 'right', bottom: 'top', top: 'bottom' };
  const apply = () => {
    recordUndoState(false);
    const p = engine.getPistonById(pistonSel.value);
    const p2 = p ? engine.getPistonById(piston2Sel.value) : null;
    item.unbindPiston();
    if (p) item.bindToPiston(p, edgeSel.value, true);
    if (p2 && p2 !== p) item.bindToPiston(p2, OPPOSITE[edgeSel.value], true, 2);
    renderInspector(true);
  };
  piston2Sel.addEventListener('change', apply);
  pistonSel.addEventListener('change', () => {
    const p = engine.getPistonById(pistonSel.value);
    if (p) {
      // Pick the edge facing the piston
      const cx = item.x + item.width * 0.5, cy = item.y + item.height * 0.5;
      edgeSel.value = p.orientation === 'horizontal' ? (cx < p.x ? 'right' : 'left') : (cy < p.y ? 'bottom' : 'top');
    }
    apply();
  });
  edgeSel.addEventListener('change', apply);
}

function renderActions(container, items, type) {
  const buttons = [];
  if (canGroupSelection()) buttons.push(['group', 'Group']);
  if (canUngroupSelection()) buttons.push(['ungroup', items.every(i => i.groupId && shapeKind(i.groupId) !== 'group') ? 'Break Shape' : 'Ungroup']);
  if (type === 'gas' && items.length === 1) buttons.push(['particles', 'Select Particles']);
  if (!items.every(i => i instanceof Particle)) buttons.push(['duplicate', 'Duplicate']);
  buttons.push(['delete', 'Delete', 'danger']);
  container.insertAdjacentHTML('beforeend', `<div class="properties-actions">${buttons.map(([a, label, cls]) =>
    `<button type="button" class="prop-action ${cls || ''}" data-action="${a}">${label}</button>`).join('')}</div>`);
  container.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => {
    const a = btn.dataset.action;
    if (a === 'group') groupSelection();
    else if (a === 'ungroup') ungroupSelection();
    else if (a === 'duplicate') duplicateSelection();
    else if (a === 'delete') deleteSelectedItems();
    else if (a === 'particles') {
      const pts = items[0].getActiveParticles(engine);
      pts.forEach(p => { p.selected = true; });
      app.selectedItems = [...pts];
      updateElementsList();
    }
  }));
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------
// Rebuilds the panel when the selection changed (or when forced).
export function renderInspector(force = false) {
  if (!panel) return;
  const key = selectionKey();
  if (!force && key === renderedKey && panel.contains(document.activeElement)) return;
  renderedKey = key;

  const items = app.selectedItems;
  if (items.length === 0 || app.isSimulating) {
    panel.hidden = true;
    bodyEl.innerHTML = '';
    return;
  }
  panel.hidden = false;

  if (items.every(i => i instanceof Particle)) {
    tagEl.textContent = 'PARTICLES';
    titleEl.textContent = `${items.length} particle${items.length > 1 ? 's' : ''}`;
    infoEl.hidden = true;
    bodyEl.innerHTML = '';
    renderActions(bodyEl, items, null);
    return;
  }

  const type = commonType(items);
  const head = headerFor(items, type);
  tagEl.textContent = head.tag;
  titleEl.textContent = head.title;
  bodyEl.innerHTML = '';
  updateInfo();

  if (!items.some(i => i instanceof ParticleGroup)) renderGeometry(bodyEl);

  if (type && fieldsFor(type, 'inspector').length > 0) {
    bodyEl.insertAdjacentHTML('beforeend', '<div class="properties-section">Properties</div><div id="propFields"></div>');
    const values = readValues(type, items[0], 'inspector');
    renderPropertyForm(bodyEl.querySelector('#propFields'), type, values, {
      context: 'inspector',
      onBeginEdit: () => recordUndoState(false),
      onChange: (k, v) => {
        const field = fieldsFor(type, 'inspector').find(f => f.key === k);
        items.forEach(it => setFieldValue(field, it, v, engine));
        updateInfo();
        scheduleTreeRefresh();
      }
    });
  }

  if (items.length === 1 && items[0] instanceof SensorZone) renderSensorBinding(bodyEl, items[0]);
  renderActions(bodyEl, items, type);
}

function updateInfo() {
  const items = app.selectedItems;
  const type = items.length === 1 ? elementTypeOf(items[0]) : null;
  const info = type && ELEMENT_TYPES[type].info;
  infoEl.hidden = !info;
  if (info) infoEl.textContent = info(items[0], engine);
}

// Live values (info line, geometry fields that aren't being edited), ~4 Hz.
export function refreshInspectorLive() {
  if (!panel || panel.hidden) return;
  updateInfo();
  const geo = bodyEl.querySelector('#propGeometry');
  const g = geo && geometryValues();
  if (!g) return;
  geo.querySelectorAll('[data-geo]').forEach(input => {
    if (document.activeElement !== input && g[input.dataset.geo] !== undefined) input.value = g[input.dataset.geo];
  });
}
