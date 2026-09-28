// Elements outline list and group management in the left sidebar.
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
import { Regulator } from '../physics/Regulator.js';
import { ThrottleValve } from '../physics/ThrottleValve.js';
import { elementCountBadge, elementsListContainer } from './dom.js';
import { engine } from './core.js';
import { app } from './state.js';
import { recordUndoState } from './history.js';
import { attachDualInput, makeDualInput } from './fields.js';
import { renderItemAccordionBody } from './inspector.js';
import { deleteSelectedItems, getAllGroupItems } from './selection.js';

// ============================================================================
// Interactive Canvas Elements Outline List
// ============================================================================
function getElementInfo(item, index) {
  if (item instanceof Wall) {
    const vLabel = item.type === 'manual_valve' ? `Valve ${index + 1}` : (item.type === 'check_valve' ? `Check Valve ${index + 1}` : (item.type === 'relief_valve' ? `PRV Valve ${index + 1}` : `Wall ${index + 1} (${item.conductivity > 0 ? 'Conductive' : 'Insulated'})`));
    return { tag: 'WALL', label: vLabel };
  } else if (item instanceof ThrottleValve) {
    return { tag: 'THROTTLE', label: `Throttle Valve ${index + 1} [${Math.round(item.openRatio * 100)}%]` };
  } else if (item instanceof Piston) {
    const modeLabels = { free: 'displacer', spring: 'accumulator', motorized: 'compressor', damper: 'expander' };
    const mLabel = modeLabels[item.mode] || item.mode;
    return { tag: 'PISTON', label: `Piston ${index + 1} (${mLabel})` };
  } else if (item instanceof Reservoir) {
    return { tag: 'SINK', label: `Sink [${Math.round(item.temperature)}K]` };
  } else if (item instanceof HeatExchanger) {
    return { tag: 'HX', label: `Heat Exchanger [${Math.round(item.temperature)}K]` };
  } else if (item instanceof RegeneratorMatrix) {
    const minT = Math.round(Math.min(...item.temperatures));
    const maxT = Math.round(Math.max(...item.temperatures));
    return { tag: 'REGEN', label: `Regenerator [${minT}-${maxT}K]` };
  } else if (item instanceof ThermalBlock) {
    return { tag: 'RESSAVOIR', label: `Ressavoir [${Math.round(item.temperature)}K]` };
  } else if (item instanceof SensorZone) {
    return { tag: 'SENSOR', label: item.label };
  } else if (item instanceof Emitter) {
    return { tag: 'SOURCE', label: `Emitter (${item.rate}/s)` };
  } else if (item instanceof Sink) {
    return { tag: 'ABSORBER', label: 'Absorber' };
  } else if (item instanceof Regulator) {
    return { tag: 'REGULATOR', label: `Regulator [${item.currentCount || 0}/${item.targetCount} pts]` };
  } else if (item instanceof TextLabel) {
    return { tag: 'NOTE', label: `"${item.text}"` };
  } else if (item instanceof ParticleGroup) {
    const activeCount = item.getActiveCount(engine);
    const avgT = Math.round(item.getAverageTemperature(engine));
    return { tag: 'SPAWNER', label: `${item.label} [${activeCount} pts, ${avgT}K]` };
  }
  return { tag: 'ITEM', label: `Element ${index + 1}` };
}

// ============================================================================
// CAD Feature Tree & Accordion Group Management
// ============================================================================
const treeExpandedGroups = new Set();

export function updateElementCardLabel(itemIndex, newLabel) {
  const card = document.querySelector(`[data-elindex="${itemIndex}"]`);
  if (!card) return;
  const labelSpan = card.querySelector('.element-label-text');
  if (labelSpan) labelSpan.textContent = newLabel;
}

function renderGroupAccordionBody(group, bodyContainer) {
  if (!bodyContainer || !group) return;
  const isAllWalls = group.items.every(i => i instanceof Wall);
  const idPrefix = `grp_${group.id}_`;

  if (isAllWalls) {
    const firstWall = group.items[0];
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:6px;">
        <span style="font-size:10px; color:#38bdf8; font-weight:600;">Batch Group Settings (${group.items.length} Segments)</span>
      </div>
      ${makeDualInput('Conductivity κ', `${idPrefix}wKappa`, 0, 1, 0.05, firstWall.conductivity)}
      ${makeDualInput('Thickness', `${idPrefix}wThick`, 2, 16, 1, firstWall.thickness, 'px')}
      <div class="field-row" style="margin-top:6px;">
        <button id="${idPrefix}ungroupBtn" class="sub-toggle-btn" style="width:100%; justify-content:center; padding:5px 0;">Ungroup Segments</button>
      </div>
    `;
    attachDualInput(`${idPrefix}wKappa`, val => {
      group.items.forEach(w => { w.conductivity = val; });
    });
    attachDualInput(`${idPrefix}wThick`, val => {
      group.items.forEach(w => { w.thickness = val; });
    });
    document.getElementById(`${idPrefix}ungroupBtn`)?.addEventListener('click', () => {
      recordUndoState();
      group.items.forEach(w => { delete w.groupId; });
      updateElementsList();
    });
  } else {
    bodyContainer.innerHTML = `
      <div class="field-row" style="margin-bottom:6px;">
        <span style="font-size:10px; color:#38bdf8; font-weight:600;">Group Settings (${group.items.length} Elements)</span>
      </div>
      <div class="field-row" style="margin-top:6px;">
        <button id="${idPrefix}ungroupBtn" class="sub-toggle-btn" style="width:100%; justify-content:center; padding:5px 0;">Ungroup Elements</button>
      </div>
    `;
    document.getElementById(`${idPrefix}ungroupBtn`)?.addEventListener('click', () => {
      recordUndoState();
      group.items.forEach(i => { delete i.groupId; });
      updateElementsList();
    });
  }
}

export function updateElementsList() {
  if (!elementsListContainer) return;
  const elements = engine.elements || [];

  elementCountBadge.textContent = elements.length;

  if (elements.length === 0) {
    elementsListContainer.innerHTML = '<p class="empty-cell" style="padding:8px 0;">No elements on canvas</p>';
    return;
  }

  // Group elements for Feature Tree: standalone items vs group clusters
  const treeEntries = [];
  const groupMap = new Map();

  elements.forEach((item, index) => {
    if (item.groupId) {
      if (!groupMap.has(item.groupId)) {
        const grp = {
          type: 'group',
          groupId: item.groupId,
          items: []
        };
        groupMap.set(item.groupId, grp);
        treeEntries.push(grp);
      }
      groupMap.get(item.groupId).items.push({ item, index });
    } else {
      treeEntries.push({ type: 'single', item, index });
    }
  });

  let html = '';
  treeEntries.forEach(entry => {
    if (entry.type === 'single') {
      const { item, index } = entry;
      const info = getElementInfo(item, index);
      const isSel = app.selectedItems.includes(item);
      html += `
        <div class="element-item-card ${isSel ? 'selected' : ''}" data-elindex="${index}">
          <div class="element-item-header" draggable="true">
            <div class="element-item-info">
              <span class="element-drag-handle" title="Drag to reorder layer">::</span>
              <span style="font-size:8px; color:var(--text-dim);">${isSel ? '▾' : '▸'}</span>
              <span class="element-item-tag" style="font-size:9px; font-weight:700; color:var(--accent); background:rgba(56,189,248,0.1); padding:1px 4px; border-radius:3px;">${info.tag}</span>
              <span class="element-label-text">${info.label}</span>
            </div>
            <div class="element-item-actions">
              <button class="element-item-btn element-item-del" data-delindex="${index}" title="Delete Element">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          ${isSel ? `<div class="element-accordion-body" id="accBody_${index}" draggable="false"></div>` : ''}
        </div>
      `;
    } else {
      const { groupId, items } = entry;
      const groupItemsList = items.map(x => x.item);
      const isGroupSelected = groupItemsList.length > 0 && groupItemsList.every(i => app.selectedItems.includes(i));
      const isExpanded = treeExpandedGroups.has(groupId);

      let groupTag = 'GROUP';
      let groupLabel = `Group (${items.length} items)`;
      if (groupId.startsWith('g_circle_')) {
        groupTag = 'CIRCLE';
        groupLabel = `Circle Wall (${items.length} segments)`;
      } else if (groupId.startsWith('g_arc_')) {
        groupTag = 'ARC';
        groupLabel = `Arc Wall (${items.length} segments)`;
      } else if (groupId.startsWith('g_rect_')) {
        groupTag = 'RECT';
        groupLabel = `Rectangle Wall (${items.length} segments)`;
      } else if (groupId.startsWith('g_poly_')) {
        groupTag = 'POLYGON';
        groupLabel = `Polygon Wall (${items.length} segments)`;
      }

      let childrenHtml = '';
      if (isExpanded) {
        childrenHtml = `
          <div class="tree-children-container">
            ${items.map(({ item: child, index: childIdx }, sIdx) => {
              const isChildSel = app.selectedItems.includes(child);
              return `
                <div class="tree-child-item ${isChildSel ? 'selected' : ''}" data-childindex="${childIdx}" title="Click to inspect segment">
                  <span>↳ Segment #${sIdx + 1}</span>
                  <span style="font-size:8.5px; opacity:0.6;">#${childIdx + 1}</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      html += `
        <div class="element-item-card tree-group-card ${isGroupSelected ? 'selected' : ''}" data-groupid="${groupId}">
          <div class="element-item-header tree-group-header">
            <div class="element-item-info">
              <span class="tree-toggle-arrow" data-togglegroup="${groupId}" title="Toggle Feature Tree">${isExpanded ? '▼' : '▶'}</span>
              <span class="element-item-tag" style="font-size:9px; font-weight:700; color:#38bdf8; background:rgba(56,189,248,0.15); padding:1px 4px; border-radius:3px;">${groupTag}</span>
              <span class="element-label-text" style="font-weight:600;">${groupLabel}</span>
            </div>
            <div class="element-item-actions">
              <button class="element-item-btn element-group-del" data-delgroup="${groupId}" title="Delete Entire Group">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          ${isGroupSelected ? `<div class="element-accordion-body" id="groupAccBody_${groupId}" draggable="false"></div>` : ''}
          ${childrenHtml}
        </div>
      `;
    }
  });

  elementsListContainer.innerHTML = html;

  // Render accordion bodies
  treeEntries.forEach(entry => {
    if (entry.type === 'single') {
      const { item, index } = entry;
      if (app.selectedItems.includes(item)) {
        const body = document.getElementById(`accBody_${index}`);
        if (body) {
          renderItemAccordionBody(item, body, index);
        }
      }
    } else {
      const { groupId, items } = entry;
      const groupItemsList = items.map(x => x.item);
      const isGroupSelected = groupItemsList.length > 0 && groupItemsList.every(i => app.selectedItems.includes(i));
      if (isGroupSelected) {
        const body = document.getElementById(`groupAccBody_${groupId}`);
        if (body) {
          renderGroupAccordionBody({ id: groupId, items: groupItemsList }, body);
        }
      }
    }
  });

  // Feature Tree toggle arrow click
  elementsListContainer.querySelectorAll('.tree-toggle-arrow').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gid = btn.dataset.togglegroup;
      if (treeExpandedGroups.has(gid)) treeExpandedGroups.delete(gid);
      else treeExpandedGroups.add(gid);
      updateElementsList();
    });
  });

  // Group Header click: select/deselect all in group
  elementsListContainer.querySelectorAll('.tree-group-header').forEach(hdr => {
    hdr.addEventListener('click', (e) => {
      if (e.target.closest('.element-item-actions') || e.target.closest('.tree-toggle-arrow')) return;
      const card = hdr.closest('.tree-group-card');
      const gid = card.dataset.groupid;
      const grp = groupMap.get(gid);
      if (grp) {
        const groupItemsList = grp.items.map(x => x.item);
        const isAllSelected = groupItemsList.length > 0 && groupItemsList.every(i => app.selectedItems.includes(i));
        if (isAllSelected && app.selectedItems.length === groupItemsList.length) {
          app.selectedItems = [];
        } else {
          app.selectedItems = [...groupItemsList];
        }
        updateElementsList();
      }
    });
  });

  // Group Delete button
  elementsListContainer.querySelectorAll('.element-group-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gid = btn.dataset.delgroup;
      const grp = groupMap.get(gid);
      if (grp) {
        app.selectedItems = grp.items.map(x => x.item);
        deleteSelectedItems();
      }
    });
  });

  // Child item click in Feature Tree
  elementsListContainer.querySelectorAll('.tree-child-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const childIdx = parseInt(el.dataset.childindex, 10);
      const childItem = elements[childIdx];
      if (childItem && window.sequencerUI && window.sequencerUI.handleItemPicked(childItem)) {
        return;
      }
      if (childItem) {
        app.selectedItems = [childItem];
        updateElementsList();
      }
    });
  });

  // Drag and Drop Layer Reordering (Single item cards)
  let draggedCardIdx = null;
  let hasDragged = false;
  const cards = elementsListContainer.querySelectorAll('.element-item-card[data-elindex]');

  cards.forEach(card => {
    const header = card.querySelector('.element-item-header');
    if (header) {
      header.addEventListener('dragstart', (e) => {
        if (e.target.closest('.element-item-del') || e.target.closest('button')) {
          e.preventDefault();
          return;
        }
        hasDragged = true;
        draggedCardIdx = parseInt(card.dataset.elindex, 10);
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(draggedCardIdx));
      });

      header.addEventListener('dragend', () => {
        cards.forEach(c => {
          c.classList.remove('dragging');
          c.classList.remove('drag-over');
        });
        draggedCardIdx = null;
        setTimeout(() => { hasDragged = false; }, 50);
      });
    }

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const targetIdx = parseInt(card.dataset.elindex, 10);
      if (draggedCardIdx !== null && draggedCardIdx !== targetIdx && !isNaN(targetIdx)) {
        recordUndoState();
        engine.reorderElements(draggedCardIdx, targetIdx);
        updateElementsList();
      }
    });
  });

  // Single card header click: select / accordion toggle
  elementsListContainer.querySelectorAll('.element-item-card[data-elindex] > .element-item-header').forEach(hdr => {
    hdr.addEventListener('click', (e) => {
      if (hasDragged || e.target.closest('.element-item-actions')) return;
      const card = hdr.closest('.element-item-card');
      const idx = parseInt(card.dataset.elindex, 10);
      const item = elements[idx];
      if (item && window.sequencerUI && window.sequencerUI.handleItemPicked(item)) {
        return;
      }
      if (item) {
        if (app.selectedItems.includes(item) && app.selectedItems.length === 1) {
          app.selectedItems = [];
        } else {
          app.selectedItems = item.groupId ? getAllGroupItems(item) : [item];
        }
        updateElementsList();
      }
    });
  });

  // Single card delete button
  elementsListContainer.querySelectorAll('.element-item-card[data-elindex] .element-item-del').forEach(delBtn => {
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(delBtn.dataset.delindex, 10);
      const item = elements[idx];
      if (item) {
        app.selectedItems = [item];
        deleteSelectedItems();
      }
    });
  });
}
