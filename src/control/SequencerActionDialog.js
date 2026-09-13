/**
 * SequencerActionDialog.js
 * Floating CAD-Styled Inspector Modal Anchored Next to Canvas Elements.
 * Conforms to TOOL_CATALOG.md and Onshape CAD Tool Dialog visual specifications.
 */

import { SequencerActionFields } from './SequencerActionFields.js';
import { SequencerCatalogDefaults } from './SequencerCatalogDefaults.js';

export class SequencerActionDialog {
  constructor(engine, onActionSaved, renderer = null) {
    this.engine = engine;
    this.renderer = renderer;
    this.onActionSaved = onActionSaved;
    this.isPicking = false;
    this.targetStepIndex = null;
    this.editingActionIndex = null;
    this.selectedItem = null;

    this.dialogEl = null;
    this.toastEl = null;
    this._initDOM();
    this._initDraggable();
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  _initDOM() {
    // 1. Toast Notification for Picking Mode
    let toast = document.getElementById('seqPickToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'seqPickToast';
      toast.className = 'seq-pick-toast';
      toast.style.display = 'none';
      toast.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>Click an element on canvas or in the Elements Outline (ESC to cancel)</span>
      `;
      document.body.appendChild(toast);
    }
    this.toastEl = toast;

    // 2. Floating CAD Action Dialog (Anchored next to element)
    let dialog = document.getElementById('seqActionDialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'seqActionDialog';
      dialog.className = 'tool-dialog-panel seq-floating-action-dialog';
      dialog.style.display = 'none';
      dialog.innerHTML = `
        <div class="tool-dialog-header" id="seqActHeader" title="Drag to move panel">
          <button class="tool-dialog-btn btn-dialog-reset" id="seqActBtnReset" title="Reset to Catalog Defaults">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8m0 0V3m0 5h5"/></svg>
          </button>
          <div class="tool-dialog-title-group">
            <span class="tool-dialog-badge" id="seqActBadge">ACTION</span>
            <span class="tool-dialog-title" id="seqActTitle">Configure Element</span>
          </div>
          <div class="tool-dialog-actions">
            <button class="tool-dialog-btn btn-dialog-close" id="seqActBtnClose" title="Close (Esc)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="tool-dialog-body" id="seqActFormContainer" style="max-height:360px; overflow-y:auto; padding:12px 14px;"></div>
        <div class="modal-actions-row" style="padding:8px 12px; border-top:1px solid var(--border-subtle); display:flex; gap:8px; justify-content:flex-end; align-items:center;">
          <button id="seqActBtnCancel" class="btn-pill btn-secondary-action" style="padding:4px 10px; font-size:11px;">Cancel</button>
          <button id="seqActBtnSave" class="btn-pill btn-primary-action" style="padding:4px 10px; font-size:11px;">Save Action</button>
        </div>
      `;
      document.body.appendChild(dialog);
    }
    this.dialogEl = dialog;

    // Bind buttons
    document.getElementById('seqActBtnClose')?.addEventListener('click', () => this.close());
    document.getElementById('seqActBtnReset')?.addEventListener('click', () => this.resetToDefaults());
    document.getElementById('seqActBtnCancel')?.addEventListener('click', () => this.close());
    document.getElementById('seqActBtnSave')?.addEventListener('click', () => this._saveAction());

    // ESC handling
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.isPicking) this.stopPicking();
        else if (this.dialogEl && this.dialogEl.style.display !== 'none') this.close();
      }
    });
  }

  _initDraggable() {
    const header = document.getElementById('seqActHeader');
    if (!header || !this.dialogEl) return;

    let isDragging = false;
    let startX = 0, startY = 0, initLeft = 0, initTop = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.tool-dialog-actions') || e.target.closest('.btn-dialog-reset')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = this.dialogEl.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;
      header.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.dialogEl.style.left = `${initLeft + dx}px`;
      this.dialogEl.style.top = `${initTop + dy}px`;
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        header.style.cursor = 'move';
      }
    });
  }

  startPicking(stepIndex) {
    this.targetStepIndex = stepIndex;
    this.editingActionIndex = null;
    this.selectedItem = null;
    this.isPicking = true;

    this._setGlowHighlight(null);
    if (this.toastEl) this.toastEl.style.display = 'flex';
    document.body.classList.add('seq-picking-active');
  }

  stopPicking() {
    this.isPicking = false;
    this._setGlowHighlight(null);
    if (this.toastEl) this.toastEl.style.display = 'none';
    document.body.classList.remove('seq-picking-active');
  }

  isPickable(item) {
    if (!item) return false;
    if (item.isParticleGroup || item.label?.includes('Spawner') || item.permeable === 'sensor') return false;
    if (item.contains && item.label && item.pressure !== undefined) return false;
    return true;
  }

  handleItemPicked(item) {
    if (!this.isPicking || !this.isPickable(item)) return false;
    this.stopPicking();
    this.openForElement(item, this.targetStepIndex);
    return true;
  }

  openForElement(item, stepIndex, existingAction = null, actionIndex = null) {
    if (!item) return;
    this.selectedItem = item;
    this.targetStepIndex = stepIndex;
    this.editingActionIndex = actionIndex;

    // 1. Trigger subtle glowing cyan outline on the canvas item
    this._setGlowHighlight(item);

    // 2. Camera focus if element is out of view
    this._centerCameraIfNeeded(item);

    // 3. Populate Title and Form Controls
    const titleEl = document.getElementById('seqActTitle');
    const badgeEl = document.getElementById('seqActBadge');
    const formContainer = document.getElementById('seqActFormContainer');

    const type = SequencerActionFields.getElementType(item);
    if (badgeEl) badgeEl.textContent = type.toUpperCase().replace('_', ' ');
    if (titleEl) titleEl.textContent = `Configure Action: ${item.label || item.name || type}`;

    SequencerActionFields.renderFields(formContainer, item, existingAction || {});

    // 4. Position dialog beside element and clamp to viewport
    if (this.dialogEl) {
      this.dialogEl.style.display = 'flex';
      this._positionNearElement(item);
    }
  }

  _setGlowHighlight(item) {
    const rend = this.renderer || this.engine?.renderer;
    if (rend) {
      rend.highlightedSequencerItem = item;
    }
  }

  _getElementBounds(item) {
    if (!item) return { left: 0, right: 0, top: 0, bottom: 0, cx: 0, cy: 0 };
    if (typeof item.getBounds === 'function') {
      const b = item.getBounds();
      return {
        left: b.left,
        right: b.right,
        top: b.top,
        bottom: b.bottom,
        cx: (b.left + b.right) / 2,
        cy: (b.top + b.bottom) / 2
      };
    }
    if (item.p1 && item.p2) {
      const left = Math.min(item.p1.x, item.p2.x);
      const right = Math.max(item.p1.x, item.p2.x);
      const top = Math.min(item.p1.y, item.p2.y);
      const bottom = Math.max(item.p1.y, item.p2.y);
      return { left, right, top, bottom, cx: (left + right) / 2, cy: (top + bottom) / 2 };
    }
    if (item.x !== undefined && item.y !== undefined) {
      const w = item.width || 40, h = item.height || 40;
      return { left: item.x, right: item.x + w, top: item.y, bottom: item.y + h, cx: item.x + w / 2, cy: item.y + h / 2 };
    }
    return { left: 0, right: 0, top: 0, bottom: 0, cx: 0, cy: 0 };
  }

  _centerCameraIfNeeded(item) {
    const rend = this.renderer || this.engine?.renderer;
    if (!rend) return;

    const b = this._getElementBounds(item);
    const screenCenter = rend.worldToScreen(b.cx, b.cy);

    const leftBarW = document.getElementById('leftSidebar')?.offsetWidth || 340;
    const rightBar = document.getElementById('sidebarRight');
    const rightBarW = (rightBar && rightBar.style.display !== 'none' && !rightBar.classList.contains('collapsed')) ? rightBar.offsetWidth : 0;
    const ribbonH = document.querySelector('.ribbon-container')?.offsetHeight || 115;
    const dockH = document.getElementById('unifiedBottomDock')?.offsetHeight || 420;

    const minX = leftBarW + 60;
    const maxX = window.innerWidth - rightBarW - 60;
    const minY = ribbonH + 50;
    const maxY = window.innerHeight - dockH - 50;

    if (screenCenter.x < minX || screenCenter.x > maxX || screenCenter.y < minY || screenCenter.y > maxY) {
      const targetScreenX = (minX + maxX) / 2;
      const targetScreenY = (minY + maxY) / 2;
      rend.panX = targetScreenX - b.cx * rend.zoom;
      rend.panY = targetScreenY - b.cy * rend.zoom;
    }
  }

  _positionNearElement(item) {
    if (!this.dialogEl) return;
    const rend = this.renderer || this.engine?.renderer;
    if (!rend) return;

    const b = this._getElementBounds(item);
    const screenBoxRight = rend.worldToScreen(b.right, b.top);
    const screenBoxLeft = rend.worldToScreen(b.left, b.top);

    const dialogW = this.dialogEl.offsetWidth || 300;
    const dialogH = this.dialogEl.offsetHeight || 360;

    const leftBarW = document.getElementById('leftSidebar')?.offsetWidth || 340;
    const rightBar = document.getElementById('sidebarRight');
    const rightBarW = (rightBar && rightBar.style.display !== 'none' && !rightBar.classList.contains('collapsed')) ? rightBar.offsetWidth : 0;
    const ribbonH = document.querySelector('.ribbon-container')?.offsetHeight || 115;
    const dockH = document.getElementById('unifiedBottomDock')?.offsetHeight || 420;

    let targetX = screenBoxRight.x + 16;
    let targetY = screenBoxRight.y - 10;

    // If overflowing right, flip to left of element
    if (targetX + dialogW > window.innerWidth - rightBarW - 10) {
      targetX = screenBoxLeft.x - dialogW - 16;
    }

    // Viewport clamping
    const clampedX = Math.max(leftBarW + 10, Math.min(window.innerWidth - rightBarW - dialogW - 10, targetX));
    const clampedY = Math.max(ribbonH + 10, Math.min(window.innerHeight - dockH - dialogH - 10, targetY));

    this.dialogEl.style.left = `${Math.round(clampedX)}px`;
    this.dialogEl.style.top = `${Math.round(clampedY)}px`;
  }

  _saveAction() {
    if (!this.selectedItem) return;
    const formContainer = document.getElementById('seqActFormContainer');
    const existing = (this.editingActionIndex !== null && this.engine.sequencer?.steps[this.targetStepIndex]?.actions[this.editingActionIndex]) || {};

    const snapshot = SequencerActionFields.extractSnapshot(formContainer, this.selectedItem, existing);

    if (this.editingActionIndex !== null) {
      const step = this.engine.sequencer.steps[this.targetStepIndex];
      if (step && step.actions[this.editingActionIndex]) {
        step.actions[this.editingActionIndex] = snapshot;
      }
    } else {
      this.engine.sequencer.addAction(this.targetStepIndex, snapshot);
    }

    this.close();
    if (typeof this.onActionSaved === 'function') {
      this.onActionSaved(this.targetStepIndex);
    }
  }

  resetToDefaults() {
    if (!this.selectedItem) return;
    const formContainer = document.getElementById('seqActFormContainer');
    if (!formContainer) return;
    const type = SequencerActionFields.getElementType(this.selectedItem);
    const defaults = SequencerCatalogDefaults.getDefaultsForType(type);
    defaults.type = type;
    SequencerActionFields.renderFields(formContainer, this.selectedItem, defaults);
  }

  close() {
    this._setGlowHighlight(null);
    if (this.dialogEl) this.dialogEl.style.display = 'none';
    this.selectedItem = null;
    this.editingActionIndex = null;
  }
}
