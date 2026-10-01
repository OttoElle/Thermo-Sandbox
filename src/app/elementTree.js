// Element tree in the left sidebar: shapes/groups with their segments,
// type icons, names (double-click to rename), live values, search filter,
// hover highlight on the canvas, multi-selection and layer drag & drop.
import { Wall } from '../physics/Wall.js';
import { elementTypeOf } from '../model/elementSchema.js';
import { elementName, groupKindOf, groupName, renameElement, renameGroup } from '../model/elementNames.js';
import { elementCountBadge, elementsListContainer } from './dom.js';
import { engine, renderer } from './core.js';
import { app } from './state.js';
import { recordUndoState } from './history.js';
import { renderInspector } from './inspector.js';
import { deleteSelectedItems, getAllGroupItems } from './selection.js';

// Re-renders the element tree and the properties panel.
export function updateElementsList() {
  renderElementTree();
  renderInspector();
}

const expandedGroups = new Set();
let filterText = '';

// ---------------------------------------------------------------------------
// Icons (taken from the ribbon buttons) and live values
// ---------------------------------------------------------------------------
const TYPE_ICON_SOURCES = {
  wall: '#toolWallPoly', manual_valve: '#toolValveManual', check_valve: '#toolValveCheck', relief_valve: '#toolValvePRV',
  throttle_valve: '#toolValveThrottle', reservoir: '#toolSolidRes', heat_exchanger: '#toolHeatEx', regenerator: '#toolRegen',
  thermal_block: '#toolStorage', emitter: '#toolEmitter', sink: '#toolSink', regulator: '#toolRegulator', gas: '#toolGas',
  sensor: '#toolSensor', text: '#toolText'
};
const PISTON_ICON_SOURCES = { free: '#toolPistonFree', spring: '#toolPistonSpring', motorized: '#toolPistonMotor', damper: '#toolPistonDamper' };
const GROUP_ICON_SOURCES = { rect: '#toolWallRect', circle: '#toolWallCircle', arc: '#toolWallArc', poly: '#toolWallPoly', group: '#btnGroupSelected' };
const iconCache = new Map();

function iconFrom(selector) {
  if (!iconCache.has(selector)) {
    const svg = document.querySelector(`${selector} svg`);
    iconCache.set(selector, svg ? svg.outerHTML.replace(/width="\d+" height="\d+"/, 'width="13" height="13"') : '');
  }
  return iconCache.get(selector);
}

function itemIcon(item) {
  const type = elementTypeOf(item);
  if (type === 'piston') return iconFrom(PISTON_ICON_SOURCES[item.mode] || '#toolPistonFree');
  return iconFrom(TYPE_ICON_SOURCES[type] || '#toolSelect');
}

const K = (t) => `${Math.round(t)} K`;

// Short live value next to the name.
function itemMeta(item) {
  switch (elementTypeOf(item)) {
    case 'wall': return item.conductivity > 0 ? `κ ${item.conductivity.toFixed(2)} · ${K(item.temperature)}` : 'insulated';
    case 'manual_valve': return item.isOpen ? 'open' : 'closed';
    case 'check_valve': return item.allowedDirection > 0 ? 'forward' : 'reverse';
    case 'relief_valve': return `${item.triggerPressure} Pa`;
    case 'throttle_valve': return `${Math.round(item.openRatio * 100)}%`;
    case 'piston': return { free: 'displacer', spring: 'accumulator', motorized: 'compressor', damper: 'expander' }[item.mode] || item.mode;
    case 'reservoir':
    case 'heat_exchanger':
    case 'thermal_block': return K(item.temperature);
    case 'regenerator': return `${K(Math.min(...item.temperatures))}–${K(Math.max(...item.temperatures))}`;
    case 'emitter': return `${item.rate}/s`;
    case 'sink': return item.tempFilterMode === 'all' ? 'all' : `${item.tempFilterMode === 'above' ? '>' : '<'} ${K(item.filterTemperature)}`;
    case 'regulator': return `${item.currentCount || 0}/${item.targetCount}`;
    case 'gas': return `${item.getActiveCount(engine)} pts`;
    case 'sensor': return item.temperature ? K(item.temperature) : '';
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// Tree model: z-ordered entries, grouped elements collected at their first member
// ---------------------------------------------------------------------------
function buildEntries() {
  const entries = [];
  const groups = new Map();
  engine.elements.forEach((item, index) => {
    if (item.groupId) {
      if (!groups.has(item.groupId)) {
        const g = { kind: 'group', groupId: item.groupId, members: [] };
        groups.set(item.groupId, g);
        entries.push(g);
      }
      groups.get(item.groupId).members.push({ item, index });
    } else {
      entries.push({ kind: 'item', item, index });
    }
  });
  // A "group" of one element is shown as that element
  return entries.map(e => (e.kind === 'group' && e.members.length === 1 ? { kind: 'item', ...e.members[0] } : e));
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function treeRowHtml({ index, icon, name, meta, selected, depth = 0, groupId = null, expanded = null, deletable = true, ungroup = false }) {
  const attrs = groupId ? `data-group="${esc(groupId)}"` : `data-index="${index}"`;
  const caret = expanded === null ? '<span class="tree-caret-spacer"></span>'
    : `<button type="button" class="tree-caret" title="${expanded ? 'Collapse' : 'Expand'}">${expanded ? '▾' : '▸'}</button>`;
  return `
    <div class="tree-row ${selected ? 'selected' : ''} ${depth ? 'tree-child' : ''}" ${attrs} ${groupId || depth ? '' : 'draggable="true"'}>
      ${caret}
      <span class="tree-icon">${icon}</span>
      <span class="tree-name" title="Double-click to rename">${esc(name)}</span>
      <span class="tree-meta">${esc(meta)}</span>
      <span class="tree-actions">
        ${ungroup ? '<button type="button" class="tree-btn" data-ungroup title="Ungroup / break shape">⧉</button>' : ''}
        ${deletable ? `<button type="button" class="tree-btn tree-del" title="Delete">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>` : ''}
      </span>
    </div>`;
}

export function renderElementTree() {
  if (!elementsListContainer) return;
  const elements = engine.elements || [];
  elementCountBadge.textContent = elements.length;
  ensureFilterInput();

  if (elements.length === 0) {
    elementsListContainer.innerHTML = '<p class="tree-empty">No elements yet. Pick a tool in the ribbon and draw on the canvas.</p>';
    return;
  }

  const sel = new Set(app.selectedItems);
  const filter = filterText.trim().toLowerCase();
  const matches = (name) => !filter || name.toLowerCase().includes(filter);
  let html = '';

  for (const entry of buildEntries()) {
    if (entry.kind === 'item') {
      const name = elementName(entry.item, engine);
      if (!matches(name)) continue;
      html += treeRowHtml({ index: entry.index, icon: itemIcon(entry.item), name, meta: itemMeta(entry.item), selected: sel.has(entry.item) });
      continue;
    }
    const gname = groupName(entry.groupId, engine);
    const childNames = entry.members.map(m => elementName(m.item, engine));
    if (!matches(gname) && !childNames.some(matches)) continue;
    const allWalls = entry.members.every(m => m.item instanceof Wall);
    const kind = groupKindOf(entry.groupId);
    const expanded = expandedGroups.has(entry.groupId) || (!!filter && !matches(gname));
    html += treeRowHtml({
      groupId: entry.groupId, icon: iconFrom(GROUP_ICON_SOURCES[kind]), name: gname,
      meta: `${entry.members.length} ${allWalls ? 'segments' : 'elements'}`,
      selected: entry.members.every(m => sel.has(m.item)), expanded, ungroup: true
    });
    if (expanded) {
      entry.members.forEach((m, i) => {
        html += treeRowHtml({ index: m.index, depth: 1, icon: itemIcon(m.item), name: childNames[i], meta: itemMeta(m.item), selected: sel.has(m.item), deletable: false });
      });
    }
  }
  elementsListContainer.innerHTML = html || '<p class="tree-empty">No element matches the filter.</p>';
  bindTreeEvents();
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------
function rowItems(row) {
  if (row.dataset.group !== undefined) return engine.elements.filter(e => e.groupId === row.dataset.group);
  const item = engine.elements[parseInt(row.dataset.index, 10)];
  return item ? [item] : [];
}

function selectFromRow(row, e) {
  const items = rowItems(row);
  if (items.length === 0) return;
  if (items.length === 1 && window.sequencerUI?.handleItemPicked(items[0])) return;
  const isChild = row.classList.contains('tree-child');
  const target = isChild ? items : (items[0].groupId ? getAllGroupItems(items[0]) : items);
  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    const allIn = target.every(i => app.selectedItems.includes(i));
    app.selectedItems = allIn ? app.selectedItems.filter(i => !target.includes(i)) : [...app.selectedItems, ...target.filter(i => !app.selectedItems.includes(i))];
  } else {
    app.selectedItems = target;
  }
  updateElementsList();
}

function startRename(row) {
  const nameEl = row.querySelector('.tree-name');
  const items = rowItems(row);
  if (!nameEl || items.length === 0) return;
  const input = document.createElement('input');
  input.className = 'tree-rename';
  input.value = nameEl.textContent;
  nameEl.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const finish = (commit) => {
    if (done) return;
    done = true;
    if (commit && input.value.trim() && input.value !== nameEl.textContent) {
      recordUndoState(false);
      if (row.dataset.group !== undefined) renameGroup(row.dataset.group, input.value, engine);
      else renameElement(items[0], input.value);
    }
    updateElementsList();
    window.sequencerUI?.render();
  };
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') finish(true);
    else if (e.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
}

let dragFromIndex = null;

function bindTreeEvents() {
  elementsListContainer.querySelectorAll('.tree-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.tree-actions') || e.target.closest('.tree-caret') || e.target.closest('.tree-rename')) return;
      selectFromRow(row, e);
    });
    row.querySelector('.tree-name')?.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startRename(row);
    });
    row.addEventListener('mouseenter', () => { renderer.hoverItems = rowItems(row); });
    row.addEventListener('mouseleave', () => { renderer.hoverItems = null; });

    row.querySelector('.tree-caret')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const gid = row.dataset.group;
      if (expandedGroups.has(gid)) expandedGroups.delete(gid);
      else expandedGroups.add(gid);
      renderElementTree();
    });
    row.querySelector('[data-ungroup]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      recordUndoState(false);
      rowItems(row).forEach(i => { delete i.groupId; });
      updateElementsList();
    });
    row.querySelector('.tree-del')?.addEventListener('click', (e) => {
      e.stopPropagation();
      app.selectedItems = rowItems(row);
      deleteSelectedItems();
      renderer.hoverItems = null;
    });

    // Layer order: drag single rows onto another row
    if (row.getAttribute('draggable') === 'true') {
      row.addEventListener('dragstart', (e) => {
        dragFromIndex = parseInt(row.dataset.index, 10);
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(dragFromIndex));
      });
      row.addEventListener('dragend', () => {
        dragFromIndex = null;
        elementsListContainer.querySelectorAll('.tree-row').forEach(r => r.classList.remove('dragging', 'drag-over'));
      });
    }
    if (row.dataset.index !== undefined && !row.classList.contains('tree-child')) {
      row.addEventListener('dragover', (e) => {
        if (dragFromIndex === null) return;
        e.preventDefault();
        row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        const to = parseInt(row.dataset.index, 10);
        if (dragFromIndex !== null && dragFromIndex !== to) {
          recordUndoState(false);
          engine.reorderElements(dragFromIndex, to);
          updateElementsList();
        }
      });
    }
  });

  elementsListContainer.querySelector('.tree-row.selected')?.scrollIntoView({ block: 'nearest' });
}

// Filter box above the tree (created once)
function ensureFilterInput() {
  if (document.getElementById('treeFilter')) return;
  const input = document.createElement('input');
  input.id = 'treeFilter';
  input.type = 'search';
  input.className = 'tree-filter';
  input.placeholder = 'Filter elements…';
  input.addEventListener('input', () => {
    filterText = input.value;
    renderElementTree();
  });
  input.addEventListener('keydown', (e) => e.stopPropagation());
  elementsListContainer.parentElement.insertBefore(input, elementsListContainer);
}

// Live values in the tree (~4 Hz), without rebuilding the rows.
export function refreshTreeLive() {
  if (!elementsListContainer) return;
  elementsListContainer.querySelectorAll('.tree-row[data-index]').forEach(row => {
    const item = engine.elements[parseInt(row.dataset.index, 10)];
    const meta = row.querySelector('.tree-meta');
    if (item && meta) {
      const text = itemMeta(item);
      if (meta.textContent !== text) meta.textContent = text;
    }
  });
}
