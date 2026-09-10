/**
 * SequencerTimeline.js
 * Horizontal Step Cards & Transition Nodes Timeline Track.
 * Features expandable Element Accordions with settings inspection and smooth Camera Focus.
 */

import { SequencerActionFields } from './SequencerActionFields.js';
import { SequencerSummary } from './SequencerSummary.js';

export class SequencerTimeline {
  constructor(engine, callbacks = {}, renderer = null) {
    this.engine = engine;
    this.callbacks = callbacks;
    this.renderer = renderer;
    this.trackEl = document.getElementById('seqTimelineTrack');
    this.expandedActions = new Set(); // Stores expanded action keys: `${sIdx}_${aIdx}`
  }

  init() {
    this.render();
  }

  render() {
    const sequencer = this.engine.sequencer;
    if (!this.trackEl || !sequencer) return;

    this.trackEl.innerHTML = '';
    const steps = sequencer.steps || [];
    const totalSteps = steps.length;

    steps.forEach((step, sIdx) => {
      // 1. Step Card
      const stepCard = this._createStepCard(step, sIdx, totalSteps, sequencer);
      this.trackEl.appendChild(stepCard);

      // 2. Transition Gate (between steps)
      if (sIdx < totalSteps - 1 || sequencer.isLooping) {
        const transNode = this._createTransitionNode(step, sIdx, totalSteps, sequencer);
        this.trackEl.appendChild(transNode);
      }
    });

    // 3. Add Step Placeholder at end
    const addPlaceholder = document.createElement('div');
    addPlaceholder.className = 'seq-add-card-placeholder';
    addPlaceholder.title = 'Append New Step';
    addPlaceholder.innerHTML = `
      <div class="seq-add-card-inner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Add Step</span>
      </div>
    `;
    addPlaceholder.addEventListener('click', () => {
      sequencer.addStep();
      this.render();
      if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
    });
    this.trackEl.appendChild(addPlaceholder);
  }

  _createStepCard(step, sIdx, totalSteps, sequencer) {
    const card = document.createElement('div');
    const isActive = sequencer.isEnabled && sequencer.activeStepIndex === sIdx;
    card.className = `seq-step-card ${isActive ? 'is-active' : ''}`;
    card.setAttribute('data-step-index', sIdx);

    const actions = step.actions || [];
    let actionsHtml = '';

    if (actions.length === 0) {
      actionsHtml = `
        <div class="seq-no-actions" style="font-size:11px; color:var(--text-dim); font-style:italic; padding:8px 0; text-align:center;">
          No element actions assigned
        </div>
      `;
    } else {
      actions.forEach((act, aIdx) => {
        const item = this._findTargetItem(act.targetId);
        const tag = (act.type || 'ITEM').toUpperCase().substring(0, 7);
        const label = item?.label || item?.name || `${act.type} ${act.targetId ? act.targetId.substring(0, 6) : ''}`;
        const key = `${sIdx}_${aIdx}`;
        const isExpanded = this.expandedActions.has(key);

        actionsHtml += `
          <div class="seq-action-card ${isExpanded ? 'is-expanded' : ''}" data-step="${sIdx}" data-action="${aIdx}">
            <div class="seq-action-header" data-step="${sIdx}" data-action="${aIdx}" title="Click to edit properties & zoom canvas">
              <div class="seq-action-header-left">
                <span class="seq-action-arrow">${isExpanded ? '▼' : '▶'}</span>
                <span class="seq-tag-mini">${tag}</span>
                <span class="seq-action-title">${label}</span>
              </div>
              <div class="seq-action-tools">
                <button class="seq-act-btn btn-del-action" title="Remove Action" data-step="${sIdx}" data-action="${aIdx}">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            ${isExpanded ? `<div class="seq-action-body" id="seqAccBody_${sIdx}_${aIdx}"></div>` : ''}
          </div>
        `;
      });
    }

    card.innerHTML = `
      <div class="seq-step-header">
        <div class="seq-step-title-group">
          <span class="seq-step-pill">STEP ${sIdx + 1}</span>
          <input type="text" class="seq-step-name-input" value="${step.name}" title="Click to rename step">
        </div>
        <div class="seq-step-actions-nav">
          <button class="seq-nav-btn btn-move-left" ${sIdx === 0 ? 'disabled' : ''} title="Move Left">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="seq-nav-btn btn-move-right" ${sIdx === totalSteps - 1 ? 'disabled' : ''} title="Move Right">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button class="seq-nav-btn btn-duplicate-step" title="Duplicate Step">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="seq-nav-btn btn-delete-step" title="Delete Step">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <div class="seq-step-body">
        <div class="seq-actions-list">${actionsHtml}</div>
        <button class="seq-btn-add-element" data-step="${sIdx}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>+ Add Element</span>
        </button>
      </div>
    `;

    // Step event bindings
    card.querySelector('.seq-step-name-input')?.addEventListener('change', (e) => {
      step.name = e.target.value.trim() || `Step ${sIdx + 1}`;
    });
    card.querySelector('.btn-move-left')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sequencer.moveStep(sIdx, sIdx - 1);
      this.render();
      if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
    });
    card.querySelector('.btn-move-right')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sequencer.moveStep(sIdx, sIdx + 1);
      this.render();
      if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
    });
    card.querySelector('.btn-duplicate-step')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sequencer.duplicateStep(sIdx);
      this.render();
      if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
    });
    card.querySelector('.btn-delete-step')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sequencer.removeStep(sIdx);
      this.render();
      if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
    });
    card.querySelector('.seq-btn-add-element')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof this.callbacks.onAddElement === 'function') this.callbacks.onAddElement(sIdx);
    });

    // Accordion Header Click: Toggle expand & zoom to canvas element WITHOUT opening modal
    card.querySelectorAll('.seq-action-header').forEach(hdr => {
      hdr.addEventListener('click', (e) => {
        if (e.target.closest('.seq-action-tools')) return;
        const aIdx = parseInt(hdr.getAttribute('data-action'), 10);
        const key = `${sIdx}_${aIdx}`;
        const act = step.actions[aIdx];
        const item = this._findTargetItem(act?.targetId);

        if (this.expandedActions.has(key)) {
          this.expandedActions.delete(key);
          const rend = this.renderer || this.engine?.renderer || window.renderer;
          if (rend) rend.highlightedSequencerItem = null;
        } else {
          this.expandedActions.clear();
          this.expandedActions.add(key);
          if (item) this._focusCameraOnItem(item);
        }
        this.render();
      });
    });

    // Delete action button
    card.querySelectorAll('.btn-del-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const aIdx = parseInt(btn.getAttribute('data-action'), 10);
        this.expandedActions.delete(`${sIdx}_${aIdx}`);
        sequencer.removeAction(sIdx, aIdx);
        this.render();
        if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
      });
    });

    // Populate interactive controls for expanded actions
    actions.forEach((act, aIdx) => {
      const key = `${sIdx}_${aIdx}`;
      if (this.expandedActions.has(key)) {
        const body = card.querySelector(`#seqAccBody_${sIdx}_${aIdx}`);
        const item = this._findTargetItem(act.targetId);
        if (body && item) {
          const pfx = `seqAcc_${sIdx}_${aIdx}_`;
          SequencerActionFields.renderFields(body, item, act, (updated) => {
            Object.assign(act, updated);
            if (typeof this.callbacks.onStepModified === 'function') this.callbacks.onStepModified();
          }, pfx);
        }
      }
    });

    return card;
  }

  _focusCameraOnItem(item) {
    const rend = this.renderer || this.engine?.renderer || window.renderer;
    if (!rend || !item) return;

    let cx = 400, cy = 300;
    if (typeof item.getBounds === 'function') {
      const b = item.getBounds();
      cx = (b.left + b.right) / 2;
      cy = (b.top + b.bottom) / 2;
    } else if (item.p1 && item.p2) {
      cx = (item.p1.x + item.p2.x) / 2;
      cy = (item.p1.y + item.p2.y) / 2;
    } else if (item.x !== undefined && item.y !== undefined) {
      cx = item.x + (item.width || item.w || 40) / 2;
      cy = item.y + (item.height || item.h || 40) / 2;
    }

    const leftBarW = document.getElementById('leftSidebar')?.offsetWidth || 340;
    const rightBar = document.getElementById('sidebarRight');
    const rightBarW = (rightBar && rightBar.style.display !== 'none' && !rightBar.classList.contains('collapsed')) ? rightBar.offsetWidth : 0;
    const ribbonH = document.querySelector('.ribbon-container')?.offsetHeight || 115;
    const dockH = document.getElementById('unifiedBottomDock')?.offsetHeight || 420;

    const screenCenterX = (leftBarW + (window.innerWidth - rightBarW)) / 2;
    const screenCenterY = (ribbonH + (window.innerHeight - dockH)) / 2;

    const startPanX = rend.panX;
    const startPanY = rend.panY;
    const startZoom = rend.zoom;
    const endZoom = Math.min(2.2, Math.max(startZoom, 1.25));
    const endPanX = screenCenterX - cx * endZoom;
    const endPanY = screenCenterY - cy * endZoom;

    rend.highlightedSequencerItem = item;

    const startTime = performance.now();
    const duration = 280;
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      rend.panX = startPanX + (endPanX - startPanX) * ease;
      rend.panY = startPanY + (endPanY - startPanY) * ease;
      rend.zoom = startZoom + (endZoom - startZoom) * ease;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _createTransitionNode(step, sIdx, totalSteps, sequencer) {
    const wrap = document.createElement('div');
    wrap.className = 'seq-transition-wrapper';

    const isActive = sequencer.isEnabled && sequencer.activeStepIndex === sIdx;
    const transition = step.transition || step.trigger || { type: 'duration', duration: 1.5 };
    const summary = SequencerSummary.getTransitionSummary(transition);
    const progressPct = isActive ? Math.round(sequencer.stepProgress * 100) : 0;

    wrap.innerHTML = `
      <div class="seq-flow-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div class="seq-transition-node ${isActive ? 'is-active' : ''}" data-step-trans="${sIdx}" title="Click to configure transition conditions">
        <div class="seq-trans-header">
          <span class="seq-trans-tag">TRANSITION</span>
          <svg class="seq-trans-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="seq-trans-desc">${summary}</div>
        <div class="seq-transition-progress-track">
          <div class="seq-transition-progress-fill" style="width: ${progressPct}%;"></div>
        </div>
      </div>
      <div class="seq-flow-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `;

    wrap.querySelector('.seq-transition-node')?.addEventListener('click', () => {
      if (typeof this.callbacks.onEditTransition === 'function') {
        this.callbacks.onEditTransition(sIdx);
      }
    });

    return wrap;
  }

  _findTargetItem(id) {
    if (!id) return null;
    const eng = this.engine;
    return (eng.pistons || []).find(p => p.id === id) ||
           (eng.walls || []).find(w => w.id === id) ||
           (eng.throttleValves || []).find(v => v.id === id) ||
           (eng.reservoirs || []).find(r => r.id === id) ||
           (eng.heatExchangers || []).find(h => h.id === id) ||
           (eng.regenerators || []).find(rg => rg.id === id) ||
           (eng.thermalBlocks || []).find(b => b.id === id) ||
           (eng.emitters || []).find(e => e.id === id) ||
           (eng.sinks || []).find(s => s.id === id) ||
           (eng.regulators || []).find(r => r.id === id);
  }

  updateActiveStep() {
    const sequencer = this.engine.sequencer;
    if (!sequencer || !this.trackEl) return;

    const curIdx = sequencer.activeStepIndex;
    const isRunning = sequencer.isEnabled;

    this.trackEl.querySelectorAll('.seq-step-card').forEach((card, idx) => {
      card.classList.toggle('is-active', isRunning && idx === curIdx);
    });

    this.trackEl.querySelectorAll('.seq-transition-node').forEach((gate, idx) => {
      const isActive = isRunning && idx === curIdx;
      gate.classList.toggle('is-active', isActive);
      const fill = gate.querySelector('.seq-transition-progress-fill');
      if (fill) fill.style.width = isActive ? `${Math.round(sequencer.stepProgress * 100)}%` : '0%';
    });
  }
}
